/**
 * Loading Spinner Component
 * Provides consistent loading indicators with different sizes and styles
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'border-medical-primary',
    secondary: 'border-medical-secondary',
    white: 'border-white',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label={label}
      />
      {label && (
        <p className="mt-2 text-sm text-medical-text-secondary">{label}</p>
      )}
    </div>
  );
}
