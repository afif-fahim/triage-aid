/**
 * Modal Component
 * Provides a modal dialog with backdrop and focus management
 */

import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Button } from './Button';
import { ModalOverlay } from './ModalOverlay';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ComponentChildren;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-lg';
      case 'lg':
        return 'max-w-2xl';
      case 'xl':
        return 'max-w-4xl';
      case 'full':
        return 'max-w-full mx-4';
      default:
        return 'max-w-lg';
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      contentClassName={`${getSizeClasses()} ${className}`}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        class="w-full h-full"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h2
                id="modal-title"
                class="text-lg font-semibold text-medical-text-primary"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div class="p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {children}
        </div>
      </div>
    </ModalOverlay>
  );
}
