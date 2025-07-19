/**
 * Validation Schemas for Patient Data
 * Defines validation rules and error messages for patient data input
 */

import type { PatientDataInput, PatientData } from './PatientData';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Field validation rule interface
 */
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  message: string;
}

/**
 * Validation schema for patient data input
 */
export const PATIENT_DATA_VALIDATION_SCHEMA: Record<string, ValidationRule> = {
  ageGroup: {
    required: true,
    message: 'Age group is required',
  },
  'vitals.breathing': {
    required: true,
    message: 'Breathing status is required',
  },
  'vitals.circulation': {
    required: true,
    message: 'Circulation status is required',
  },
  'vitals.consciousness': {
    required: true,
    message: 'Consciousness level is required',
  },
  'vitals.pulse': {
    min: 0,
    max: 300,
    message: 'Pulse must be between 0 and 300 BPM',
  },
  'vitals.respiratoryRate': {
    min: 0,
    max: 100,
    message: 'Respiratory rate must be between 0 and 100 breaths per minute',
  },
  'vitals.capillaryRefill': {
    min: 0,
    max: 10,
    message: 'Capillary refill must be between 0 and 10 seconds',
  },
};

/**
 * Validation functions
 */
export class PatientDataValidator {
  /**
   * Validate patient data input
   */
  static validatePatientInput(data: PatientDataInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate age group
    if (!data.ageGroup) {
      errors.push({
        field: 'ageGroup',
        message: 'Age group is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate vitals
    if (!data.vitals.breathing) {
      errors.push({
        field: 'vitals.breathing',
        message: 'Breathing status is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.vitals.circulation) {
      errors.push({
        field: 'vitals.circulation',
        message: 'Circulation status is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.vitals.consciousness) {
      errors.push({
        field: 'vitals.consciousness',
        message: 'Consciousness level is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Validate pulse if provided
    if (data.vitals.pulse !== null && data.vitals.pulse !== undefined) {
      if (data.vitals.pulse < 0 || data.vitals.pulse > 300) {
        errors.push({
          field: 'vitals.pulse',
          message: 'Pulse must be between 0 and 300 BPM',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate respiratory rate if provided
    if (
      data.vitals.respiratoryRate !== null &&
      data.vitals.respiratoryRate !== undefined
    ) {
      if (
        data.vitals.respiratoryRate < 0 ||
        data.vitals.respiratoryRate > 100
      ) {
        errors.push({
          field: 'vitals.respiratoryRate',
          message:
            'Respiratory rate must be between 0 and 100 breaths per minute',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate capillary refill if provided
    if (
      data.vitals.capillaryRefill !== null &&
      data.vitals.capillaryRefill !== undefined
    ) {
      if (data.vitals.capillaryRefill < 0 || data.vitals.capillaryRefill > 10) {
        errors.push({
          field: 'vitals.capillaryRefill',
          message: 'Capillary refill must be between 0 and 10 seconds',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate injuries array
    if (!Array.isArray(data.injuries)) {
      errors.push({
        field: 'injuries',
        message: 'Injuries must be an array',
        code: 'INVALID_TYPE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate patient data update
   */
  static validatePatientUpdate(data: Partial<PatientData>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate pulse if provided
    if (data.vitals?.pulse !== null && data.vitals?.pulse !== undefined) {
      if (data.vitals.pulse < 0 || data.vitals.pulse > 300) {
        errors.push({
          field: 'vitals.pulse',
          message: 'Pulse must be between 0 and 300 BPM',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate respiratory rate if provided
    if (
      data.vitals?.respiratoryRate !== null &&
      data.vitals?.respiratoryRate !== undefined
    ) {
      if (
        data.vitals.respiratoryRate < 0 ||
        data.vitals.respiratoryRate > 100
      ) {
        errors.push({
          field: 'vitals.respiratoryRate',
          message:
            'Respiratory rate must be between 0 and 100 breaths per minute',
          code: 'INVALID_RANGE',
        });
      }
    }

    // Validate capillary refill if provided
    if (
      data.vitals?.capillaryRefill !== null &&
      data.vitals?.capillaryRefill !== undefined
    ) {
      if (data.vitals.capillaryRefill < 0 || data.vitals.capillaryRefill > 10) {
        errors.push({
          field: 'vitals.capillaryRefill',
          message: 'Capillary refill must be between 0 and 10 seconds',
          code: 'INVALID_RANGE',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate individual field
   */
  static validateField(fieldName: string, value: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const rule = PATIENT_DATA_VALIDATION_SCHEMA[fieldName];

    if (!rule) {
      return { isValid: true, errors: [] };
    }

    // Check required
    if (
      rule.required &&
      (value === null || value === undefined || value === '')
    ) {
      errors.push({
        field: fieldName,
        message: rule.message,
        code: 'REQUIRED_FIELD',
      });
    }

    // Check range for numbers
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldName,
          message: rule.message,
          code: 'INVALID_RANGE',
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldName,
          message: rule.message,
          code: 'INVALID_RANGE',
        });
      }
    }

    // Check pattern
    if (
      rule.pattern &&
      typeof value === 'string' &&
      !rule.pattern.test(value)
    ) {
      errors.push({
        field: fieldName,
        message: rule.message,
        code: 'INVALID_PATTERN',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Error message constants
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_RANGE: 'Value is outside the valid range',
  INVALID_PATTERN: 'Value does not match the required pattern',
  INVALID_TYPE: 'Value is not of the correct type',
} as const;
