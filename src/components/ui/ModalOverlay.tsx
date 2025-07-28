/**
 * Standardized Modal Overlay Component
 * Provides consistent overlay styling across all modal types
 */

import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  overlayClassName?: string;
  contentClassName?: string;
  closeOnBackdrop?: boolean;
  children: ComponentChildren;
}

export function ModalOverlay({
  isOpen,
  onClose,
  overlayClassName = '',
  contentClassName = '',
  closeOnBackdrop = true,
  children,
}: ModalOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: MouseEvent) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      class={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-gray-900/20 backdrop-blur-sm transition-opacity duration-200
        ${overlayClassName}
      `}
      onClick={handleBackdropClick}
    >
      <div
        class={`
          relative bg-white rounded-lg shadow-xl max-h-full overflow-hidden
          animate-in zoom-in-95 duration-200
          ${contentClassName}
        `}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
