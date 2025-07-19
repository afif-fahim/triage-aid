/**
 * Patient Dashboard Component
 * Displays all triaged patients with color-coded priority indicators
 * Implements sorting by priority and click-to-view functionality
 */

import { useState, useEffect } from 'preact/hooks';
import { PatientData, TriagePriority } from '../types';
import { dataService } from '../services/DataService';
import { PatientListItem } from './PatientListItem';
import { LoadingSpinner, Card, Button, ResponsiveGrid } from './ui/';

export interface PatientDashboardProps {
  onPatientSelect?: (patientId: string) => void;
  onPatientUpdate?: (patientId: string, updates: Partial<PatientData>) => void;
  className?: string;
}

export function PatientDashboard({
  onPatientSelect,
  onPatientUpdate,
  className = '',
}: PatientDashboardProps) {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp'>('priority');
  const [filterBy, setFilterBy] = useState<TriagePriority['level'] | 'all'>(
    'all'
  );

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  /**
   * Load all patients from data service
   */
  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const allPatients = await dataService.getAllPatients();
      setPatients(allPatients);
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle patient selection
   */
  const handlePatientSelect = (patientId: string) => {
    if (onPatientSelect) {
      onPatientSelect(patientId);
    }
  };

  /**
   * Handle patient status update
   */
  const handlePatientUpdate = async (
    patientId: string,
    updates: Partial<PatientData>
  ) => {
    try {
      await dataService.updatePatient(patientId, updates);

      // Update local state
      setPatients(prevPatients =>
        prevPatients.map(patient =>
          patient.id === patientId
            ? { ...patient, ...updates, lastUpdated: new Date() }
            : patient
        )
      );

      if (onPatientUpdate) {
        onPatientUpdate(patientId, updates);
      }
    } catch (err) {
      console.error('Failed to update patient:', err);
      setError('Failed to update patient. Please try again.');
    }
  };

  /**
   * Filter and sort patients based on current settings
   */
  const getFilteredAndSortedPatients = (): PatientData[] => {
    let filteredPatients = patients;

    // Apply priority filter
    if (filterBy !== 'all') {
      filteredPatients = patients.filter(
        patient => patient.priority.level === filterBy
      );
    }

    // Apply sorting
    return filteredPatients.sort((a, b) => {
      if (sortBy === 'priority') {
        // Sort by priority urgency (1 = highest priority)
        return a.priority.urgency - b.priority.urgency;
      } else {
        // Sort by timestamp (newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });
  };

  /**
   * Get priority counts for filter badges
   */
  const getPriorityCounts = () => {
    const counts = {
      red: 0,
      yellow: 0,
      green: 0,
      black: 0,
      total: patients.length,
    };

    patients.forEach(patient => {
      counts[patient.priority.level]++;
    });

    return counts;
  };

  const filteredPatients = getFilteredAndSortedPatients();
  const priorityCounts = getPriorityCounts();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" label="Loading patients..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <Card variant="outlined" padding="md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-medical-error"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-medical-error">Error</h3>
              <p className="text-sm text-medical-text-secondary mt-1">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPatients}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <Card variant="default" padding="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-responsive-xl font-bold text-medical-text-primary">
                Patient Dashboard
              </h2>
              <p className="text-medical-text-secondary mt-1 text-responsive-sm">
                {priorityCounts.total} patient
                {priorityCounts.total !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>

          {/* Priority Count Badges */}
          <ResponsiveGrid cols={{ xs: 2, sm: 4 }} gap="sm" className="mt-4">
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-red rounded-full flex-shrink-0"></div>
              <span className="truncate">{priorityCounts.red} Red</span>
            </div>
            <div className="flex items-center space-x-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-yellow rounded-full flex-shrink-0"></div>
              <span className="truncate">{priorityCounts.yellow} Yellow</span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-green rounded-full flex-shrink-0"></div>
              <span className="truncate">{priorityCounts.green} Green</span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-black rounded-full flex-shrink-0"></div>
              <span className="truncate">{priorityCounts.black} Black</span>
            </div>
          </ResponsiveGrid>
        </div>
      </Card>

      {/* Controls */}
      <Card variant="default" padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2 flex-1">
            <label className="text-sm font-medium text-medical-text-primary shrink-0">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.currentTarget.value as 'priority' | 'timestamp')
              }
              className="form-select text-sm flex-1 min-w-0"
            >
              <option value="priority">Priority Level</option>
              <option value="timestamp">Time Added</option>
            </select>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2 flex-1">
            <label className="text-sm font-medium text-medical-text-primary shrink-0">
              Filter:
            </label>
            <select
              value={filterBy}
              onChange={e =>
                setFilterBy(
                  e.currentTarget.value as TriagePriority['level'] | 'all'
                )
              }
              className="form-select text-sm flex-1 min-w-0"
            >
              <option value="all">All Priorities</option>
              <option value="red">Red - Immediate</option>
              <option value="yellow">Yellow - Urgent</option>
              <option value="green">Green - Minor</option>
              <option value="black">Black - Deceased</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadPatients}
            className="shrink-0"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </Card>

      {/* Patient List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center">
            <div className="text-medical-text-muted mb-4">
              <svg
                className="mx-auto h-12 w-12 sm:h-16 sm:w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-responsive-lg font-medium text-medical-text-primary mb-2">
              No patients found
            </h3>
            <p className="text-medical-text-secondary text-responsive-sm max-w-md mx-auto">
              {filterBy === 'all'
                ? 'No patients have been assessed yet. Start by creating a new patient assessment.'
                : `No patients with ${filterBy} priority found. Try adjusting your filter settings.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map(patient => (
              <div key={patient.id} className="animate-slide-up">
                <PatientListItem
                  patient={patient}
                  onClick={() => handlePatientSelect(patient.id)}
                  onStatusUpdate={status =>
                    handlePatientUpdate(patient.id, { status })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
