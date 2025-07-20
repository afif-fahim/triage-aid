/**
 * Toast Container Component
 * Manages multiple toast notifications with positioning and stacking
 */

import { useState, useEffect } from 'preact/hooks';
import { Toast } from './Toast';
import type { ToastNotification } from '../../services/ErrorHandlingService';

interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
  maxToasts?: number;
  className?: string;
}

interface ToastWithId extends ToastNotification {
  id: string;
}

export function ToastContainer({
  position = 'top-right',
  maxToasts = 5,
  className = '',
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  };

  const addToast = (notification: ToastNotification) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastWithId = { ...notification, id };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Limit the number of toasts
      return updatedToasts.slice(0, maxToasts);
    });
  };

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Expose addToast function globally for the error handling service
  useEffect(() => {
    // Store the addToast function in a global location
    (window as any).__toastContainer = { addToast };

    return () => {
      delete (window as any).__toastContainer;
    };
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed z-50 flex flex-col gap-2 max-w-sm w-full
        ${positionClasses[position]}
        ${className}
      `}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="animate-slide-down"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            actions={toast.actions}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

// Hook to use toast notifications
export function useToast() {
  const addToast = (notification: ToastNotification) => {
    const container = (window as any).__toastContainer;
    if (container) {
      container.addToast(notification);
    }
  };

  return { addToast };
}
