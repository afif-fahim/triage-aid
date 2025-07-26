/**
 * Patient Dashboard Component
 * Displays all triaged patients with color-coded priority indicators
 * Implements sorting by priority and click-to-view functionality
 */

import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { PatientData, TriagePriority } from '../types';
import { dataService } from '../services/DataService';
import { PatientListItem } from './PatientListItem';
import { DataManagement } from './DataManagement';
import {
  LoadingSpinner,
  Card,
  Button,
  ResponsiveGrid,
  VirtualizedList,
} from './ui/';
import { useTranslation } from '../hooks';
import { getOptimalChunkSize } from '../utils/performance';

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
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'timestamp'>('priority');
  const [filterBy, setFilterBy] = useState<TriagePriority['level'] | 'all'>(
    'all'
  );
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  /**
   * Load all patients from data service - memoized to prevent unnecessary re-renders
   */
  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const allPatients = await dataService.getAllPatients();
      setPatients(allPatients);
    } catch (err) {
      console.error('Failed to load patients:', err);
      setError(t('toast.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle patient selection - memoized to prevent unnecessary re-renders
   */
  const handlePatientSelect = useCallback(
    (patientId: string) => {
      if (onPatientSelect) {
        onPatientSelect(patientId);
      }
    },
    [onPatientSelect]
  );

  /**
   * Handle patient status update - memoized to prevent unnecessary re-renders
   */
  const handlePatientUpdate = useCallback(
    async (patientId: string, updates: Partial<PatientData>) => {
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
        setError(t('toast.errorOccurred'));
      }
    },
    [onPatientUpdate, t]
  );

  /**
   * Filter and sort patients based on current settings - memoized for performance
   */
  const filteredPatients = useMemo((): PatientData[] => {
    let filtered = patients;

    // Apply priority filter
    if (filterBy !== 'all') {
      filtered = patients.filter(
        patient => patient.priority.level === filterBy
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        // Sort by priority urgency (1 = highest priority)
        return a.priority.urgency - b.priority.urgency;
      } else {
        // Sort by timestamp (newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });
  }, [patients, filterBy, sortBy]);

  /**
   * Get priority counts for filter badges - memoized for performance
   */
  const priorityCounts = useMemo(() => {
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
  }, [patients]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner size="lg" label={t('common.loading')} />
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
              <h3 className="text-sm font-medium text-medical-error">
                {t('common.error')}
              </h3>
              <p className="text-sm text-medical-text-secondary mt-1">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPatients}
                className="mt-3"
              >
                {t('common.tryAgain')}
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
                {t('dashboard.title')}
              </h2>
              <p className="text-medical-text-secondary mt-1 text-responsive-sm">
                {t('dashboard.totalPatients')}: {priorityCounts.total}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataManagement(true)}
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
                    d="M4 7v10c0 2.21 3.79 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.79 4 8 4s8-1.79 8-4M4 7c0-2.21 3.79-4 8-4s8 1.79 8 4"
                  />
                </svg>
                {t('dashboard.dataManagement')}
              </Button>
            </div>
          </div>

          {/* Priority Count Badges */}
          <ResponsiveGrid cols={{ xs: 2, sm: 4 }} gap="sm" className="mt-4">
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-red rounded-full flex-shrink-0"></div>
              <span className="truncate">
                {priorityCounts.red} {t('triage.red')}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-yellow rounded-full flex-shrink-0"></div>
              <span className="truncate">
                {priorityCounts.yellow} {t('triage.yellow')}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-green rounded-full flex-shrink-0"></div>
              <span className="truncate">
                {priorityCounts.green} {t('triage.green')}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
              <div className="w-3 h-3 bg-triage-black rounded-full flex-shrink-0"></div>
              <span className="truncate">
                {priorityCounts.black} {t('triage.black')}
              </span>
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
              {t('dashboard.sortBy')}:
            </label>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.currentTarget.value as 'priority' | 'timestamp')
              }
              className="form-select text-sm flex-1 min-w-0"
            >
              <option value="priority">{t('dashboard.sortByPriority')}</option>
              <option value="timestamp">{t('dashboard.sortByTime')}</option>
            </select>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2 flex-1">
            <label className="text-sm font-medium text-medical-text-primary shrink-0">
              {t('dashboard.filters')}:
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
              <option value="all">{t('dashboard.all')}</option>
              <option value="red">{t('triage.red')}</option>
              <option value="yellow">{t('triage.yellow')}</option>
              <option value="green">{t('triage.green')}</option>
              <option value="black">{t('triage.black')}</option>
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
            {t('dashboard.refresh')}
          </Button>
        </div>
      </Card>

      {/* Patient List */}
      <div>
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
              {t('dashboard.noPatients')}
            </h3>
            <p className="text-medical-text-secondary text-responsive-sm max-w-md mx-auto">
              {filterBy === 'all'
                ? t('dashboard.noPatientsSub')
                : `${t('dashboard.noPatientsFilter')} ${filterBy}`}
            </p>
          </Card>
        ) : filteredPatients.length > getOptimalChunkSize() ? (
          // Use virtualization for large lists to improve performance on low-power devices
          <VirtualizedList
            items={filteredPatients}
            itemHeight={180} // Approximate height of PatientListItem
            containerHeight={600} // Max height for virtualized container
            renderItem={patient => (
              <div key={patient.id} className="mb-3">
                <PatientListItem
                  patient={patient}
                  onClick={() => handlePatientSelect(patient.id)}
                  onStatusUpdate={status =>
                    handlePatientUpdate(patient.id, { status })
                  }
                />
              </div>
            )}
            className="rounded-lg"
          />
        ) : (
          // Regular rendering for smaller lists
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

      {/* Data Management Modal */}
      <DataManagement
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
        onDataChanged={loadPatients}
      />
    </div>
  );
}
