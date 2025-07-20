/**
 * Error Handling Service
 * Centralized error management with user-friendly messages and recovery strategies
 */

import type { AppError } from '../types';
import { i18nService, TranslationKey } from './I18nService';

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  recoveryActions?: ErrorRecoveryAction[];
}

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  actions?: ErrorRecoveryAction[];
}

/**
 * Error handling service for managing application errors
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private toastCallback: ((notification: ToastNotification) => void) | null =
    null;
  private errorLog: AppError[] = [];

  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Set the toast notification callback
   */
  setToastCallback(callback: (notification: ToastNotification) => void): void {
    this.toastCallback = callback;
  }

  /**
   * Handle application errors with appropriate user feedback
   */
  handleError(error: AppError, options: ErrorHandlerOptions = {}): void {
    const { showToast = true, logError = true, recoveryActions = [] } = options;

    if (logError) {
      this.logError(error);
    }

    if (showToast && this.toastCallback) {
      const userMessage = this.getUserFriendlyMessage(error);
      const actions = error.recoverable ? recoveryActions : [];

      this.toastCallback({
        message: userMessage,
        type: this.getToastType(error),
        duration: error.type === 'system' ? 0 : 5000, // System errors don't auto-dismiss
        actions,
      });
    }

    // Attempt automatic recovery for recoverable errors
    if (error.recoverable) {
      this.attemptRecovery(error);
    }
  }

  /**
   * Handle validation errors with field-specific feedback
   */
  handleValidationErrors(
    errors: Array<{ field: string; message: string; code: string }>
  ): Record<string, string> {
    const fieldErrors: Record<string, string> = {};

    errors.forEach(error => {
      fieldErrors[error.field] = this.getLocalizedValidationMessage(
        error.code,
        error.message
      );
    });

    return fieldErrors;
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, interpolation?: Record<string, string>): void {
    if (this.toastCallback) {
      this.toastCallback({
        message: interpolation
          ? this.interpolateMessage(message, interpolation)
          : message,
        type: 'success',
        duration: 3000,
      });
    }
  }

  /**
   * Show warning notification
   */
  showWarning(
    message: string,
    interpolation?: Record<string, string>,
    actions?: ErrorRecoveryAction[]
  ): void {
    if (this.toastCallback) {
      this.toastCallback({
        message: interpolation
          ? this.interpolateMessage(message, interpolation)
          : message,
        type: 'warning',
        duration: 5000,
        actions,
      });
    }
  }

  /**
   * Show info notification
   */
  showInfo(message: string, interpolation?: Record<string, string>): void {
    if (this.toastCallback) {
      this.toastCallback({
        message: interpolation
          ? this.interpolateMessage(message, interpolation)
          : message,
        type: 'info',
        duration: 4000,
      });
    }
  }

  /**
   * Show error notification
   */
  showError(
    message: string,
    interpolation?: Record<string, string>,
    actions?: ErrorRecoveryAction[]
  ): void {
    if (this.toastCallback) {
      this.toastCallback({
        message: interpolation
          ? this.interpolateMessage(message, interpolation)
          : message,
        type: 'error',
        duration: 0, // Error notifications don't auto-dismiss
        actions,
      });
    }
  }

  /**
   * Show toast notification (generic method)
   */
  showToast(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration?: number,
    actions?: ErrorRecoveryAction[]
  ): void {
    if (this.toastCallback) {
      this.toastCallback({
        message,
        type,
        duration:
          duration ?? (type === 'error' ? 0 : type === 'success' ? 3000 : 5000),
        actions,
      });
    }
  }

  /**
   * Create standardized error objects
   */
  createError(
    type: AppError['type'],
    code: string,
    message: string,
    details?: unknown,
    recoverable: boolean = true
  ): AppError {
    return {
      type,
      code,
      message,
      details,
      timestamp: new Date(),
      recoverable,
    };
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Log error to internal storage
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);

    // Keep only last 50 errors to prevent memory issues
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }

    // Log to console in development
    if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) {
      console.error('Application Error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      });
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: AppError): string {
    const messageKey = `error.${error.code}` as TranslationKey;

    // Try to get localized message
    const localizedMessage = i18nService.t(messageKey, error.code);

    // If no localized message exists, use fallback based on error type
    if (localizedMessage === error.code) {
      return this.getFallbackMessage(error);
    }

    return localizedMessage;
  }

  /**
   * Get fallback error message when no localized message exists
   */
  private getFallbackMessage(error: AppError): string {
    switch (error.type) {
      case 'data':
        return i18nService.t(
          'error.dataError' as TranslationKey,
          'A data storage error occurred'
        );
      case 'validation':
        return i18nService.t(
          'error.validationError' as TranslationKey,
          'Please check your input'
        );
      case 'network':
        return i18nService.t(
          'error.networkError' as TranslationKey,
          'Network connection issue'
        );
      case 'system':
        return i18nService.t(
          'error.systemError' as TranslationKey,
          'A system error occurred'
        );
      default:
        return i18nService.t(
          'error.unknownError' as TranslationKey,
          'An unexpected error occurred'
        );
    }
  }

  /**
   * Get appropriate toast type for error
   */
  private getToastType(error: AppError): 'error' | 'warning' | 'info' {
    switch (error.type) {
      case 'system':
        return 'error';
      case 'network':
        return 'warning';
      case 'validation':
        return 'warning';
      case 'data':
        return error.recoverable ? 'warning' : 'error';
      default:
        return 'error';
    }
  }

  /**
   * Get localized validation message
   */
  private getLocalizedValidationMessage(
    code: string,
    fallback: string
  ): string {
    const messageKey = `validation.${code.toLowerCase()}` as TranslationKey;
    const localizedMessage = i18nService.t(messageKey, fallback);

    return localizedMessage === fallback ? fallback : localizedMessage;
  }

  /**
   * Interpolate variables in message
   */
  private interpolateMessage(
    message: string,
    variables: Record<string, string>
  ): string {
    let interpolatedMessage = message;
    Object.entries(variables).forEach(([key, value]) => {
      interpolatedMessage = interpolatedMessage.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      );
    });
    return interpolatedMessage;
  }

  /**
   * Attempt automatic recovery for recoverable errors
   */
  private attemptRecovery(error: AppError): void {
    switch (error.type) {
      case 'data':
        this.recoverDataError(error);
        break;
      case 'network':
        this.recoverNetworkError(error);
        break;
      case 'validation':
        // Validation errors are handled by form components
        break;
      default:
        // No automatic recovery for other error types
        break;
    }
  }

  /**
   * Attempt to recover from data errors
   */
  private recoverDataError(error: AppError): void {
    switch (error.code) {
      case 'STORAGE_QUOTA_EXCEEDED':
        // Could trigger cleanup of old data
        this.showWarning(
          i18nService.t(
            'error.storageQuotaExceeded' as TranslationKey,
            'Storage space is running low'
          ),
          undefined,
          [
            {
              label: i18nService.t(
                'error.cleanupOldData' as TranslationKey,
                'Clean up old data'
              ),
              action: () => {
                // This would be implemented by the DataService
                console.info('Cleanup old data requested');
              },
            },
          ]
        );
        break;
      case 'ENCRYPTION_FAILED':
        // Could retry with different encryption method
        this.showWarning(
          i18nService.t(
            'error.encryptionFailed' as TranslationKey,
            'Failed to encrypt patient data'
          )
        );
        break;
      default:
        break;
    }
  }

  /**
   * Attempt to recover from network errors
   */
  private recoverNetworkError(error: AppError): void {
    switch (error.code) {
      case 'OFFLINE':
        this.showInfo(
          i18nService.t(
            'error.workingOffline' as TranslationKey,
            'You are currently working offline'
          )
        );
        break;
      case 'SYNC_FAILED':
        this.showWarning(
          i18nService.t(
            'error.syncFailed' as TranslationKey,
            'Failed to sync data'
          ),
          undefined,
          [
            {
              label: i18nService.t(
                'error.retrySync' as TranslationKey,
                'Retry sync'
              ),
              action: () => {
                // This would be implemented by the sync service
                console.info('Retry sync requested');
              },
            },
          ]
        );
        break;
      default:
        break;
    }
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
