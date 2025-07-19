/**
 * Patient List Item Component
 * Displays individual patient information in the dashboard list
 * Shows ID, priority with color coding, and status summary
 */

import { PatientData } from '../types';
import { useTranslation } from '../hooks';

export interface PatientListItemProps {
  patient: PatientData;
  onClick: () => void;
  onStatusUpdate?: (status: PatientData['status']) => void;
  className?: string;
}

export function PatientListItem({
  patient,
  onClick,
  onStatusUpdate,
  className = '',
}: PatientListItemProps) {
  const { t, formatDate } = useTranslation();
  /**
   * Format patient ID for display (show first 8 characters)
   */
  const formatPatientId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (date: Date): string => {
    return formatDate(date);
  };

  /**
   * Get priority icon based on level
   */
  const getPriorityIcon = (level: string) => {
    switch (level) {
      case 'red':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'yellow':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'green':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'black':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * Get status badge styling
   */
  const getStatusBadgeClass = (status: PatientData['status']): string => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'treated':
        return 'bg-green-100 text-green-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get vital signs summary
   */
  const getVitalsSummary = (): string => {
    const { vitals } = patient;
    const summaryParts: string[] = [];

    if (vitals.pulse) {
      summaryParts.push(`HR: ${vitals.pulse}`);
    }

    if (vitals.breathing !== 'normal') {
      summaryParts.push(`Breathing: ${vitals.breathing}`);
    }

    if (vitals.circulation !== 'normal') {
      summaryParts.push(`Circulation: ${vitals.circulation}`);
    }

    if (vitals.consciousness !== 'alert') {
      summaryParts.push(`Consciousness: ${vitals.consciousness}`);
    }

    return summaryParts.length > 0
      ? summaryParts.join(' • ')
      : t('intake.breathing.normal');
  };

  /**
   * Handle status change
   */
  const handleStatusChange = (e: Event, newStatus: PatientData['status']) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    }
  };

  return (
    <div
      className={`
        bg-medical-surface rounded-xl shadow-sm border-l-4 border border-gray-200 
        hover:shadow-md hover:border-gray-300 
        transition-all duration-200 cursor-pointer 
        touch-target active:scale-[0.98]
        ${className}
      `}
      style={{ borderLeftColor: patient.priority.color }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left side - Patient info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
              {/* Priority indicator */}
              <div
                className="priority-badge inline-flex w-fit"
                style={{
                  backgroundColor: `${patient.priority.color}15`,
                  color: patient.priority.color,
                }}
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                  {getPriorityIcon(patient.priority.level)}
                </span>
                <span className="font-semibold text-xs sm:text-sm">
                  {patient.priority.level.toUpperCase()}
                </span>
              </div>

              {/* Patient ID and Age */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-base sm:text-lg font-mono font-semibold text-medical-text-primary">
                  {formatPatientId(patient.id)}
                </span>
                <span className="text-xs sm:text-sm text-medical-text-secondary capitalize bg-gray-100 px-2 py-1 rounded-md">
                  {patient.ageGroup}
                </span>
              </div>
            </div>

            {/* Priority description */}
            <p className="text-sm sm:text-base text-medical-text-secondary mb-2 font-medium">
              {patient.priority.description}
            </p>

            {/* Vitals summary */}
            <p className="text-xs sm:text-sm text-medical-text-muted mb-3 line-clamp-2">
              {getVitalsSummary()}
            </p>

            {/* Injuries (if any) */}
            {patient.injuries.length > 0 && (
              <div className="mb-3">
                <p className="text-xs sm:text-sm text-medical-text-secondary">
                  <span className="font-medium text-medical-text-primary">
                    {t('intake.injuries')}:
                  </span>{' '}
                  <span className="line-clamp-1">
                    {patient.injuries.slice(0, 2).join(', ')}
                    {patient.injuries.length > 2 &&
                      ` +${patient.injuries.length - 2} more`}
                  </span>
                </p>
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-medical-text-muted space-y-1 sm:space-y-0 sm:space-x-3 sm:flex">
              <span>
                {t('patient.assessedAt')}: {formatTimestamp(patient.timestamp)}
              </span>
              {patient.lastUpdated.getTime() !==
                patient.timestamp.getTime() && (
                <span className="block sm:inline">
                  <span className="hidden sm:inline">•</span>{' '}
                  {t('patient.lastUpdated')}:{' '}
                  {formatTimestamp(patient.lastUpdated)}
                </span>
              )}
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex flex-col sm:items-end space-y-2 sm:ml-4 shrink-0">
            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeClass(
                patient.status
              )}`}
            >
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </span>

            {/* Quick status actions */}
            {patient.status === 'active' && onStatusUpdate && (
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={e => handleStatusChange(e, 'treated')}
                  className="touch-target text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 active:bg-green-300 transition-colors font-medium"
                  title={t('status.treated')}
                >
                  {t('status.treated')}
                </button>
                <button
                  onClick={e => handleStatusChange(e, 'transferred')}
                  className="touch-target text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md hover:bg-purple-200 active:bg-purple-300 transition-colors font-medium"
                  title={t('status.transferred')}
                >
                  {t('status.transferred')}
                </button>
              </div>
            )}

            {/* Click indicator */}
            <div className="text-medical-text-muted self-end">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
