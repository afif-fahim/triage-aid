/**
 * Form Population Service
 * Handles populating PatientIntakeForm fields from AI analysis with user review capabilities
 */

import type { TriageAnalysis } from '../types/VoiceRecognition';
import type { PatientDataInput } from '../types/PatientData';

export interface PopulatedField {
  fieldName: string;
  value: any;
  confidence: number;
  source: 'ai' | 'user';
  timestamp: Date;
  originalValue?: any;
}

export interface FormPopulationResult {
  populatedFields: PopulatedField[];
  formData: Partial<PatientDataInput>;
  confidence: number;
  suggestions: string[];
  warnings: string[];
}

export interface FormPopulationOptions {
  overwriteExisting?: boolean;
  minimumConfidence?: number;
  preserveUserEdits?: boolean;
}

class FormPopulationService {
  private populatedFields: Map<string, PopulatedField> = new Map();
  private userModifications: Set<string> = new Set();

  /**
   * Populate form fields from AI analysis
   */
  populateFromAI(
    analysis: TriageAnalysis,
    currentFormData: any = {},
    options: FormPopulationOptions = {}
  ): FormPopulationResult {
    const {
      overwriteExisting = false,
      minimumConfidence = 0.3,
      preserveUserEdits = true,
    } = options;

    const populatedFields: PopulatedField[] = [];
    const formData: Partial<PatientDataInput> = { ...currentFormData };
    const warnings: string[] = [];
    const suggestions = [...analysis.suggestions];

    // Skip population if confidence is too low
    if (analysis.confidence < minimumConfidence) {
      warnings.push(
        `AI confidence (${(analysis.confidence * 100).toFixed(1)}%) is below minimum threshold. Manual review recommended.`
      );
      return {
        populatedFields,
        formData,
        confidence: analysis.confidence,
        suggestions,
        warnings,
      };
    }

    // Populate age group
    if (analysis.extractedFields.ageGroup) {
      const fieldName = 'ageGroup';
      if (
        this.shouldPopulateField(
          fieldName,
          currentFormData,
          overwriteExisting,
          preserveUserEdits
        )
      ) {
        const populatedField = this.createPopulatedField(
          fieldName,
          analysis.extractedFields.ageGroup,
          analysis.confidence
        );
        populatedFields.push(populatedField);
        this.populatedFields.set(fieldName, populatedField);
        formData.ageGroup = analysis.extractedFields.ageGroup;
      }
    }

    // Initialize vitals object if it doesn't exist
    if (!formData.vitals) {
      formData.vitals = {
        pulse: null,
        breathing: '' as any,
        circulation: '' as any,
        consciousness: '' as any,
      };
    }

    // Populate vital signs
    const vitalFields = [
      { aiField: 'breathing', formField: 'breathing' },
      { aiField: 'circulation', formField: 'circulation' },
      { aiField: 'consciousness', formField: 'consciousness' },
      { aiField: 'pulse', formField: 'pulse' },
      { aiField: 'respiratoryRate', formField: 'respiratoryRate' },
      { aiField: 'capillaryRefill', formField: 'capillaryRefill' },
      { aiField: 'radialPulse', formField: 'radialPulse' },
    ];

    vitalFields.forEach(({ aiField, formField }) => {
      const aiValue =
        analysis.extractedFields[
          aiField as keyof typeof analysis.extractedFields
        ];
      if (aiValue !== undefined && aiValue !== null) {
        const fullFieldName = `vitals.${formField}`;
        if (
          this.shouldPopulateField(
            fullFieldName,
            currentFormData,
            overwriteExisting,
            preserveUserEdits
          )
        ) {
          const populatedField = this.createPopulatedField(
            fullFieldName,
            aiValue,
            analysis.confidence
          );
          populatedFields.push(populatedField);
          this.populatedFields.set(fullFieldName, populatedField);
          (formData.vitals as any)[formField] = aiValue;
        }
      }
    });

    // Populate mobility
    if (analysis.extractedFields.mobility) {
      const fieldName = 'mobility';
      if (
        this.shouldPopulateField(
          fieldName,
          currentFormData,
          overwriteExisting,
          preserveUserEdits
        )
      ) {
        const populatedField = this.createPopulatedField(
          fieldName,
          analysis.extractedFields.mobility,
          analysis.confidence
        );
        populatedFields.push(populatedField);
        this.populatedFields.set(fieldName, populatedField);
        formData.mobility = analysis.extractedFields.mobility;
      }
    }

    // Populate injuries
    if (
      analysis.extractedFields.injuries &&
      analysis.extractedFields.injuries.length > 0
    ) {
      const fieldName = 'injuries';
      if (
        this.shouldPopulateField(
          fieldName,
          currentFormData,
          overwriteExisting,
          preserveUserEdits
        )
      ) {
        const injuriesString = analysis.extractedFields.injuries.join(', ');
        const populatedField = this.createPopulatedField(
          fieldName,
          injuriesString,
          analysis.confidence
        );
        populatedFields.push(populatedField);
        this.populatedFields.set(fieldName, populatedField);
        formData.injuries = analysis.extractedFields.injuries;
      }
    }

    // Populate notes
    if (analysis.extractedFields.notes) {
      const fieldName = 'notes';
      if (
        this.shouldPopulateField(
          fieldName,
          currentFormData,
          overwriteExisting,
          preserveUserEdits
        )
      ) {
        const populatedField = this.createPopulatedField(
          fieldName,
          analysis.extractedFields.notes,
          analysis.confidence
        );
        populatedFields.push(populatedField);
        this.populatedFields.set(fieldName, populatedField);
        formData.notes = analysis.extractedFields.notes;
      }
    }

    // Add warnings for low confidence fields
    populatedFields.forEach(field => {
      if (field.confidence < 0.6) {
        warnings.push(
          `Low confidence for ${field.fieldName} (${(field.confidence * 100).toFixed(1)}%) - please verify`
        );
      }
    });

    // Add suggestions based on populated fields
    if (populatedFields.length > 0) {
      suggestions.unshift(
        `AI populated ${populatedFields.length} field(s). Please review all auto-populated values before saving.`
      );
    }

    return {
      populatedFields,
      formData,
      confidence: analysis.confidence,
      suggestions,
      warnings,
    };
  }

