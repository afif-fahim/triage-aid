/**
 * Router Hook
 * Provides easy access to routing functionality in components
 */

import { useState, useEffect } from 'preact/hooks';
import {
  routerService,
  type Route,
  type RouteParams,
} from '../services/RouterService';
import type { AppView } from '../types';

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(
    routerService.getCurrentRoute()
  );

  useEffect(() => {
    // Subscribe to route changes
    const unsubscribe = routerService.onRouteChange(setCurrentRoute);

    return unsubscribe;
  }, []);

  return {
    // Current route information
    currentRoute,
    currentView: currentRoute?.view || null,
    params: currentRoute?.params || {},

    // Navigation methods
    navigate: routerService.navigate.bind(routerService),
    navigateToView: routerService.navigateToView.bind(routerService),
    replace: routerService.replace.bind(routerService),
    goBack: routerService.goBack.bind(routerService),
    goForward: routerService.goForward.bind(routerService),

    // URL generation
    generateUrl: routerService.generateUrl.bind(routerService),

    // Navigation guards
    registerNavigationGuard:
      routerService.registerNavigationGuard.bind(routerService),
    removeNavigationGuard:
      routerService.removeNavigationGuard.bind(routerService),
  };
}

/**
 * Hook for getting route parameters with type safety
 */
export function useRouteParams<T extends RouteParams = RouteParams>(): T {
  const { params } = useRouter();
  return params as T;
}

/**
 * Hook for checking if a specific view is active
 */
export function useIsActiveView(view: AppView): boolean {
  const { currentView } = useRouter();
  return currentView === view;
}

/**
 * Hook for navigation with confirmation
 */
export function useNavigateWithConfirmation() {
  const { navigate } = useRouter();

  return async (
    path: string,
    confirmationMessage?: string
  ): Promise<boolean> => {
    if (confirmationMessage) {
      const confirmed = window.confirm(confirmationMessage);
      if (!confirmed) return false;
    }

    return navigate(path);
  };
}
