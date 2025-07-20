/**
 * Performance utilities for low-power devices
 * Provides monitoring and optimization helpers
 */

/**
 * Debounce function to limit expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit frequent operations
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      window.setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if device is low-power based on hardware concurrency
 */
export function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Consider devices with 2 or fewer cores as low-power
  const cores = navigator.hardwareConcurrency || 2;
  return cores <= 2;
}

/**
 * Get optimal chunk size for virtualization based on device capabilities
 */
export function getOptimalChunkSize(): number {
  if (isLowPowerDevice()) {
    return 10; // Smaller chunks for low-power devices
  }
  return 20; // Standard chunk size
}

/**
 * Measure and log performance metrics
 */
export function measurePerformance(name: string, fn: () => void): void {
  if (
    typeof window === 'undefined' ||
    typeof window.performance === 'undefined'
  ) {
    fn();
    return;
  }

  const start = window.performance.now();
  fn();
  const end = window.performance.now();

  // Only log in development
  if (import.meta.env.DEV) {
    console.info(`${name} took ${end - start} milliseconds`);
  }
}

/**
 * Request idle callback with fallback for unsupported browsers
 */
export function requestIdleCallback(
  callback: () => void,
  timeout = 5000
): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * Optimize images for low-power devices
 */
export function getOptimizedImageSize(): { width: number; height: number } {
  if (isLowPowerDevice()) {
    return { width: 150, height: 150 }; // Smaller images
  }
  return { width: 200, height: 200 }; // Standard size
}
