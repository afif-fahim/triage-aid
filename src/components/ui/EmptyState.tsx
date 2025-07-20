/**
 * Empty State Component
 * Shows when there's no data to display with optional actions
 */

import type { ComponentChildren } from 'preact';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
}

interface EmptyStateProps {
  icon?: ComponentChildren;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actions = [],
  className = '',
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-medical-text-secondary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mb-6">{icon || defaultIcon}</div>

      <h3 className="text-lg font-medium text-medical-text-primary mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-medical-text-secondary mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              className="sm:w-auto"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
