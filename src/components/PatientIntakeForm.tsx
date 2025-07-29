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
import { formPopulationService } from '../services/FormPopulationService';
import { localAIService } from '../services/LocalAIService';
import { Card, Button, ResponsiveGrid } from './ui/';
import { useTranslation, useFormNavigationGuard } from '../hooks';
import { VoiceTriageComponent } from './VoiceTriageComponent';
import type { TriageAnalysis } from '../types/VoiceRecognition';

interface PatientIntakeFormProps {
  onSubmit?: (patientId: string) => void;
  onCancel?: () => void;
  existingPatient?: PatientDataInput;
  isEditing?: boolean;
  voiceEnabled?: boolean;
  onVoiceToggle?: (enabled: boolean) => void;
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
  voiceEnabled = false,
  onVoiceToggle,
}: PatientIntakeFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPriority, setPreviewPriority] = useState<TriagePriority | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  // Voice-related state
  const [voiceMode, setVoiceMode] = useState(voiceEnabled);
  const [aiPopulationResult, setAiPopulationResult] = useState<any>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

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

  // Sync voice mode with prop
  useEffect(() => {
    setVoiceMode(voiceEnabled);
  }, [voiceEnabled]);

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

    // Mark field as user-modified if it was AI-populated
    const fieldPath = field.includes('.') ? field : field;
    if (formPopulationService.isFieldAutoPopulated(fieldPath)) {
      formPopulationService.markFieldAsUserModified(fieldPath, value);
    }

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

      // Clear AI population data
      formPopulationService.clearPopulationData();
      setAiPopulationResult(null);
      setShowAiSuggestions(false);

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

    // Clear AI population data
    formPopulationService.clearPopulationData();
    setAiPopulationResult(null);
    setShowAiSuggestions(false);

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

  // Get field styling based on AI population status
  const getFieldClassName = (fieldName: string, baseClassName: string = '') => {
    const indicatorClass =
      formPopulationService.getFieldIndicatorClass(fieldName);
    return `${baseClassName} ${indicatorClass}`.trim();
  };

  // Get field tooltip for AI populated fields
  const getFieldTooltip = (fieldName: string) => {
    return formPopulationService.getFieldTooltip(fieldName);
  };

  // Render AI field badge
  const renderAiFieldBadge = (fieldName: string) => {
    const fieldStatus = formPopulationService.getFieldStatus(fieldName);
    if (!fieldStatus.isAutoPopulated) return null;

    let badgeClass = 'ai-field-badge ';
    let badgeText = '';

    if (fieldStatus.isUserModified) {
      badgeClass += 'user-modified';
      badgeText = 'Modified';
    } else if (fieldStatus.confidence) {
      if (fieldStatus.confidence >= 0.8) {
        badgeClass += 'high-confidence';
        badgeText = 'AI';
      } else if (fieldStatus.confidence >= 0.6) {
        badgeClass += 'medium-confidence';
        badgeText = 'AI';
      } else {
        badgeClass += 'low-confidence';
        badgeText = 'AI?';
      }
    }

    return (
      <span
        className={badgeClass}
        title={getFieldTooltip(fieldName) || undefined}
      >
        {badgeText}
      </span>
    );
  };

  // Dismiss AI suggestions
  const dismissAiSuggestions = () => {
    setShowAiSuggestions(false);
    setAiPopulationResult(null);
  };

  // Handle voice mode toggle
  const handleVoiceToggle = () => {
    const newVoiceMode = !voiceMode;
    setVoiceMode(newVoiceMode);

    if (onVoiceToggle) {
      onVoiceToggle(newVoiceMode);
    }
  };

  // Handle voice text generation
  const handleVoiceTextGenerated = async (text: string) => {
    if (!text.trim()) return;

    try {
      // Use LocalAIService to process the transcribed text
      const analysis = await localAIService.processTriageText(text.trim());

      // Automatically populate form fields from AI analysis
      handleVoiceFieldsPopulated(analysis);
    } catch (error) {
      console.error('Failed to process voice text:', error);
      // Show error but don't block the user - they can still use the transcribed text manually
      setErrors(prev => ({
        ...prev,
        general:
          'Voice processing failed, but you can still edit the form manually.',
      }));
    }
  };

  // Handle AI field population
  const handleVoiceFieldsPopulated = (analysis: TriageAnalysis) => {
    try {
      // Use FormPopulationService to populate fields
      const populationResult = formPopulationService.populateFromAI(
        analysis,
        formData,
        {
          overwriteExisting: false,
          minimumConfidence: 0.3,
          preserveUserEdits: true,
        }
      );

      // Update form data with AI suggestions
      if (populationResult.formData) {
        setFormData(prev => ({
          ...prev,
          ...populationResult.formData,
          // Handle injuries array conversion
          injuries: Array.isArray(populationResult.formData.injuries)
            ? populationResult.formData.injuries.join(', ')
            : populationResult.formData.injuries || prev.injuries,
        }));
      }

      // Store AI population result for UI display
      setAiPopulationResult(populationResult);
      setShowAiSuggestions(true);

      // Clear any existing errors for populated fields
      const newErrors = { ...errors };
      populationResult.populatedFields.forEach(field => {
        const fieldKey = field.fieldName.replace(
          'vitals.',
          ''
        ) as keyof FormErrors;
        if (newErrors[fieldKey]) {
          delete newErrors[fieldKey];
        }
      });
      setErrors(newErrors);
    } catch (error) {
      console.error('Failed to populate form from AI analysis:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to process AI suggestions. Please try again.',
      }));
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card variant="default" padding="md">
        <div class="text-center sm:text-left">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div class="flex-1">
              <h2 class="text-responsive-xl font-bold text-medical-text-primary mb-2">
                {isEditing
                  ? t('patient.edit.title')
                  : t('patient.intake.title')}
              </h2>
              <p class="text-medical-text-secondary text-responsive-sm">
                {t('assessment.start.sub')}
              </p>
            </div>

            {/* Voice Mode Toggle */}
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceMode}
                  onChange={handleVoiceToggle}
                  class="sr-only"
                />
                <div
                  class={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${voiceMode ? 'bg-medical-primary' : 'bg-gray-300'}
                `}
                >
                  <span
                    class={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${voiceMode ? 'translate-x-6' : 'translate-x-1'}
                  `}
                  />
                </div>
                <span class="text-sm font-medium text-medical-text-primary flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Voice Mode
                </span>
              </label>
            </div>
          </div>

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

      {/* Voice Triage Component */}
      {voiceMode && (
        <VoiceTriageComponent
          onTextGenerated={handleVoiceTextGenerated}
          onFieldsPopulated={handleVoiceFieldsPopulated}
          isEnabled={voiceMode}
          language="en"
        />
      )}

      {/* AI Suggestions Display */}
      {showAiSuggestions && aiPopulationResult && (
        <Card
          variant="outlined"
          padding="md"
          className="border-blue-200 bg-blue-50"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="font-semibold text-blue-900">
                  AI Suggestions Applied
                </h3>
                <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  {(aiPopulationResult.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              <button
                onClick={dismissAiSuggestions}
                className="text-blue-600 hover:text-blue-800 p-1"
                aria-label="Dismiss suggestions"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Populated Fields Summary */}
            {aiPopulationResult.populatedFields.length > 0 && (
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">
                  Populated {aiPopulationResult.populatedFields.length}{' '}
                  field(s):
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiPopulationResult.populatedFields.map((field: any) => (
                    <span
                      key={field.fieldName}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {field.fieldName.replace('vitals.', '')} (
                      {(field.confidence * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {aiPopulationResult.warnings.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  ⚠️ Please Review:
                </p>
                <ul className="text-amber-700 space-y-1">
                  {aiPopulationResult.warnings.map(
                    (warning: string, index: number) => (
                      <li key={index} className="text-xs">
                        • {warning}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {aiPopulationResult.suggestions.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">
                  💡 Suggestions:
                </p>
                <ul className="text-blue-700 space-y-1">
                  {aiPopulationResult.suggestions
                    .slice(0, 3)
                    .map((suggestion: string, index: number) => (
                      <li key={index} className="text-xs">
                        • {suggestion}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-blue-600 border-t border-blue-200 pt-2">
              Fields with colored borders were auto-populated. You can edit any
              field to override AI suggestions.
            </div>
          </div>
        </Card>
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
                class={getFieldClassName(
                  'ageGroup',
                  `
                  relative touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                  ${
                    formData.ageGroup === 'child'
                      ? 'border-medical-primary bg-blue-50 text-medical-primary shadow-sm'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                  }
                `
                )}
                title={getFieldTooltip('ageGroup') || undefined}
              >
                <div class="text-2xl mb-1">👶</div>
                {t('intake.ageGroup.child')}
                {renderAiFieldBadge('ageGroup')}
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('ageGroup', 'adult')}
                class={getFieldClassName(
                  'ageGroup',
                  `
                  relative touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                  ${
                    formData.ageGroup === 'adult'
                      ? 'border-medical-primary bg-blue-50 text-medical-primary shadow-sm'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                  }
                `
                )}
                title={getFieldTooltip('ageGroup') || undefined}
              >
                <div class="text-2xl mb-1">👤</div>
                {t('intake.ageGroup.adult')}
                {renderAiFieldBadge('ageGroup')}
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
            <div className="relative">
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
                class={getFieldClassName('vitals.pulse', 'form-input')}
                title={getFieldTooltip('vitals.pulse') || undefined}
              />
              {renderAiFieldBadge('vitals.pulse')}
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
            <div className="relative">
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
                class={getFieldClassName(
                  'vitals.respiratoryRate',
                  'form-input'
                )}
                title={getFieldTooltip('vitals.respiratoryRate') || undefined}
              />
              {renderAiFieldBadge('vitals.respiratoryRate')}
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
            <div className="relative">
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.breathing')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.breathing}
                onChange={e =>
                  handleInputChange('breathing', e.currentTarget.value)
                }
                class={getFieldClassName('vitals.breathing', 'form-select')}
                title={getFieldTooltip('vitals.breathing') || undefined}
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
              {renderAiFieldBadge('vitals.breathing')}
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
            <div className="relative">
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.circulation')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.circulation}
                onChange={e =>
                  handleInputChange('circulation', e.currentTarget.value)
                }
                class={getFieldClassName('vitals.circulation', 'form-select')}
                title={getFieldTooltip('vitals.circulation') || undefined}
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
              {renderAiFieldBadge('vitals.circulation')}
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
            <div className="relative">
              <label class="block text-sm font-medium text-medical-text-primary mb-2">
                {t('intake.consciousness')}{' '}
                <span class="text-medical-error">*</span>
              </label>
              <select
                value={formData.consciousness}
                onChange={e =>
                  handleInputChange('consciousness', e.currentTarget.value)
                }
                class={getFieldClassName('vitals.consciousness', 'form-select')}
                title={getFieldTooltip('vitals.consciousness') || undefined}
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
              {renderAiFieldBadge('vitals.consciousness')}
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
            <div className="relative">
              <label class="block text-sm font-medium text-medical-text-primary mb-3">
                {t('intake.mobility')} <span class="text-medical-error">*</span>
              </label>
              <ResponsiveGrid cols={{ xs: 2 }} gap="sm">
                <button
                  type="button"
                  onClick={() => handleInputChange('mobility', 'ambulatory')}
                  class={getFieldClassName(
                    'mobility',
                    `
                    relative touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                    ${
                      formData.mobility === 'ambulatory'
                        ? 'border-medical-success bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `
                  )}
                  title={getFieldTooltip('mobility') || undefined}
                >
                  <div class="text-2xl mb-1">🚶</div>
                  {t('intake.mobility.ambulatory')}
                  {renderAiFieldBadge('mobility')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('mobility', 'non-ambulatory')
                  }
                  class={getFieldClassName(
                    'mobility',
                    `
                    relative touch-target p-4 border-2 rounded-xl text-center transition-all duration-200 font-medium
                    ${
                      formData.mobility === 'non-ambulatory'
                        ? 'border-medical-warning bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `
                  )}
                  title={getFieldTooltip('mobility') || undefined}
                >
                  <div class="text-2xl mb-1">🛏️</div>
                  {t('intake.mobility.immobile')}
                  {renderAiFieldBadge('mobility')}
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