  /**
   * Mark a field as user-modified
   */
  markFieldAsUserModified(fieldName: string, newValue: any): void {
    this.userModifications.add(fieldName);

    // Update the populated field record if it exists
    const populatedField = this.populatedFields.get(fieldName);
    if (populatedField) {
      populatedField.originalValue = populatedField.value;
      populatedField.value = newValue;
      populatedField.source = 'user';
      populatedField.timestamp = new Date();
    }
  }

  /**
   * Check if a field was auto-populated by AI
   */
  isFieldAutoPopulated(fieldName: string): boolean {
    const field = this.populatedFields.get(fieldName);
    return field !== undefined && field.source === 'ai';
  }

  /**
   * Check if a field was modified by the user after AI population
   */
  isFieldUserModified(fieldName: string): boolean {
    return this.userModifications.has(fieldName);
  }

  /**
   * Get populated field information
   */
  getPopulatedFieldInfo(fieldName: string): PopulatedField | null {
    return this.populatedFields.get(fieldName) || null;
  }

  /**
   * Get all populated fields
   */
  getAllPopulatedFields(): PopulatedField[] {
    return Array.from(this.populatedFields.values());
  }

  /**
   * Clear all population data
   */
  clearPopulationData(): void {
    this.populatedFields.clear();
    this.userModifications.clear();
  }

  /**
   * Get visual indicator class for a field
   */
  getFieldIndicatorClass(fieldName: string): string {
    const field = this.populatedFields.get(fieldName);
    if (!field) return '';

    if (this.userModifications.has(fieldName)) {
      return 'field-user-modified';
    }

    if (field.confidence >= 0.8) {
      return 'field-ai-high-confidence';
    } else if (field.confidence >= 0.6) {
      return 'field-ai-medium-confidence';
    } else {
      return 'field-ai-low-confidence';
    }
  }

  /**
   * Get field status for UI display
   */
  getFieldStatus(fieldName: string): {
    isAutoPopulated: boolean;
    isUserModified: boolean;
    confidence?: number;
    source: 'ai' | 'user' | 'manual';
  } {
    const field = this.populatedFields.get(fieldName);
    const isUserModified = this.userModifications.has(fieldName);

    if (!field) {
      return {
        isAutoPopulated: false,
        isUserModified: false,
        source: 'manual',
      };
    }

    return {
      isAutoPopulated: true,
      isUserModified,
      confidence: field.confidence,
      source: isUserModified ? 'user' : 'ai',
    };
  }

  /**
   * Generate field tooltip text
   */
  getFieldTooltip(fieldName: string): string | null {
    const field = this.populatedFields.get(fieldName);
    if (!field) return null;

    const isModified = this.userModifications.has(fieldName);
    const confidencePercent = (field.confidence * 100).toFixed(1);

    if (isModified) {
      return `Originally AI-populated (${confidencePercent}% confidence), then modified by user`;
    }

    return `AI-populated with ${confidencePercent}% confidence. Click to modify.`;
  }

  private shouldPopulateField(
    fieldName: string,
    currentFormData: any,
    overwriteExisting: boolean,
    preserveUserEdits: boolean
  ): boolean {
    // Don't overwrite user modifications unless explicitly allowed
    if (preserveUserEdits && this.userModifications.has(fieldName)) {
      return false;
    }

    // Check if field already has a value
    const currentValue = this.getNestedValue(currentFormData, fieldName);
    if (
      currentValue !== undefined &&
      currentValue !== null &&
      currentValue !== ''
    ) {
      return overwriteExisting;
    }

    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private createPopulatedField(
    fieldName: string,
    value: unknown,
    confidence: number
  ): PopulatedField {
    return {
      fieldName,
      value,
      confidence,
      source: 'ai',
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const formPopulationService = new FormPopulationService();
export default formPopulationService;
