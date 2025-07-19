/**
 * PWA Service - Handles service worker registration, updates, and offline functionality
 */

export interface PWAUpdateInfo {
  available: boolean;
  waiting: boolean;
}

export interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: Array<(info: PWAUpdateInfo) => void> = [];
  private statusCallbacks: Array<(status: PWAStatus) => void> = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.setupOnlineStatusListeners();
  }

  /**
   * Initialize the PWA service and register service worker
   */
  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupServiceWorkerListeners();
        console.info('PWA Service: Initialized successfully');
      } catch (error) {
        console.error('PWA Service: Initialization failed', error);
        throw error;
      }
    } else {
      console.warn('PWA Service: Service workers not supported');
      throw new Error('Service workers not supported');
    }
  }

  /**
   * Register the service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.info(
        'PWA Service: Service worker registered',
        this.registration.scope
      );

      // Check for updates immediately
      await this.checkForUpdates();

      // Set up update checking interval (every 30 minutes)
      window.setInterval(
        () => {
          this.checkForUpdates();
        },
        30 * 60 * 1000
      );
    } catch (error) {
      console.error('PWA Service: Service worker registration failed', error);
      throw error;
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupServiceWorkerListeners(): void {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker is available
            this.notifyUpdateCallbacks({ available: true, waiting: true });
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Listen for controller changes (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.info('PWA Service: New service worker activated');
      window.location.reload();
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'BACK_ONLINE':
        console.info(
          'PWA Service: Back online notification from service worker'
        );
        this.handleOnlineStatusChange(true);
        break;
      case 'VERSION':
        console.info(
          'PWA Service: Version info from service worker',
          data.version
        );
        break;
      default:
        console.info('PWA Service: Unknown message from service worker', data);
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.info('PWA Service: Checked for updates');
    } catch (error) {
      console.error('PWA Service: Update check failed', error);
    }
  }

  /**
   * Apply pending service worker update
   */
  async applyUpdate(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      throw new Error('No update available');
    }

    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  /**
   * Set up online/offline status listeners
   */
  private setupOnlineStatusListeners(): void {
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });
  }

  /**
   * Handle online status changes
   */
  private handleOnlineStatusChange(isOnline: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    if (wasOnline !== isOnline) {
      console.info(
        `PWA Service: Status changed to ${isOnline ? 'online' : 'offline'}`
      );
      this.notifyStatusCallbacks();

      // Register background sync when coming back online
      if (
        isOnline &&
        this.registration &&
        'sync' in window.ServiceWorkerRegistration.prototype
      ) {
        try {
          (this.registration as any).sync.register('background-sync');
        } catch (error) {
          console.error(
            'PWA Service: Background sync registration failed',
            error
          );
        }
      }
    }
  }

  /**
   * Get current PWA status
   */
  getStatus(): PWAStatus {
    return {
      isOnline: this.isOnline,
      isInstalled: this.isInstalled(),
      updateAvailable: this.isUpdateAvailable(),
      registration: this.registration,
    };
  }

  /**
   * Check if app is installed (running in standalone mode)
   */
  isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  /**
   * Check if update is available
   */
  isUpdateAvailable(): boolean {
    return Boolean(this.registration && this.registration.waiting);
  }

  /**
   * Subscribe to update notifications
   */
  onUpdate(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to status change notifications
   */
  onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify update callbacks
   */
  private notifyUpdateCallbacks(info: PWAUpdateInfo): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(info);
      } catch (error) {
        console.error('PWA Service: Update callback error', error);
      }
    });
  }

  /**
   * Notify status callbacks
   */
  private notifyStatusCallbacks(): void {
    const status = this.getStatus();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('PWA Service: Status callback error', error);
      }
    });
  }

  /**
   * Show install prompt (if available)
   */
  async showInstallPrompt(): Promise<boolean> {
    const deferredPrompt = (window as any).deferredPrompt;

    if (!deferredPrompt) {
      console.info('PWA Service: Install prompt not available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      console.info(`PWA Service: Install prompt ${outcome}`);

      // Clear the deferred prompt
      (window as any).deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA Service: Install prompt error', error);
      return false;
    }
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string> {
    if (!this.registration?.active) {
      return 'unknown';
    }

    return new Promise(resolve => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = event => {
        if (event.data.type === 'VERSION') {
          resolve(event.data.version);
        } else {
          resolve('unknown');
        }
      };

      const activeWorker = this.registration?.active;
      if (activeWorker) {
        activeWorker.postMessage({ type: 'GET_VERSION' }, [
          messageChannel.port2,
        ]);
      } else {
        resolve('no-active-worker');
      }

      // Timeout after 5 seconds
      window.setTimeout(() => resolve('timeout'), 5000);
    });
  }

  /**
   * Clear all caches (for debugging/reset purposes)
   */
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
  }
}

// Create singleton instance
export const pwaService = new PWAService();
