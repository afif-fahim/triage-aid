/**
 * Card Component
 * Responsive card container with consistent styling
 */

import type { ComponentChildren } from 'preact';

interface CardProps {
  children: ComponentChildren;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  const baseClasses = `
    bg-medical-surface rounded-xl
    transition-all duration-200
    ${onClick || hoverable ? 'cursor-pointer' : ''}
  `;

  const variantClasses = {
    default: `
      border border-gray-200 shadow-sm
      ${onClick || hoverable ? 'hover:shadow-md hover:border-gray-300' : ''}
    `,
    elevated: `
      shadow-medical
      ${onClick || hoverable ? 'hover:shadow-medical-lg hover:-translate-y-0.5' : ''}
    `,
    outlined: `
      border-2 border-gray-200
      ${onClick || hoverable ? 'hover:border-medical-primary hover:shadow-sm' : ''}
    `,
    flat: `
      ${onClick || hoverable ? 'hover:bg-gray-50' : ''}
    `,
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
