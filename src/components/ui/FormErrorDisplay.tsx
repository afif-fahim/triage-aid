/**
 * Form Error Display Component
 * Shows validation errors with clear messaging and field highlighting
 */

import { useTranslation } from '../../hooks';

interface FormErrorDisplayProps {
  errors: Record<string, string>;
  className?: string;
}

interface FieldErrorProps {
  error: string;
  className?: string;
}

/**
 * Display error for a specific field
 */
export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  return (
    <div className={`flex items-center mt-1 text-sm text-red-600 ${className}`}>
      <svg
        className="w-4 h-4 mr-1 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
    </div>
  );
}

/**
 * Display multiple form errors in a summary format
 */
export function FormErrorDisplay({
  errors,
  className = '',
}: FormErrorDisplayProps) {
  const { t } = useTranslation();
  const errorEntries = Object.entries(errors).filter(([, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <div
      className={`
        bg-red-50 border border-red-200 rounded-lg p-4 mb-4
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            {errorEntries.length === 1
              ? 'Please correct the error below'
              : `Please correct the ${errorEntries.length} errors below`}
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {errorEntries.map(([field, error]) => (
              <li key={field} className="flex items-start">
                <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                <span>
                  <strong className="font-medium">
                    {getFieldDisplayName(field, t)}:
                  </strong>{' '}
                  {error}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Get user-friendly field display name
 */
function getFieldDisplayName(fieldName: string, t: any): string {
  const fieldMap: Record<string, string> = {
    ageGroup: t('intake.ageGroup'),
    'vitals.pulse': t('intake.pulse'),
    'vitals.respiratoryRate': t('intake.respiratoryRate'),
    'vitals.breathing': t('intake.breathing'),
    'vitals.circulation': t('intake.circulation'),
    'vitals.consciousness': t('intake.consciousness'),
    'vitals.capillaryRefill': t('intake.capillaryRefill'),
    'vitals.radialPulse': t('intake.radialPulse'),
    'vitals.mobility': t('intake.mobility'),
    injuries: t('intake.injuries'),
    notes: t('intake.notes'),
  };

  return fieldMap[fieldName] || fieldName;
}
