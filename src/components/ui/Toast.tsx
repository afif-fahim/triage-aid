/**
 * Toast Notification Component
 * Provides user feedback with different types and auto-dismiss functionality
 */

import { useEffect } from 'preact/hooks';

interface ToastAction {
  label: string;
  action: () => void | Promise<void>;
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
  actions?: ToastAction[];
  className?: string;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
}

export function Toast({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  actions = [],
  className = '',
  position = 'bottom-right',
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = window.setTimeout(onClose, duration);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  };

  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  };

  const style = typeStyles[type];

  // Animation class based on position
  const animationClass = position.includes('bottom')
    ? 'animate-slide-up'
    : 'animate-slide-down';

  const handleActionClick = async (action: ToastAction) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Toast action failed:', error);
    }
  };

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50 max-w-sm w-full
        ${style.bg} border rounded-lg shadow-lg
        ${animationClass}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${style.text}`}>{style.icon}</div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${style.text}`}>{message}</p>

            {/* Action buttons */}
            {actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    className={`
                      text-xs font-medium px-3 py-1 rounded-md
                      ${style.text} bg-white bg-opacity-20
                      hover:bg-opacity-30 focus:bg-opacity-30
                      focus:outline-none focus:ring-2 focus:ring-offset-1
                      transition-colors
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className={`
                inline-flex rounded-md p-1.5 ${style.text}
                hover:bg-black hover:bg-opacity-10
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                transition-colors
              `}
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
