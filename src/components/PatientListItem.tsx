/**
 * Patient List Item Component
 * Displays individual patient information in the dashboard list
 * Shows ID, priority with color coding, and status summary
 */

import { PatientData } from '../types';

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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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

    return summaryParts.length > 0 ? summaryParts.join(' • ') : 'Normal vitals';
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
      className={`bg-white rounded-lg shadow-sm border-l-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      style={{ borderLeftColor: patient.priority.color }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left side - Patient info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              {/* Priority indicator */}
              <div
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${patient.priority.color}15`,
                  color: patient.priority.color,
                }}
              >
                {getPriorityIcon(patient.priority.level)}
                <span className="font-semibold">
                  {patient.priority.level.toUpperCase()}
                </span>
              </div>

              {/* Patient ID */}
              <span className="text-lg font-mono font-semibold text-gray-900">
                {formatPatientId(patient.id)}
              </span>

              {/* Age group */}
              <span className="text-sm text-gray-500 capitalize">
                {patient.ageGroup}
              </span>
            </div>

            {/* Priority description */}
            <p className="text-sm text-gray-600 mb-2">
              {patient.priority.description}
            </p>

            {/* Vitals summary */}
            <p className="text-sm text-gray-500 mb-3">{getVitalsSummary()}</p>

            {/* Injuries (if any) */}
            {patient.injuries.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Injuries:</span>{' '}
                  {patient.injuries.slice(0, 2).join(', ')}
                  {patient.injuries.length > 2 &&
                    ` +${patient.injuries.length - 2} more`}
                </p>
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-400">
              Assessed: {formatTimestamp(patient.timestamp)}
              {patient.lastUpdated.getTime() !==
                patient.timestamp.getTime() && (
                <span> • Updated: {formatTimestamp(patient.lastUpdated)}</span>
              )}
            </p>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            {/* Status badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                patient.status
              )}`}
            >
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </span>

            {/* Quick status actions */}
            {patient.status === 'active' && onStatusUpdate && (
              <div className="flex space-x-1">
                <button
                  onClick={e => handleStatusChange(e, 'treated')}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  title="Mark as treated"
                >
                  Treated
                </button>
                <button
                  onClick={e => handleStatusChange(e, 'transferred')}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                  title="Mark as transferred"
                >
                  Transfer
                </button>
              </div>
            )}

            {/* Click indicator */}
            <div className="text-gray-400">
              <svg
                className="w-4 h-4"
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
