/**
 * Responsive Grid Component
 * Provides flexible grid layouts that adapt to different screen sizes
 */

import type { ComponentChildren } from 'preact';

interface ResponsiveGridProps {
  children: ComponentChildren;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 1, md: 2, lg: 3 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4 lg:gap-6',
    lg: 'gap-4 sm:gap-6 lg:gap-8',
    xl: 'gap-6 sm:gap-8 lg:gap-10',
  };

  const getColsClass = () => {
    const classes = [];

    if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);

    return classes.join(' ');
  };

  return (
    <div
      className={`
        grid
        ${getColsClass()}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
