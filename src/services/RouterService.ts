/**
 * Router Service
 * Handles client-side routing with browser history support
 */

import type { AppView } from '../types';

export interface RouteParams {
  [key: string]: string;
}

export interface Route {
  path: string;
  view: AppView;
  params?: RouteParams;
  title?: string;
  requiresPatient?: boolean;
}

export interface NavigationGuard {
  canLeave: () => boolean | Promise<boolean>;
  message?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

class RouterService {
  private currentRoute: Route | null = null;
  private navigationGuards: Map<AppView, NavigationGuard> = new Map();
  private routeChangeListeners: Array<(route: Route) => void> = [];
  private breadcrumbListeners: Array<(breadcrumbs: BreadcrumbItem[]) => void> =
    [];

  // Route definitions
  private routes: Route[] = [
    { path: '/', view: 'home', title: 'TriageAid' },
    { path: '/dashboard', view: 'dashboard', title: 'Dashboard' },
    { path: '/intake', view: 'intake', title: 'Patient Assessment' },
    {
      path: '/patient/:id',
      view: 'patient-detail',
      title: 'Patient Details',
      requiresPatient: true,
    },
  ];

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', this.handlePopState.bind(this));

    // Handle initial route
    this.handleInitialRoute();
  }

  private handlePopState(_event: Event): void {
    const route = this.parseCurrentUrl();
    if (route) {
      this.navigateToRoute(route, false); // Don't push to history
    }
  }

  private handleInitialRoute(): void {
    const route = this.parseCurrentUrl();
    console.log('Initial route parsing:', {
      path: window.location.pathname,
      route,
    });
    if (route) {
      this.currentRoute = route;
      this.notifyRouteChange(route);
      this.updateBreadcrumbs();
    } else {
      // Default to home if no valid route
      console.log('No valid route found, navigating to home');
      this.navigate('/', true);
    }
  }

  private parseCurrentUrl(): Route | null {
    const path = window.location.pathname;
    return this.matchRoute(path);
  }

  private matchRoute(path: string): Route | null {
    for (const route of this.routes) {
      const match = this.matchPath(route.path, path);
      if (match) {
        return {
          ...route,
          params: match.params,
        };
      }
    }
    return null;
  }

  private matchPath(
    routePath: string,
    actualPath: string
  ): { params: RouteParams } | null {
    const routeParts = routePath.split('/').filter(Boolean);
    const actualParts = actualPath.split('/').filter(Boolean);

    // Handle root path specially
    if (routePath === '/' && actualPath === '/') {
      return { params: {} };
    }

    if (routeParts.length !== actualParts.length) {
      return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const actualPart = actualParts[i];

      if (!routePart || !actualPart) {
        return null;
      }

      if (routePart.startsWith(':')) {
        // Parameter
        const paramName = routePart.slice(1);
        params[paramName] = decodeURIComponent(actualPart);
      } else if (routePart !== actualPart) {
        // Literal path part doesn't match
        return null;
      }
    }

    return { params };
  }

  private buildPath(routePath: string, params?: RouteParams): string {
    if (!params) return routePath;

    let path = routePath;
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
    return path;
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string, replace = false): Promise<boolean> {
    const route = this.matchRoute(path);
    if (!route) {
      console.warn(`No route found for path: ${path}`);
      return false;
    }

    return this.navigateToRoute(route, !replace);
  }

  /**
   * Navigate to a specific view with optional parameters
   */
  async navigateToView(
    view: AppView,
    params?: RouteParams,
    replace = false
  ): Promise<boolean> {
    const route = this.routes.find(r => r.view === view);
    if (!route) {
      console.warn(`No route found for view: ${view}`);
      return false;
    }

    const path = this.buildPath(route.path, params);
    return this.navigate(path, replace);
  }

