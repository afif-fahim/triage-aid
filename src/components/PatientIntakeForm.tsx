/**
 * Patient Intake Form Component
 * Implements comprehensive patient assessment form with START triage integration
 */

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { JSX } from 'preact';
import type { PatientDataInput, PatientData } from '../types/PatientData';
import type { TriagePriority } from '../types/TriagePriority';
import { triageEngine } from '../services/TriageEngine';
import { dataService } from '../services/DataService';
import { Card, Button, ResponsiveGrid } from './ui/';
import { useTranslation, useFormNavigationGuard } from '../hooks';

interface PatientIntakeFormProps {
  onSubmit?: (patientId: string) => void;
  onCancel?: () => void;
  existingPatient?: PatientDataInput;
  isEditing?: boolean;
}

interface FormErrors {
  ageGroup?: string;
  pulse?: string;
  breathing?: string;
  circulation?: string;
  consciousness?: string;
  mobility?: string;
  respiratoryRate?: string;
  capillaryRefill?: string;
  general?: string;
}

interface FormData {
  ageGroup: 'child' | 'adult' | '';
  pulse: string;
  breathing: 'normal' | 'labored' | 'absent' | '';
  circulation: 'normal' | 'bleeding' | 'shock' | '';
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | '';
  respiratoryRate: string;
  capillaryRefill: string;
  radialPulse: 'present' | 'absent' | '';
  mobility: 'ambulatory' | 'non-ambulatory' | '';
  injuries: string;
  notes: string;
}

const initialFormData: FormData = {
  ageGroup: '',
  pulse: '',
  breathing: '',
  circulation: '',
  consciousness: '',
  respiratoryRate: '',
  capillaryRefill: '',
  radialPulse: '',
  mobility: '',
  injuries: '',
  notes: '',
};

