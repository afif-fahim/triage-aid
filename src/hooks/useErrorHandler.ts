/**
 * Error Handler Hook
 * Provides easy access to error handling functionality
 */

import { useCallback } from 'preact/hooks';
import { errorHandlingService } from '../services';
import type { AppError } from '../types';
import type { ErrorRecoveryAction } from '../services/ErrorHandlingService';

export function useErrorHandler() {
  /**
   * Handle an application error
   */
  const handleError = useCallback(
    (
      error: AppError,
      options?: {
        showToast?: boolean;
        logError?: boolean;
        recoveryActions?: ErrorRecoveryAction[];
      }
    ) => {
      errorHandlingService.handleError(error, options);
    },
    []
  );

  /**
   * Create and handle an error in one step
   */
  const createAndHandleError = useCallback(
    (
      type: AppError['type'],
      code: string,
      message: string,
      details?: unknown,
      recoverable: boolean = true,
      options?: {
        showToast?: boolean;
        logError?: boolean;
        recoveryActions?: ErrorRecoveryAction[];
      }
    ) => {
      const error = errorHandlingService.createError(
        type,
        code,
        message,
        details,
        recoverable
      );
      errorHandlingService.handleError(error, options);
      return error;
    },
    []
  );

  /**
   * Handle validation errors
   */
  const handleValidationErrors = useCallback(
    (
      errors: Array<{ field: string; message: string; code: string }>
    ): Record<string, string> => {
      return errorHandlingService.handleValidationErrors(errors);
    },
    []
  );

  /**
   * Show success notification
   */
  const showSuccess = useCallback(
    (message: string, interpolation?: Record<string, string>) => {
      errorHandlingService.showSuccess(message, interpolation);
    },
    []
  );

  /**
   * Show warning notification
   */
  const showWarning = useCallback(
    (
      message: string,
      interpolation?: Record<string, string>,
      actions?: ErrorRecoveryAction[]
    ) => {
      errorHandlingService.showWarning(message, interpolation, actions);
    },
    []
  );

  /**
   * Show info notification
   */
  const showInfo = useCallback(
    (message: string, interpolation?: Record<string, string>) => {
      errorHandlingService.showInfo(message, interpolation);
    },
    []
  );

  /**
   * Show error notification
   */
  const showError = useCallback(
    (
      message: string,
      interpolation?: Record<string, string>,
      actions?: ErrorRecoveryAction[]
    ) => {
      errorHandlingService.showError(message, interpolation, actions);
    },
    []
  );

  return {
    handleError,
    createAndHandleError,
    handleValidationErrors,
    showSuccess,
    showWarning,
    showInfo,
    showError,
  };
}
