/**
 * Progress Indicator Component
 * Shows progress for multi-step processes like form completion
 */

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressIndicator({
  steps,
  className = '',
  showLabels = true,
  size = 'md',
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: {
      step: 'w-6 h-6 text-xs',
      line: 'h-0.5',
      label: 'text-xs',
    },
    md: {
      step: 'w-8 h-8 text-sm',
      line: 'h-1',
      label: 'text-sm',
    },
    lg: {
      step: 'w-10 h-10 text-base',
      line: 'h-1.5',
      label: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="relative flex items-center justify-center">
              <div
                className={`
                  ${classes.step} rounded-full border-2 flex items-center justify-center font-medium
                  transition-all duration-200
                  ${
                    step.completed
                      ? 'bg-medical-success border-medical-success text-white'
                      : step.current
                        ? 'bg-medical-primary border-medical-primary text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                  }
                `}
                aria-current={step.current ? 'step' : undefined}
              >
                {step.completed ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              {showLabels && (
                <div
                  className={`
                    absolute top-full mt-2 text-center min-w-max
                    ${classes.label}
                    ${
                      step.completed || step.current
                        ? 'text-medical-text-primary font-medium'
                        : 'text-medical-text-secondary'
                    }
                  `}
                >
                  {step.label}
                </div>
              )}
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`
                    ${classes.line} w-full rounded-full
                    ${
                      steps[index + 1]?.completed || step.completed
                        ? 'bg-medical-success'
                        : 'bg-gray-300'
                    }
                  `}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
