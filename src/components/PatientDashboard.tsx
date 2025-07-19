/**
 * Patient Dashboard Component
 * Displays all triaged patients with color-coded priority indicators
 * Implements sorting by priority and click-to-view functionality
 */

import { useState, useEffect } from 'preact/hooks';
import { PatientData, TriagePriority } from '../types';
import { dataService } from '../services/DataService';
import { PatientListItem } from './PatientListItem';

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={loadPatients}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Patient Dashboard
            </h2>
            <p className="text-gray-600 mt-1">
              {priorityCounts.total} patient
              {priorityCounts.total !== 1 ? 's' : ''} total
            </p>
          </div>

          {/* Priority Count Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span>{priorityCounts.red} Red</span>
            </div>
            <div className="flex items-center space-x-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span>{priorityCounts.yellow} Yellow</span>
            </div>
            <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>{priorityCounts.green} Green</span>
            </div>
            <div className="flex items-center space-x-1 bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <span>{priorityCounts.black} Black</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.currentTarget.value as 'priority' | 'timestamp')
              }
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="priority">Priority Level</option>
              <option value="timestamp">Time Added</option>
            </select>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterBy}
              onChange={e =>
                setFilterBy(
                  e.currentTarget.value as TriagePriority['level'] | 'all'
                )
              }
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="red">Red - Immediate</option>
              <option value="yellow">Yellow - Urgent</option>
              <option value="green">Green - Minor</option>
              <option value="black">Black - Deceased</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadPatients}
            className="ml-auto px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No patients found
            </h3>
            <p className="text-gray-600">
              {filterBy === 'all'
                ? 'No patients have been assessed yet.'
                : `No patients with ${filterBy} priority found.`}
            </p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <PatientListItem
              key={patient.id}
              patient={patient}
              onClick={() => handlePatientSelect(patient.id)}
              onStatusUpdate={status =>
                handlePatientUpdate(patient.id, { status })
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
