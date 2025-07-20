/**
 * Fallback Error State Component
 * Provides a user-friendly UI for error conditions with recovery options
 */

import { useTranslation } from '../../hooks';
import { Card } from './Card';
import { Button } from './Button';

interface FallbackErrorStateProps {
  title?: string;
  message?: string;
  icon?: 'error' | 'warning' | 'info' | 'offline';
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

export function FallbackErrorState({
  title,
  message,
  icon = 'error',
  onRetry,
  onReset,
  className = '',
  compact = false,
}: FallbackErrorStateProps) {
  const { t } = useTranslation();

  const defaultTitle = {
    error: t('common.error'),
    warning: t('common.warning'),
    info: t('common.info'),
    offline: t('error.workingOffline'),
  };

  const defaultMessage = {
    error: t('toast.errorOccurred'),
    warning: t('error.systemError'),
    info: t('common.additionalInfo'),
    offline: t('error.networkError'),
  };

  const iconComponents = {
    error: (
      <svg
        className="w-12 h-12 text-red-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-12 h-12 text-yellow-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v3.75m0 6.75h.008v.008H12v-.008zm0-6.75V12M12 9v3.75m0 6.75h.008v.008H12v-.008zm0-6.75V12"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-12 h-12 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
    offline: (
      <svg
        className="w-12 h-12 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
    ),
  };

  const displayTitle = title || defaultTitle[icon];
  const displayMessage = message || defaultMessage[icon];

  if (compact) {
    return (
      <div
        className={`
          bg-gray-50 border border-gray-200 rounded-lg p-4
          flex items-center gap-3
          ${className}
        `}
      >
        <div className="flex-shrink-0">
          {icon === 'error' && (
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {icon === 'warning' && (
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {icon === 'info' && (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {icon === 'offline' && (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 5a1 1 0 00-1 1v1a1 1 0 002 0V6a1 1 0 00-1-1zm3 1a1 1 0 012 0v1a1 1 0 11-2 0V6zm4-1a1 1 0 00-1 1v1a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{displayTitle}</p>
          <p className="text-sm text-gray-500">{displayMessage}</p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="text-xs"
            >
              {t('common.tryAgain')}
            </Button>
          )}
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs"
            >
              {t('common.close')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
      className={`max-w-md w-full mx-auto text-center ${className}`}
    >
      <div className="mb-6">
        <div className="mx-auto mb-4">{iconComponents[icon]}</div>
        <h2 className="text-xl font-semibold text-medical-text-primary mb-2">
          {displayTitle}
        </h2>
        <p className="text-medical-text-secondary text-sm mb-4">
          {displayMessage}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            className="flex-1 sm:flex-none"
          >
            {t('common.tryAgain')}
          </Button>
        )}
        {onReset && (
          <Button
            variant="outline"
            size="md"
            onClick={onReset}
            className="flex-1 sm:flex-none"
          >
            {t('common.close')}
          </Button>
        )}
      </div>
    </Card>
  );
}
