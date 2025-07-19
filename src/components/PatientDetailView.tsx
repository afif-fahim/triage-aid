/**
 * Patient Detail View Component
 * Displays detailed patient information with editing capabilities
 * Allows updating vital signs, status changes, and triage priority recalculation
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { PatientData, PatientDataUpdate } from '../types';
import { dataService } from '../services/DataService';
import { ConfirmationDialog } from './ConfirmationDialog';

export interface PatientDetailViewProps {
  patientId: string;
  onClose: () => void;
  onPatientUpdate?: (patientId: string, updates: PatientDataUpdate) => void;
  onPatientDelete?: (patientId: string) => void;
  className?: string;
}

export function PatientDetailView({
  patientId,
  onClose,
  onPatientUpdate,
  onPatientDelete,
  className = '',
}: PatientDetailViewProps) {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState<{
    status: PatientData['status'];
    show: boolean;
  }>({ status: 'active', show: false });

  // Form state for editing
  const [editForm, setEditForm] = useState<PatientDataUpdate>({});

  /**
   * Load patient data from service
   */
  const loadPatient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const patientData = await dataService.getPatient(patientId);

      if (!patientData) {
        setError('Patient not found');
        return;
      }

      setPatient(patientData);
      // Initialize edit form with current data
      setEditForm({
        ageGroup: patientData.ageGroup,
        vitals: { ...patientData.vitals },
        mobility: patientData.mobility,
        injuries: [...patientData.injuries],
        status: patientData.status,
        notes: patientData.notes || '',
      });
    } catch (err) {
      console.error('Failed to load patient:', err);
      setError('Failed to load patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Load patient data on mount
  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  /**
   * Handle form field changes
   */
  const handleFieldChange = (field: string, value: unknown) => {
    if (field.startsWith('vitals.')) {
      const vitalField = field.replace('vitals.', '');
      setEditForm(prev => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          [vitalField]: value,
        },
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  /**
   * Handle injury changes
   */
  const handleInjuryChange = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      injuries:
        prev.injuries?.map((injury, i) => (i === index ? value : injury)) || [],
    }));
  };

  /**
   * Add new injury
   */
  const addInjury = () => {
    setEditForm(prev => ({
      ...prev,
      injuries: [...(prev.injuries || []), ''],
    }));
  };

  /**
   * Remove injury
   */
  const removeInjury = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      injuries: prev.injuries?.filter((_, i) => i !== index) || [],
    }));
  };

  /**
   * Save patient updates
   */
  const handleSave = async () => {
    if (!patient) return;

    try {
      setIsSaving(true);
      setError(null);

      // Clean up empty injuries
      const cleanedUpdates = {
        ...editForm,
        injuries:
          editForm.injuries?.filter(injury => injury.trim() !== '') || [],
      };

      await dataService.updatePatient(patientId, cleanedUpdates);

      // Reload patient data to get updated priority
      await loadPatient();

      setIsEditing(false);

      if (onPatientUpdate) {
        onPatientUpdate(patientId, cleanedUpdates);
      }
    } catch (err) {
      console.error('Failed to save patient:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    if (!patient) return;

    // Reset form to current patient data
    setEditForm({
      ageGroup: patient.ageGroup,
      vitals: { ...patient.vitals },
      mobility: patient.mobility,
      injuries: [...patient.injuries],
      status: patient.status,
      notes: patient.notes || '',
    });
    setIsEditing(false);
    setError(null);
  };

  /**
   * Handle status change with confirmation
   */
  const handleStatusChange = (newStatus: PatientData['status']) => {
    if (
      newStatus === 'discharged' ||
      (patient?.status === 'active' && newStatus !== 'active')
    ) {
      setShowStatusConfirm({ status: newStatus, show: true });
    } else {
      updateStatus(newStatus);
    }
  };

  /**
   * Update patient status
   */
  const updateStatus = async (newStatus: PatientData['status']) => {
    if (!patient) return;

    try {
      await dataService.updatePatient(patientId, { status: newStatus });
      await loadPatient();

      if (onPatientUpdate) {
        onPatientUpdate(patientId, { status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update patient status. Please try again.');
    }

    setShowStatusConfirm({ status: 'active', show: false });
  };

  /**
   * Handle patient deletion
   */
  const handleDelete = async () => {
    if (!patient) return;

    try {
      await dataService.deletePatient(patientId);

      if (onPatientDelete) {
        onPatientDelete(patientId);
      }

      onClose();
    } catch (err) {
      console.error('Failed to delete patient:', err);
      setError('Failed to delete patient. Please try again.');
    }

    setShowDeleteConfirm(false);
  };

  /**
   * Format patient ID for display
   */
  const formatPatientId = (id: string): string => {
    return `#${id.slice(0, 8).toUpperCase()}`;
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error && !patient) {
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
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={loadPatient}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Priority indicator */}
            <div
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${patient.priority.color}15`,
                color: patient.priority.color,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: patient.priority.color }}
              ></div>
              <span className="font-semibold">
                {patient.priority.level.toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Patient {formatPatientId(patient.id)}
              </h1>
              <p className="text-gray-600 mt-1">
                {patient.priority.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Edit Patient
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age Group
              </label>
              {isEditing ? (
                <select
                  value={editForm.ageGroup || patient.ageGroup}
                  onChange={e =>
                    handleFieldChange('ageGroup', e.currentTarget.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="child">Child</option>
                  <option value="adult">Adult</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{patient.ageGroup}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobility
              </label>
              {isEditing ? (
                <select
                  value={editForm.mobility || patient.mobility || ''}
                  onChange={e =>
                    handleFieldChange(
                      'mobility',
                      e.currentTarget.value || undefined
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Not assessed</option>
                  <option value="ambulatory">Ambulatory</option>
                  <option value="non-ambulatory">Non-ambulatory</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {patient.mobility || 'Not assessed'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    patient.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : patient.status === 'treated'
                        ? 'bg-green-100 text-green-800'
                        : patient.status === 'transferred'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {patient.status.charAt(0).toUpperCase() +
                    patient.status.slice(1)}
                </span>

                {!isEditing && patient.status === 'active' && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleStatusChange('treated')}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Mark Treated
                    </button>
                    <button
                      onClick={() => handleStatusChange('transferred')}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                    >
                      Transfer
                    </button>
                    <button
                      onClick={() => handleStatusChange('discharged')}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      Discharge
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessed
              </label>
              <p className="text-gray-900">
                {formatTimestamp(patient.timestamp)}
              </p>
            </div>

            {patient.lastUpdated.getTime() !== patient.timestamp.getTime() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Updated
                </label>
                <p className="text-gray-900">
                  {formatTimestamp(patient.lastUpdated)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vital Signs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Vital Signs
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pulse (BPM)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={editForm.vitals?.pulse || ''}
                  onChange={e =>
                    handleFieldChange(
                      'vitals.pulse',
                      e.currentTarget.value
                        ? parseInt(e.currentTarget.value)
                        : null
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter pulse rate"
                />
              ) : (
                <p className="text-gray-900">
                  {patient.vitals.pulse || 'Not recorded'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Breathing
              </label>
              {isEditing ? (
                <select
                  value={editForm.vitals?.breathing || patient.vitals.breathing}
                  onChange={e =>
                    handleFieldChange('vitals.breathing', e.currentTarget.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="labored">Labored</option>
                  <option value="absent">Absent</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {patient.vitals.breathing}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Circulation
              </label>
              {isEditing ? (
                <select
                  value={
                    editForm.vitals?.circulation || patient.vitals.circulation
                  }
                  onChange={e =>
                    handleFieldChange(
                      'vitals.circulation',
                      e.currentTarget.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="bleeding">Bleeding</option>
                  <option value="shock">Shock</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {patient.vitals.circulation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consciousness (AVPU)
              </label>
              {isEditing ? (
                <select
                  value={
                    editForm.vitals?.consciousness ||
                    patient.vitals.consciousness
                  }
                  onChange={e =>
                    handleFieldChange(
                      'vitals.consciousness',
                      e.currentTarget.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="alert">Alert</option>
                  <option value="verbal">Responds to Verbal</option>
                  <option value="pain">Responds to Pain</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {patient.vitals.consciousness === 'alert'
                    ? 'Alert'
                    : patient.vitals.consciousness === 'verbal'
                      ? 'Responds to Verbal'
                      : patient.vitals.consciousness === 'pain'
                        ? 'Responds to Pain'
                        : 'Unresponsive'}
                </p>
              )}
            </div>

            {/* Additional vitals if present */}
            {(patient.vitals.respiratoryRate || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respiratory Rate (BPM)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.vitals?.respiratoryRate || ''}
                    onChange={e =>
                      handleFieldChange(
                        'vitals.respiratoryRate',
                        e.currentTarget.value
                          ? parseInt(e.currentTarget.value)
                          : null
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter respiratory rate"
                  />
                ) : (
                  <p className="text-gray-900">
                    {patient.vitals.respiratoryRate || 'Not recorded'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Injuries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Injuries</h2>

        {isEditing ? (
          <div className="space-y-3">
            {(editForm.injuries || []).map((injury, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={injury}
                  onChange={e =>
                    handleInjuryChange(index, e.currentTarget.value)
                  }
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe injury"
                />
                <button
                  onClick={() => removeInjury(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove injury"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <button
              onClick={addInjury}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Injury</span>
            </button>
          </div>
        ) : (
          <div>
            {patient.injuries.length > 0 ? (
              <ul className="space-y-2">
                {patient.injuries.map((injury, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span className="text-gray-900">{injury}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No injuries recorded</p>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>

        {isEditing ? (
          <textarea
            value={editForm.notes || ''}
            onChange={e => handleFieldChange('notes', e.currentTarget.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes about the patient..."
          />
        ) : (
          <div>
            {patient.notes ? (
              <p className="text-gray-900 whitespace-pre-wrap">
                {patient.notes}
              </p>
            ) : (
              <p className="text-gray-500 italic">No notes recorded</p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Delete Patient
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showStatusConfirm.show}
        title="Confirm Status Change"
        message={`Are you sure you want to change the patient status to ${showStatusConfirm.status}?`}
        onConfirm={() => updateStatus(showStatusConfirm.status)}
        onCancel={() => setShowStatusConfirm({ status: 'active', show: false })}
      >
        {showStatusConfirm.status === 'discharged' && (
          <div className="mt-2 text-sm text-amber-600">
            This action will mark the patient as discharged from care.
          </div>
        )}
      </ConfirmationDialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Patient Record"
        message="Are you sure you want to permanently delete this patient record?"
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      >
        <div className="font-medium text-red-600">
          This action cannot be undone.
        </div>
      </ConfirmationDialog>
    </div>
  );
}
