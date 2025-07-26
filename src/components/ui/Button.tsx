/**
 * Button Component
 * Touch-friendly button with consistent styling and accessibility features
 */

import type { JSX, ComponentChildren } from 'preact';

interface ButtonProps {
  children: ComponentChildren;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'outline'
    | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  className?: string;
  'aria-label'?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    touch-target
    select-none
    relative
    overflow-hidden
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px] min-w-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px] min-w-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px] min-w-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[52px] min-w-[52px]',
  };

  const variantClasses = {
    primary: `
      bg-medical-primary text-white
      hover:bg-blue-700 hover:text-white active:bg-blue-800
      focus:ring-medical-primary focus:ring-opacity-50
      shadow-sm hover:shadow-md
      border border-transparent
    `,
    secondary: `
      bg-medical-secondary text-white
      hover:bg-gray-700 hover:text-white active:bg-gray-800
      focus:ring-medical-secondary focus:ring-opacity-50
      shadow-sm hover:shadow-md
      border border-transparent
    `,
    success: `
      bg-medical-success text-white
      hover:bg-green-700 hover:text-white active:bg-green-800
      focus:ring-medical-success focus:ring-opacity-50
      shadow-sm hover:shadow-md
      border border-transparent
    `,
    danger: `
      bg-medical-error text-white
      hover:bg-red-700 hover:text-white active:bg-red-800
      focus:ring-medical-error focus:ring-opacity-50
      shadow-sm hover:shadow-md
      border border-transparent
    `,
    outline: `
      border-2 border-medical-primary text-medical-primary bg-white
      hover:bg-medical-primary hover:text-white hover:border-medical-primary
      active:bg-blue-700 active:border-blue-700 active:text-white
      focus:ring-medical-primary focus:ring-opacity-50
      shadow-sm hover:shadow-md
    `,
    ghost: `
      text-medical-primary bg-transparent border border-transparent
      hover:bg-blue-50 hover:text-medical-primary hover:border-blue-100
      active:bg-blue-100 active:text-medical-primary
      focus:ring-medical-primary focus:ring-opacity-50
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {loading && (
        <div className="mr-2">
          <div className="loading-spinner h-4 w-4 border-current" />
        </div>
      )}
      {children}
    </button>
  );
}
