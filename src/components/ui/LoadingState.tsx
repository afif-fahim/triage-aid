/**
 * Loading State Component
 * Provides consistent loading indicators with optional messages
 */

import { LoadingSpinner } from './LoadingSpinner';
import { useTranslation } from '../../hooks';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'overlay' | 'fullscreen';
  className?: string;
}

export function LoadingState({
  message,
  size = 'md',
  variant = 'inline',
  className = '',
}: LoadingStateProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const baseContent = (
    <div
      className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <LoadingSpinner size={size} className="mb-3" />
      <p className="text-medical-text-secondary font-medium">
        {displayMessage}
      </p>
    </div>
  );

  switch (variant) {
    case 'overlay':
      return (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          {baseContent}
        </div>
      );

    case 'fullscreen':
      return (
        <div className="fixed inset-0 bg-medical-background flex items-center justify-center z-50">
          {baseContent}
        </div>
      );

    case 'inline':
    default:
      return <div className="py-8">{baseContent}</div>;
  }
}
