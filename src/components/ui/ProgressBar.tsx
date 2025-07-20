/**
 * ProgressBar Component
 * Provides a visual progress indicator
 */

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({
  progress,
  className = '',
  showPercentage = false,
  size = 'md',
  variant = 'primary',
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'md':
        return 'h-2';
      case 'lg':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-medical-primary';
      case 'success':
        return 'bg-medical-success';
      case 'warning':
        return 'bg-medical-warning';
      case 'danger':
        return 'bg-medical-danger';
      default:
        return 'bg-medical-primary';
    }
  };

  return (
    <div class={`w-full ${className}`}>
      {showPercentage && (
        <div class="flex justify-between items-center mb-1">
          <span class="text-sm text-medical-text-secondary">Progress</span>
          <span class="text-sm font-medium text-medical-text-primary">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}

      <div
        class={`w-full bg-gray-200 rounded-full overflow-hidden ${getSizeClasses()}`}
      >
        <div
          class={`${getSizeClasses()} ${getVariantClasses()} transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
