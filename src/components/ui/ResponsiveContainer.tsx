/**
 * Responsive Container Component
 * Provides consistent responsive layout with proper spacing and safe areas
 */

import type { JSX, ComponentChildren } from 'preact';

interface ResponsiveContainerProps {
  children: ComponentChildren;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  as?: 'div' | 'section' | 'main' | 'article' | 'aside';
}

export function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = '',
  as: Component = 'div',
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    '3xl': 'max-w-8xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2 sm:px-6 sm:py-4',
    md: 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8',
    lg: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12',
  };

  const ElementType = Component as keyof JSX.IntrinsicElements;

  return (
    <ElementType
      className={`
        mx-auto w-full
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </ElementType>
  );
}
