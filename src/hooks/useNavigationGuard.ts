/**
 * Navigation Guard Hook
 * Provides navigation guards for unsaved form data
 */

import { useEffect, useRef } from 'preact/hooks';
import { routerService, type NavigationGuard } from '../services/RouterService';
import { useTranslation } from './useTranslation';
import type { AppView } from '../types';

interface UseNavigationGuardOptions {
  when: boolean;
  message?: string;
  view: AppView;
}

export function useNavigationGuard({
  when,
  message,
  view,
}: UseNavigationGuardOptions) {
  const { t } = useTranslation();
  const guardRef = useRef<NavigationGuard | null>(null);

  useEffect(() => {
    if (when) {
      // Create navigation guard
      const guard: NavigationGuard = {
        canLeave: () => !when,
        message: message || t('nav.unsavedChanges'),
      };

      guardRef.current = guard;
      routerService.registerNavigationGuard(view, guard);
    } else {
      // Remove navigation guard
      if (guardRef.current) {
        routerService.removeNavigationGuard(view);
        guardRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (guardRef.current) {
        routerService.removeNavigationGuard(view);
        guardRef.current = null;
      }
    };
  }, [when, message, view, t]);

  // Also handle browser refresh/close
  useEffect(() => {
    if (!when) return;

    const handleBeforeUnload = (event: Event) => {
      event.preventDefault();
      const returnValue = message || t('nav.unsavedChanges');
      // Modern browsers ignore the returnValue, but we set it for compatibility
      (event as any).returnValue = returnValue;
      return returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, message, t]);
}

/**
 * Hook for form-specific navigation guards
 */
export function useFormNavigationGuard(isDirty: boolean, view: AppView) {
  const { t } = useTranslation();

  useNavigationGuard({
    when: isDirty,
    message: t('nav.unsavedFormChanges'),
    view,
  });
}