  private async navigateToRoute(
    route: Route,
    pushToHistory = true
  ): Promise<boolean> {
    // Check navigation guards
    if (this.currentRoute && !(await this.canLeaveCurrentRoute())) {
      return false;
    }

    // Validate route requirements
    if (route.requiresPatient && !route.params?.id) {
      console.warn('Route requires patient ID but none provided');
      return false;
    }

    // Update browser history
    if (pushToHistory) {
      const path = this.buildPath(route.path, route.params);
      window.history.pushState({ route }, route.title || '', path);
    }

    // Update current route
    this.currentRoute = route;

    // Update document title
    if (route.title) {
      document.title = `${route.title} - TriageAid`;
    }

    // Notify listeners
    this.notifyRouteChange(route);
    this.updateBreadcrumbs();

    return true;
  }

  private async canLeaveCurrentRoute(): Promise<boolean> {
    if (!this.currentRoute) return true;

    const guard = this.navigationGuards.get(this.currentRoute.view);
    if (!guard) return true;

    const canLeave = await guard.canLeave();
    if (!canLeave && guard.message) {
      const confirmed = window.confirm(guard.message);
      return confirmed;
    }

    return canLeave;
  }

  /**
   * Register a navigation guard for a specific view
   */
  registerNavigationGuard(view: AppView, guard: NavigationGuard): void {
    this.navigationGuards.set(view, guard);
  }

  /**
   * Remove a navigation guard for a specific view
   */
  removeNavigationGuard(view: AppView): void {
    this.navigationGuards.delete(view);
  }

  /**
   * Add a route change listener
   */
  onRouteChange(listener: (route: Route) => void): () => void {
    this.routeChangeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.routeChangeListeners.indexOf(listener);
      if (index > -1) {
        this.routeChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add a breadcrumb change listener
   */
  onBreadcrumbChange(
    listener: (breadcrumbs: BreadcrumbItem[]) => void
  ): () => void {
    this.breadcrumbListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.breadcrumbListeners.indexOf(listener);
      if (index > -1) {
        this.breadcrumbListeners.splice(index, 1);
      }
    };
  }

  private notifyRouteChange(route: Route): void {
    this.routeChangeListeners.forEach(listener => {
      try {
        listener(route);
      } catch (error) {
        console.error('Error in route change listener:', error);
      }
    });
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = this.generateBreadcrumbs();
    this.breadcrumbListeners.forEach(listener => {
      try {
        listener(breadcrumbs);
      } catch (error) {
        console.error('Error in breadcrumb change listener:', error);
      }
    });
  }

  private generateBreadcrumbs(): BreadcrumbItem[] {
    if (!this.currentRoute) return [];

    const breadcrumbs: BreadcrumbItem[] = [{ label: 'TriageAid', path: '/' }];

    switch (this.currentRoute.view) {
      case 'home':
        if (breadcrumbs[0]) {
          breadcrumbs[0].active = true;
        }
        break;

      case 'dashboard':
        breadcrumbs.push({ label: 'Dashboard', active: true });
        break;

      case 'intake':
        breadcrumbs.push(
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'New Assessment', active: true }
        );
        break;

      case 'patient-detail': {
        const patientId = this.currentRoute.params?.id;
        breadcrumbs.push(
          { label: 'Dashboard', path: '/dashboard' },
          {
            label: patientId
              ? `Patient #${patientId.slice(0, 8).toUpperCase()}`
              : 'Patient Details',
            active: true,
          }
        );
        break;
      }
    }

    return breadcrumbs;
  }

  /**
   * Get current route information
   */
  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  /**
   * Get current view
   */
  getCurrentView(): AppView | null {
    return this.currentRoute?.view || null;
  }

  /**
   * Get current route parameters
   */
  getCurrentParams(): RouteParams {
    return this.currentRoute?.params || {};
  }

  /**
   * Go back in browser history
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Go forward in browser history
   */
  goForward(): void {
    window.history.forward();
  }

  /**
   * Replace current route without adding to history
   */
  async replace(path: string): Promise<boolean> {
    return this.navigate(path, true);
  }

  /**
   * Generate URL for a view with parameters
   */
  generateUrl(view: AppView, params?: RouteParams): string {
    const route = this.routes.find(r => r.view === view);
    if (!route) {
      console.warn(`No route found for view: ${view}`);
      return '/dashboard';
    }

    return this.buildPath(route.path, params);
  }
}

// Export singleton instance
export const routerService = new RouterService();
