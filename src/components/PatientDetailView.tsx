/**
 * Patient Detail View Component
 * Displays detailed patient information with editing capabilities
 * Allows updating vital signs, status changes, and triage priority recalculation
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import { PatientData, PatientDataUpdate } from '../types';
import { dataService } from '../services/DataService';
import { ConfirmationDialog, Button } from './ui/';
import { useTranslation, useFormNavigationGuard } from '../hooks';

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
  const { t } = useTranslation();
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
        setError(t('dashboard.noPatients'));
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
      setError(t('toast.errorOccurred'));
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // Load patient data on mount
  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!isEditing || !patient) return false;

    // Compare edit form with original patient data
    const hasChanges =
      editForm.ageGroup !== patient.ageGroup ||
      editForm.status !== patient.status ||
      editForm.notes !== (patient.notes || '') ||
      JSON.stringify(editForm.vitals) !== JSON.stringify(patient.vitals) ||
      editForm.mobility !== patient.mobility ||
      JSON.stringify(editForm.injuries) !== JSON.stringify(patient.injuries);

    return hasChanges && !isSaving;
  }, [isEditing, patient, editForm, isSaving]);

  // Navigation guard for unsaved changes
  useFormNavigationGuard(hasUnsavedChanges(), 'patient-detail');

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
      setError(t('toast.errorOccurred'));
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
      setError(t('toast.errorOccurred'));
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
      setError(t('toast.errorOccurred'));
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
          <p className="text-gray-600">{t('common.loading')}</p>
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
              <h3 className="text-sm font-medium text-red-800">
                {t('common.error')}
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-2 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={loadPatient}
                  className="w-full sm:w-auto"
                >
                  {t('common.tryAgain')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  {t('common.close')}
                </Button>
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
    <div className={`space-y-4 sm:space-y-6 pb-8 px-2 sm:px-0 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            {/* Priority indicator */}
            <div
              className="flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium w-fit"
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

            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                {t('patient.details')} {formatPatientId(patient.id)}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {patient.priority.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {!isEditing && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto"
              >
                {t('patient.edit')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              {t('common.close')}
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm break-words">{error}</p>
          </div>
        )}
      </div>

      {/* Patient Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('intake.basicInfo')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.ageGroup')}
              </label>
              {isEditing ? (
                <select
                  value={editForm.ageGroup || patient.ageGroup}
                  onChange={e =>
                    handleFieldChange('ageGroup', e.currentTarget.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="child">{t('intake.ageGroup.child')}</option>
                  <option value="adult">{t('intake.ageGroup.adult')}</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{patient.ageGroup}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.mobility')}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">{t('validation.selectOption')}</option>
                  <option value="ambulatory">
                    {t('intake.mobility.ambulatory')}
                  </option>
                  <option value="non-ambulatory">
                    {t('intake.mobility.immobile')}
                  </option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {patient.mobility === 'ambulatory'
                    ? t('intake.mobility.ambulatory')
                    : patient.mobility === 'non-ambulatory'
                      ? t('intake.mobility.immobile')
                      : t('validation.selectOption')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patient.status')}
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
                  {t(`status.${patient.status}`)}
                </span>

                {!isEditing && patient.status === 'active' && (
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mt-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleStatusChange('treated')}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {t('status.treated')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('transferred')}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {t('status.transferred')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('discharged')}
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200 w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {t('status.discharged')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patient.assessedAt')}
              </label>
              <p className="text-gray-900">
                {formatTimestamp(patient.timestamp)}
              </p>
            </div>

            {patient.lastUpdated.getTime() !== patient.timestamp.getTime() && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patient.lastUpdated')}
                </label>
                <p className="text-gray-900">
                  {formatTimestamp(patient.lastUpdated)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Vital Signs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('intake.vitals')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.pulse')}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t('intake.pulsePlaceholder')}
                />
              ) : (
                <p className="text-gray-900">
                  {patient.vitals.pulse || t('validation.notRecorded')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.breathing')}
              </label>
              {isEditing ? (
                <select
                  value={editForm.vitals?.breathing || patient.vitals.breathing}
                  onChange={e =>
                    handleFieldChange('vitals.breathing', e.currentTarget.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="normal">{t('intake.breathing.normal')}</option>
                  <option value="labored">
                    {t('intake.breathing.labored')}
                  </option>
                  <option value="absent">{t('intake.breathing.absent')}</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {t(`intake.breathing.${patient.vitals.breathing}`)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.circulation')}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="normal">
                    {t('intake.circulation.normal')}
                  </option>
                  <option value="bleeding">
                    {t('intake.circulation.bleeding')}
                  </option>
                  <option value="shock">{t('intake.circulation.shock')}</option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {t(`intake.circulation.${patient.vitals.circulation}`)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('intake.consciousness')}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="alert">
                    {t('intake.consciousness.alert')}
                  </option>
                  <option value="verbal">
                    {t('intake.consciousness.verbal')}
                  </option>
                  <option value="pain">{t('intake.consciousness.pain')}</option>
                  <option value="unresponsive">
                    {t('intake.consciousness.unresponsive')}
                  </option>
                </select>
              ) : (
                <p className="text-gray-900 capitalize">
                  {t(`intake.consciousness.${patient.vitals.consciousness}`)}
                </p>
              )}
            </div>

            {/* Additional vitals if present */}
            {(patient.vitals.respiratoryRate || isEditing) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('intake.respiratoryRate')}
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
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder={t('intake.respiratoryPlaceholder')}
                  />
                ) : (
                  <p className="text-gray-900">
                    {patient.vitals.respiratoryRate ||
                      t('validation.notRecorded')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Injuries */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('intake.injuries')}
        </h2>

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
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t('intake.injuriesPlaceholder')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInjury(index)}
                  className="p-2 flex-shrink-0 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50 border-none"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={addInjury}
              className="bg-transparent text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-none text-sm font-medium flex items-center space-x-1 py-2"
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
              <span>{t('common.add')}</span>
            </Button>
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
              <p className="text-gray-500 italic">
                {t('validation.notRecorded')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('intake.notes')}
        </h2>

        {isEditing ? (
          <textarea
            value={editForm.notes || ''}
            onChange={e => handleFieldChange('notes', e.currentTarget.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
            placeholder={t('intake.notesPlaceholder')}
          />
        ) : (
          <div>
            {patient.notes ? (
              <p className="text-gray-900 whitespace-pre-wrap">
                {patient.notes}
              </p>
            ) : (
              <p className="text-gray-500 italic">
                {t('validation.notRecorded')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              {t('patient.delete')}
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 order-1 sm:order-2">
              <Button
                variant="secondary"
                size="md"
                onClick={handleCancel}
                disabled={isSaving}
                className="bg-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center space-x-2"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>
                  {isSaving ? t('common.updating') : t('patient.save')}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showStatusConfirm.show}
        title={t('patient.confirmStatusChange')}
        message={`${t('patient.confirmStatusChangeMsg')} ${t(`status.${showStatusConfirm.status}`)}?`}
        onConfirm={() => updateStatus(showStatusConfirm.status)}
        onCancel={() => setShowStatusConfirm({ status: 'active', show: false })}
      >
        {showStatusConfirm.status === 'discharged' && (
          <div className="mt-2 text-sm text-amber-600">
            {t('patient.dischargeMsg')}
          </div>
        )}
      </ConfirmationDialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title={t('patient.confirmDelete')}
        message={t('patient.confirmDeleteMsg')}
        confirmText={t('common.delete')}
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      >
        <div className="font-medium text-red-600">
          {t('patient.actionCanNotBeUndone')}
        </div>
      </ConfirmationDialog>
    </div>
  );
}
