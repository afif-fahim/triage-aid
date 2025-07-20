/**
 * Error Handling Service
 * Centralized error management with user-friendly messages and recovery strategies
 */

import type { AppError } from '../types';
import { i18nService } from './I18nService';

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
  showSuccess(
    messageKey: string,
    interpolation?: Record<string, string>
  ): void {
    if (this.toastCallback) {
      const message = i18nService.t(messageKey, interpolation);
      this.toastCallback({
        message,
        type: 'success',
        duration: 3000,
      });
    }
  }

  /**
   * Show warning notification
   */
  showWarning(
    messageKey: string,
    interpolation?: Record<string, string>,
    actions?: ErrorRecoveryAction[]
  ): void {
    if (this.toastCallback) {
      const message = i18nService.t(messageKey, interpolation);
      this.toastCallback({
        message,
        type: 'warning',
        duration: 5000,
        actions,
      });
    }
  }

  /**
   * Show info notification
   */
  showInfo(messageKey: string, interpolation?: Record<string, string>): void {
    if (this.toastCallback) {
      const message = i18nService.t(messageKey, interpolation);
      this.toastCallback({
        message,
        type: 'info',
        duration: 4000,
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
    if (import.meta.env.DEV) {
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
    const messageKey = `error.${error.code}`;

    // Try to get localized message
    const localizedMessage = i18nService.t(messageKey);

    // If no localized message exists, use fallback based on error type
    if (localizedMessage === messageKey) {
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
        return i18nService.t('error.dataError');
      case 'validation':
        return i18nService.t('error.validationError');
      case 'network':
        return i18nService.t('error.networkError');
      case 'system':
        return i18nService.t('error.systemError');
      default:
        return i18nService.t('error.unknownError');
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
    const messageKey = `validation.${code.toLowerCase()}`;
    const localizedMessage = i18nService.t(messageKey);

    return localizedMessage === messageKey ? fallback : localizedMessage;
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
        this.showWarning('error.storageQuotaExceeded', undefined, [
          {
            label: i18nService.t('error.cleanupOldData'),
            action: () => {
              // This would be implemented by the DataService
              console.log('Cleanup old data requested');
            },
          },
        ]);
        break;
      case 'ENCRYPTION_FAILED':
        // Could retry with different encryption method
        this.showWarning('error.encryptionFailed');
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
        this.showInfo('error.workingOffline');
        break;
      case 'SYNC_FAILED':
        this.showWarning('error.syncFailed', undefined, [
          {
            label: i18nService.t('error.retrySync'),
            action: () => {
              // This would be implemented by the sync service
              console.log('Retry sync requested');
            },
          },
        ]);
        break;
      default:
        break;
    }
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
