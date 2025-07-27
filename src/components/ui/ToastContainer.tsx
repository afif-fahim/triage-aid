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
  position = 'bottom-right',
  maxToasts = 5,
  className = '',
}: ToastContainerProps) {
  const [toasts, setToasts] = useState<ToastWithId[]>([]);

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
        ${className}
      `}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            actions={toast.actions}
            position={position}
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