export function PatientIntakeForm({
  onSubmit,
  onCancel,
  existingPatient,
  isEditing = false,
}: PatientIntakeFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPriority, setPreviewPriority] = useState<TriagePriority | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  // Initialize form with existing patient data if editing
  useEffect(() => {
    if (existingPatient) {
      setFormData({
        ageGroup: existingPatient.ageGroup,
        pulse: existingPatient.vitals.pulse?.toString() || '',
        breathing: existingPatient.vitals.breathing,
        circulation: existingPatient.vitals.circulation,
        consciousness: existingPatient.vitals.consciousness,
        respiratoryRate:
          existingPatient.vitals.respiratoryRate?.toString() || '',
        capillaryRefill:
          existingPatient.vitals.capillaryRefill?.toString() || '',
        radialPulse: existingPatient.vitals.radialPulse || '',
        mobility: existingPatient.mobility || '',
        injuries: existingPatient.injuries.join(', '),
        notes: existingPatient.notes || '',
      });
    }
  }, [existingPatient]);

  // Check if form is dirty (has unsaved changes)
  const isFormDirty = useCallback((): boolean => {
    // Compare current form data with initial state
    const hasChanges = Object.keys(formData).some(key => {
      const currentValue = formData[key as keyof FormData];
      const initialValue = initialFormData[key as keyof FormData];
      return currentValue !== initialValue;
    });

    return hasChanges && !isSubmitting;
  }, [formData, isSubmitting]);

  // Navigation guard for unsaved form changes
  useFormNavigationGuard(isFormDirty(), 'intake');

  // Check if form has required fields completed
  const isFormComplete = useCallback((): boolean => {
    return Boolean(
      formData.ageGroup &&
        formData.breathing &&
        formData.circulation &&
        formData.consciousness &&
        formData.mobility
    );
  }, [formData]);

  // Convert form data to patient data for triage calculation
  const convertFormToPatientData = useCallback((): PatientData => {
    return {
      id: 'temp-id', // Temporary ID for preview
      ageGroup: formData.ageGroup as 'child' | 'adult',
      vitals: {
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        breathing: formData.breathing as 'normal' | 'labored' | 'absent',
        circulation: formData.circulation as 'normal' | 'bleeding' | 'shock',
        consciousness: formData.consciousness as
          | 'alert'
          | 'verbal'
          | 'pain'
          | 'unresponsive',
        respiratoryRate: formData.respiratoryRate
          ? parseInt(formData.respiratoryRate)
          : null,
        capillaryRefill: formData.capillaryRefill
          ? parseFloat(formData.capillaryRefill)
          : null,
        radialPulse: formData.radialPulse as 'present' | 'absent' | undefined,
      },
      mobility: formData.mobility as 'ambulatory' | 'non-ambulatory',
      injuries: formData.injuries
        ? formData.injuries
            .split(',')
            .map(i => i.trim())
            .filter(i => i)
        : [],
      notes: formData.notes || undefined,
      timestamp: new Date(),
      lastUpdated: new Date(),
      priority: {
        level: 'green',
        description: '',
        urgency: 3,
        color: '',
        icon: '',
      }, // Temporary
      status: 'active' as const,
    };
  }, [formData]);

  // Real-time triage preview calculation
  useEffect(() => {
    const calculatePreview = () => {
      if (isFormComplete()) {
        try {
          const patientData = convertFormToPatientData();
          const assessment = triageEngine.assessPatient(patientData);
          setPreviewPriority(assessment.priority);
          setShowPreview(true);
        } catch {
          setPreviewPriority(null);
          setShowPreview(false);
        }
      } else {
        setShowPreview(false);
      }
    };

    calculatePreview();
  }, [formData, isFormComplete, convertFormToPatientData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.ageGroup) {
      newErrors.ageGroup = t('validation.required');
    }

    if (!formData.breathing) {
      newErrors.breathing = t('validation.required');
    }

    if (!formData.circulation) {
      newErrors.circulation = t('validation.required');
    }

    if (!formData.consciousness) {
      newErrors.consciousness = t('validation.required');
    }

    if (!formData.mobility) {
      newErrors.mobility = t('validation.required');
    }

    // Pulse validation
    if (formData.pulse) {
      const pulseNum = parseInt(formData.pulse);
      if (isNaN(pulseNum) || pulseNum < 20 || pulseNum > 250) {
        newErrors.pulse = t('validation.invalidPulse');
      }
    }

    // Respiratory rate validation
    if (formData.respiratoryRate) {
      const respRate = parseInt(formData.respiratoryRate);
      if (isNaN(respRate) || respRate < 5 || respRate > 60) {
        newErrors.respiratoryRate = t('validation.invalidRespiratory');
      }
    }

    // Capillary refill validation
    if (formData.capillaryRefill) {
      const capRefill = parseFloat(formData.capillaryRefill);
      if (isNaN(capRefill) || capRefill < 0 || capRefill > 10) {
        newErrors.capillaryRefill = t('validation.invalidCapillary');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const patientInput: PatientDataInput = {
        ageGroup: formData.ageGroup as 'child' | 'adult',
        vitals: {
          pulse: formData.pulse ? parseInt(formData.pulse) : null,
          breathing: formData.breathing as 'normal' | 'labored' | 'absent',
          circulation: formData.circulation as 'normal' | 'bleeding' | 'shock',
          consciousness: formData.consciousness as
            | 'alert'
            | 'verbal'
            | 'pain'
            | 'unresponsive',
          respiratoryRate: formData.respiratoryRate
            ? parseInt(formData.respiratoryRate)
            : null,
          capillaryRefill: formData.capillaryRefill
            ? parseFloat(formData.capillaryRefill)
            : null,
          radialPulse: formData.radialPulse as 'present' | 'absent' | undefined,
        },
        mobility: formData.mobility as 'ambulatory' | 'non-ambulatory',
        injuries: formData.injuries
          ? formData.injuries
              .split(',')
              .map(i => i.trim())
              .filter(i => i)
          : [],
        notes: formData.notes || undefined,
      };

      const newPatientId = await dataService.createPatient(patientInput);

      // Reset form
      setFormData(initialFormData);
      setPreviewPriority(null);
      setShowPreview(false);

      if (onSubmit) {
        onSubmit(newPatientId);
      }
    } catch (error) {
      console.error('Failed to create patient:', error);
      setErrors({ general: t('toast.errorOccurred') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setPreviewPriority(null);
    setShowPreview(false);

    if (onCancel) {
      onCancel();
    }
  };

  // Calculate form completion progress
  const getFormProgress = () => {
    const requiredFields = [
      'ageGroup',
      'breathing',
      'circulation',
      'consciousness',
      'mobility',
    ];
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData];
      return value && value !== '';
    });
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card variant="default" padding="md">
        <div class="text-center sm:text-left">
          <h2 class="text-responsive-xl font-bold text-medical-text-primary mb-2">
            {isEditing ? t('patient.edit.title') : t('patient.intake.title')}
          </h2>
          <p class="text-medical-text-secondary text-responsive-sm mb-4">
            {t('assessment.start.sub')}
          </p>

          {/* Progress Indicator */}
          <div class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-medical-text-primary">
                {t('intake.progress')}
              </span>
              <span class="text-sm text-medical-text-secondary">
                {getFormProgress()}% {t('common.complete')}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-medical-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getFormProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Triage Priority Preview */}
      {showPreview && previewPriority && (
        <div
          className="animate-slide-up medical-card border-2 border-dashed"
          style={{
            borderColor: previewPriority.color,
            backgroundColor: `${previewPriority.color}08`,
          }}
        >
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: previewPriority.color }}
            />
            <div class="flex-1">
              <h3 class="font-semibold text-medical-text-primary text-responsive-sm">
                Predicted Triage Priority
              </h3>
              <p
                class="text-sm font-medium"
                style={{ color: previewPriority.color }}
              >
                {previewPriority.description}
              </p>
            </div>
            <div class="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-md">
              Preview
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* General Error */}
        {errors.general && (
          <Card
            variant="outlined"
            padding="sm"
            className="border-medical-error bg-red-50"
          >
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-medical-error flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p class="text-medical-error text-sm font-medium">
                {errors.general}
              </p>
            </div>
          </Card>
        )}

        {/* Basic Information Section */}
        <Card variant="default" padding="md">
          <h3 class="text-responsive-lg font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
            <div class="w-6 h-6 bg-medical-secondary text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            {t('intake.basicInfo')}
          </h3>

          {/* Age Group Selection */}
          <div>
            <label class="block text-sm font-medium text-medical-text-primary mb-3">
              {t('intake.ageGroup')} <span class="text-medical-error">*</span>
            </label>
            <ResponsiveGrid cols={{ xs: 2 }} gap="sm">
              <button
                type="button"
                onClick={() => handleInputChange('ageGroup', 'child')}
                class={`
                  touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                  ${
                    formData.ageGroup === 'child'
                      ? 'border-medical-primary bg-blue-50 text-medical-primary shadow-sm'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                  }
                `}
              >
                <div class="text-2xl mb-1">👶</div>
                {t('intake.ageGroup.child')}
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('ageGroup', 'adult')}
                class={`
                  touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                  ${
                    formData.ageGroup === 'adult'
                      ? 'border-medical-primary bg-blue-50 text-medical-primary shadow-sm'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                  }
                `}
              >
                <div class="text-2xl mb-1">👤</div>
                {t('intake.ageGroup.adult')}
              </button>
            </ResponsiveGrid>
            {errors.ageGroup && (
              <p class="text-medical-error text-sm mt-2 flex items-center gap-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.ageGroup}
              </p>
            )}
          </div>
        </Card>

        {/* Vital Signs Section */}
        <Card variant="default" padding="md">
          <h3 class="text-responsive-lg font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
            <div class="w-6 h-6 bg-medical-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            {t('intake.vitals')}
          </h3>

          <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap="md">
            {/* Pulse */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.pulse')}
              </label>
              <input
                type="number"
                value={formData.pulse}
                onChange={e =>
                  handleInputChange('pulse', e.currentTarget.value)
                }
                placeholder={t('intake.pulsePlaceholder')}
                min="20"
                max="250"
                class="form-input"
              />
              {errors.pulse && (
                <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.pulse}
                </p>
              )}
            </div>

            {/* Respiratory Rate */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.respiratoryRate')}
              </label>
              <input
                type="number"
                value={formData.respiratoryRate}
                onChange={e =>
                  handleInputChange('respiratoryRate', e.currentTarget.value)
                }
                placeholder={t('intake.respiratoryPlaceholder')}
                min="5"
                max="60"
                class="form-input"
              />
              {errors.respiratoryRate && (
                <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.respiratoryRate}
                </p>
              )}
            </div>
          </ResponsiveGrid>
        </Card>

        {/* Clinical Assessment Section */}
        <Card variant="default" padding="md">
          <h3 class="text-responsive-lg font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
            <div class="w-6 h-6 bg-medical-success text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            {t('intake.clinicalAssessment')}
          </h3>

          <div class="space-y-6">
            {/* Breathing Status */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.breathing')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.breathing}
                onChange={e =>
                  handleInputChange('breathing', e.currentTarget.value)
                }
                class="form-select"
              >
                <option value="">{t('validation.selectOption')}</option>
                <option value="normal">
                  🫁 {t('intake.breathing.normal')}
                </option>
                <option value="labored">
                  😤 {t('intake.breathing.labored')}
                </option>
                <option value="absent">
                  ❌ {t('intake.breathing.absent')}
                </option>
              </select>
              {errors.breathing && (
                <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.breathing}
                </p>
              )}
            </div>

            {/* Circulation Status */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.circulation')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.circulation}
                onChange={e =>
                  handleInputChange('circulation', e.currentTarget.value)
                }
                class="form-select"
              >
                <option value="">{t('validation.selectOption')}</option>
                <option value="normal">
                  💓 {t('intake.circulation.normal')}
                </option>
                <option value="bleeding">
                  🩸 {t('intake.circulation.bleeding')}
                </option>
                <option value="shock">
                  ⚠️ {t('intake.circulation.shock')}
                </option>
              </select>
              {errors.circulation && (
                <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.circulation}
                </p>
              )}
            </div>

            {/* Consciousness Level */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.consciousness')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.consciousness}
                onChange={e =>
                  handleInputChange('consciousness', e.currentTarget.value)
                }
                class="form-select"
              >
                <option value="">{t('validation.selectOption')}</option>
                <option value="alert">
                  😊 {t('intake.consciousness.alert')}
                </option>
                <option value="verbal">
                  🗣️ {t('intake.consciousness.verbal')}
                </option>
                <option value="pain">
                  😣 {t('intake.consciousness.pain')}
                </option>
                <option value="unresponsive">
                  😵 {t('intake.consciousness.unresponsive')}
                </option>
              </select>
              {errors.consciousness && (
                <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.consciousness}
                </p>
              )}
            </div>

            {/* Mobility Status */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-3">
                {t('intake.mobility')} <span class="text-medical-error">*</span>
              </label>
              <ResponsiveGrid cols={{ xs: 2 }} gap="sm">
                <button
                  type="button"
                  onClick={() => handleInputChange('mobility', 'ambulatory')}
                  class={`
                    touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                    ${
                      formData.mobility === 'ambulatory'
                        ? 'border-medical-success bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <div class="text-2xl mb-1">🚶</div>
                  {t('intake.mobility.ambulatory')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('mobility', 'non-ambulatory')
                  }
                  class={`
                    touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                    ${
                      formData.mobility === 'non-ambulatory'
                        ? 'border-medical-warning bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <div class="text-2xl mb-1">🛏️</div>
                  {t('intake.mobility.immobile')}
                </button>
              </ResponsiveGrid>
              {errors.mobility && (
                <p class="text-medical-error text-sm mt-2 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {errors.mobility}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Additional Assessment */}
        <Card variant="default" padding="md">
          <h3 class="text-responsive-lg font-semibold text-medical-text-primary mb-4 flex items-center gap-2">
            <div class="w-6 h-6 bg-medical-warning text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </div>
            {t('intake.additional')}
          </h3>

          <div class="space-y-6">
            <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap="md">
              {/* Capillary Refill */}
              <div>
                <label class="block text-sm font-medium text-medical-text-primary mb-2">
                  {t('intake.capillaryRefill')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.capillaryRefill}
                  onChange={e =>
                    handleInputChange('capillaryRefill', e.currentTarget.value)
                  }
                  placeholder={t('intake.capillaryPlaceholder')}
                  min="0"
                  max="10"
                  class="form-input"
                />
                {errors.capillaryRefill && (
                  <p class="text-medical-error text-sm mt-1 flex items-center gap-1">
                    <svg
                      class="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.capillaryRefill}
                  </p>
                )}
              </div>

              {/* Radial Pulse */}
              <div>
                <label class="block text-sm font-medium text-medical-text-primary mb-2">
                  {t('intake.radialPulse')}
                </label>
                <select
                  value={formData.radialPulse}
                  onChange={e =>
                    handleInputChange('radialPulse', e.currentTarget.value)
                  }
                  class="form-select"
                >
                  <option value="">{t('validation.selectOption')}</option>
                  <option value="present">
                    ✅ {t('intake.radialPulse.present')}
                  </option>
                  <option value="absent">
                    ❌ {t('intake.radialPulse.absent')}
                  </option>
                </select>
              </div>
            </ResponsiveGrid>

            {/* Injuries */}
            {/* TODO: Use the edit form here too */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.injuries')}
              </label>
              <textarea
                value={formData.injuries}
                onChange={e =>
                  handleInputChange('injuries', e.currentTarget.value)
                }
                placeholder={t('intake.injuriesPlaceholder')}
                rows={3}
                class="form-textarea"
              />
              <p class="text-xs text-medical-text-muted mt-1">
                {t('intake.injuriesPlaceholder')}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.notes')}
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  handleInputChange('notes', e.currentTarget.value)
                }
                placeholder={t('intake.notesPlaceholder')}
                rows={3}
                class="form-textarea"
              />
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div class="sticky bottom-4 safe-bottom flex justify-center">
          <Card
            variant="default"
            padding="md"
            className="bg-white/30 backdrop-blur-md max-w-md w-full"
          >
            <div class="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting || !isFormComplete()}
                loading={isSubmitting}
                className="flex-[2] disabled:!bg-gray-400 disabled:hover:!bg-gray-400 disabled:!text-white-600"
              >
                {isEditing ? t('common.update') : t('common.save')}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>

            {!isFormComplete() && (
              <p class="text-xs text-medical-text-muted mt-1.5 text-center">
                {t('intake.completeRequired')}
              </p>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}
