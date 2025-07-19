/**
 * Patient Intake Form Component
 * Implements comprehensive patient assessment form with START triage integration
 */

import { useState, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import type { PatientDataInput } from '../types/PatientData';
import type { TriagePriority } from '../types/TriagePriority';
import { triageEngine } from '../services/TriageEngine';
import { dataService } from '../services/DataService';

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
  }, [formData]);

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
      newErrors.ageGroup = 'Age group is required';
    }

    if (!formData.breathing) {
      newErrors.breathing = 'Breathing status is required';
    }

    if (!formData.circulation) {
      newErrors.circulation = 'Circulation status is required';
    }

    if (!formData.consciousness) {
      newErrors.consciousness = 'Consciousness level is required';
    }

    if (!formData.mobility) {
      newErrors.mobility = 'Mobility status is required';
    }

    // Pulse validation
    if (formData.pulse) {
      const pulseNum = parseInt(formData.pulse);
      if (isNaN(pulseNum) || pulseNum < 20 || pulseNum > 250) {
        newErrors.pulse = 'Pulse must be between 20-250 bpm';
      }
    }

    // Respiratory rate validation
    if (formData.respiratoryRate) {
      const respRate = parseInt(formData.respiratoryRate);
      if (isNaN(respRate) || respRate < 5 || respRate > 60) {
        newErrors.respiratoryRate =
          'Respiratory rate must be between 5-60 breaths/min';
      }
    }

    // Capillary refill validation
    if (formData.capillaryRefill) {
      const capRefill = parseFloat(formData.capillaryRefill);
      if (isNaN(capRefill) || capRefill < 0 || capRefill > 10) {
        newErrors.capillaryRefill =
          'Capillary refill must be between 0-10 seconds';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormComplete = (): boolean => {
    return Boolean(
      formData.ageGroup &&
        formData.breathing &&
        formData.circulation &&
        formData.consciousness &&
        formData.mobility
    );
  };

  const convertFormToPatientData = () => {
    return {
      id: 'temp-id', // Temporary ID for preview
      ageGroup: formData.ageGroup,
      vitals: {
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        breathing: formData.breathing,
        circulation: formData.circulation,
        consciousness: formData.consciousness,
        respiratoryRate: formData.respiratoryRate
          ? parseInt(formData.respiratoryRate)
          : null,
        capillaryRefill: formData.capillaryRefill
          ? parseFloat(formData.capillaryRefill)
          : null,
        radialPulse: formData.radialPulse || undefined,
      },
      mobility: formData.mobility,
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

      const patientId = await dataService.createPatient(patientInput);

      // Reset form
      setFormData(initialFormData);
      setPreviewPriority(null);
      setShowPreview(false);

      if (onSubmit) {
        onSubmit(patientId);
      }
    } catch (error) {
      console.error('Failed to create patient:', error);
      setErrors({ general: 'Failed to save patient data. Please try again.' });
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

  return (
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          {isEditing ? 'Edit Patient Assessment' : 'Patient Intake Assessment'}
        </h2>
        <p class="text-gray-600">
          Complete the triage assessment using START protocol guidelines
        </p>
      </div>

      {/* Triage Priority Preview */}
      {showPreview && previewPriority && (
        <div
          class="mb-6 p-4 rounded-lg border-2 border-dashed"
          style={{
            borderColor: previewPriority.color,
            backgroundColor: `${previewPriority.color}10`,
          }}
        >
          <div class="flex items-center gap-3">
            <div
              class="w-4 h-4 rounded-full"
              style={{ backgroundColor: previewPriority.color }}
            ></div>
            <div>
              <h3 class="font-semibold text-gray-900">
                Predicted Triage Priority
              </h3>
              <p class="text-sm" style={{ color: previewPriority.color }}>
                {previewPriority.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div class="bg-red-50 border border-red-200 rounded-md p-4">
            <p class="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Age Group Selection */}
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Age Group <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('ageGroup', 'child')}
              class={`p-3 border rounded-lg text-center transition-colors ${
                formData.ageGroup === 'child'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Child
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('ageGroup', 'adult')}
              class={`p-3 border rounded-lg text-center transition-colors ${
                formData.ageGroup === 'adult'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Adult
            </button>
          </div>
          {errors.ageGroup && (
            <p class="text-red-600 text-sm mt-1">{errors.ageGroup}</p>
          )}
        </div>

        {/* Vital Signs Section */}
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Vital Signs</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pulse */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Pulse (bpm)
              </label>
              <input
                type="number"
                value={formData.pulse}
                onChange={e =>
                  handleInputChange('pulse', e.currentTarget.value)
                }
                placeholder="e.g., 80"
                min="20"
                max="250"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.pulse && (
                <p class="text-red-600 text-sm mt-1">{errors.pulse}</p>
              )}
            </div>

            {/* Respiratory Rate */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (breaths/min)
              </label>
              <input
                type="number"
                value={formData.respiratoryRate}
                onChange={e =>
                  handleInputChange('respiratoryRate', e.currentTarget.value)
                }
                placeholder="e.g., 16"
                min="5"
                max="60"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Assessment Section */}
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Clinical Assessment
          </h3>

          <div class="space-y-4">
            {/* Breathing Status */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Breathing Status <span class="text-red-500">*</span>
              </label>
              <select
                value={formData.breathing}
                onChange={e =>
                  handleInputChange(
                    'breathing',
                    (e.target as HTMLSelectElement).value
                  )
                }
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select breathing status</option>
                <option value="normal">Normal</option>
                <option value="labored">Labored/Distressed</option>
                <option value="absent">Absent</option>
              </select>
              {errors.breathing && (
                <p class="text-red-600 text-sm mt-1">{errors.breathing}</p>
              )}
            </div>

            {/* Circulation Status */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Circulation Status <span class="text-red-500">*</span>
              </label>
              <select
                value={formData.circulation}
                onChange={e =>
                  handleInputChange(
                    'circulation',
                    (e.target as HTMLSelectElement).value
                  )
                }
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select circulation status</option>
                <option value="normal">Normal</option>
                <option value="bleeding">Active Bleeding</option>
                <option value="shock">Signs of Shock</option>
              </select>
              {errors.circulation && (
                <p class="text-red-600 text-sm mt-1">{errors.circulation}</p>
              )}
            </div>

            {/* Consciousness Level */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Consciousness Level (AVPU) <span class="text-red-500">*</span>
              </label>
              <select
                value={formData.consciousness}
                onChange={e =>
                  handleInputChange(
                    'consciousness',
                    (e.target as HTMLSelectElement).value
                  )
                }
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select consciousness level</option>
                <option value="alert">Alert</option>
                <option value="verbal">Responds to Verbal</option>
                <option value="pain">Responds to Pain</option>
                <option value="unresponsive">Unresponsive</option>
              </select>
              {errors.consciousness && (
                <p class="text-red-600 text-sm mt-1">{errors.consciousness}</p>
              )}
            </div>

            {/* Mobility Status */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Mobility Status <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('mobility', 'ambulatory')}
                  class={`p-3 border rounded-lg text-center transition-colors ${
                    formData.mobility === 'ambulatory'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Can Walk
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('mobility', 'non-ambulatory')
                  }
                  class={`p-3 border rounded-lg text-center transition-colors ${
                    formData.mobility === 'non-ambulatory'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Cannot Walk
                </button>
              </div>
              {errors.mobility && (
                <p class="text-red-600 text-sm mt-1">{errors.mobility}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Assessment */}
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Additional Assessment
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Capillary Refill */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Capillary Refill (seconds)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.capillaryRefill}
                onChange={e =>
                  handleInputChange(
                    'capillaryRefill',
                    (e.target as HTMLInputElement).value
                  )
                }
                placeholder="e.g., 2.0"
                min="0"
                max="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Radial Pulse */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Radial Pulse
              </label>
              <select
                value={formData.radialPulse}
                onChange={e =>
                  handleInputChange(
                    'radialPulse',
                    (e.target as HTMLSelectElement).value
                  )
                }
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select pulse status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Injuries */}
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Visible Injuries
            </label>
            <textarea
              value={formData.injuries}
              onChange={e =>
                handleInputChange(
                  'injuries',
                  (e.target as HTMLTextAreaElement).value
                )
              }
              placeholder="Describe visible injuries, separated by commas"
              rows={3}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e =>
                handleInputChange(
                  'notes',
                  (e.target as HTMLTextAreaElement).value
                )
              }
              placeholder="Any additional observations or notes"
              rows={3}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div class="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting || !isFormComplete()}
            class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Update Patient'
                : 'Save Patient'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
