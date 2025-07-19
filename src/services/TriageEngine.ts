/**
 * START Triage Algorithm Engine
 * Implements the Simple Triage and Rapid Treatment (START) protocol
 * for systematic patient assessment and priority assignment
 */

import type { PatientData } from '../types/PatientData';
import { TriagePriority, getTriagePriority } from '../types/TriagePriority';

/**
 * Triage assessment result interface
 */
export interface TriageAssessment {
  priority: TriagePriority;
  reasoning: string;
  assessmentPath: string[];
}

/**
 * Triage rule interface for decision tree
 */
export interface TriageRule {
  condition: (patient: PatientData) => boolean;
  priority: TriagePriority;
  reasoning: string;
  step: string;
}

/**
 * START Triage Engine Interface
 */
export interface ITriageEngine {
  assessPatient(patientData: PatientData): TriageAssessment;
  canWalk(patientData: PatientData): boolean;
  hasRespiratoryDistress(patientData: PatientData): boolean;
  hasCirculatoryCompromise(patientData: PatientData): boolean;
  canFollowSimpleCommands(patientData: PatientData): boolean;
  recalculatePriority(patientData: PatientData): TriagePriority;
}

/**
 * START Triage Engine Implementation
 *
 * The START algorithm follows this decision tree:
 * 1. Can the patient walk? → Green (Minor)
 * 2. Is breathing absent/inadequate? → Red (Immediate) or Black (Deceased)
 * 3. Respiratory rate > 30? → Red (Immediate)
 * 4. Poor perfusion/circulation? → Red (Immediate)
 * 5. Cannot follow simple commands? → Red (Immediate)
 * 6. Otherwise → Yellow (Delayed)
 */
export class TriageEngine implements ITriageEngine {
  /**
   * Assess patient using START triage algorithm
   */
  assessPatient(patientData: PatientData): TriageAssessment {
    const assessmentPath: string[] = [];

    try {
      // Step 1: Walking wounded assessment
      if (this.canWalk(patientData)) {
        assessmentPath.push('Patient can walk and follow commands');
        return {
          priority: getTriagePriority('green'),
          reasoning:
            'Patient is ambulatory and alert - minor injuries that can wait for treatment',
          assessmentPath,
        };
      }
      assessmentPath.push('Patient cannot walk - continuing assessment');

      // Step 2: Breathing assessment
      if (patientData.vitals.breathing === 'absent') {
        assessmentPath.push('Breathing is absent');
        // In real triage, airway positioning would be attempted
        // For app purposes, we assume basic airway management
        return {
          priority: getTriagePriority('black'),
          reasoning: 'No spontaneous breathing - deceased or expectant care',
          assessmentPath,
        };
      }

      // Check for respiratory distress
      if (this.hasRespiratoryDistress(patientData)) {
        assessmentPath.push('Respiratory distress detected');
        return {
          priority: getTriagePriority('red'),
          reasoning:
            'Respiratory distress or rate >30/min - immediate intervention required',
          assessmentPath,
        };
      }
      assessmentPath.push('Breathing adequate - continuing assessment');

      // Step 3: Circulation/Perfusion assessment
      if (this.hasCirculatoryCompromise(patientData)) {
        assessmentPath.push('Circulatory compromise detected');
        return {
          priority: getTriagePriority('red'),
          reasoning:
            'Poor circulation or perfusion - immediate intervention required',
          assessmentPath,
        };
      }
      assessmentPath.push('Circulation adequate - continuing assessment');

      // Step 4: Mental status assessment
      if (!this.canFollowSimpleCommands(patientData)) {
        assessmentPath.push('Cannot follow simple commands');
        return {
          priority: getTriagePriority('red'),
          reasoning: 'Altered mental status - immediate intervention required',
          assessmentPath,
        };
      }
      assessmentPath.push('Mental status adequate');

      // Step 5: Default to delayed care
      assessmentPath.push('All vital signs stable - delayed care appropriate');
      return {
        priority: getTriagePriority('yellow'),
        reasoning:
          'Stable vitals but non-ambulatory - delayed care within hours',
        assessmentPath,
      };
    } catch (error) {
      console.error('Triage assessment error:', error);
      // Default to immediate care if assessment fails
      return {
        priority: getTriagePriority('red'),
        reasoning: 'Assessment error - defaulting to immediate care for safety',
        assessmentPath: [
          ...assessmentPath,
          'Error in assessment - safety default',
        ],
      };
    }
  }

  /**
   * Determine if patient can walk (ambulatory assessment)
   * Part of the initial walking wounded sort
   */
  canWalk(patientData: PatientData): boolean {
    // Patient must be both ambulatory AND alert to be classified as walking wounded
    const isAmbulatory = patientData.mobility === 'ambulatory';
    const isAlert = patientData.vitals.consciousness === 'alert';

    return isAmbulatory && isAlert;
  }

  /**
   * Assess for respiratory distress
   * Checks breathing quality and respiratory rate
   */
  hasRespiratoryDistress(patientData: PatientData): boolean {
    const { breathing, respiratoryRate } = patientData.vitals;

    // Labored breathing indicates distress
    if (breathing === 'labored') {
      return true;
    }

    // Respiratory rate > 30 indicates distress (START protocol threshold)
    if (
      respiratoryRate !== null &&
      respiratoryRate !== undefined &&
      respiratoryRate > 30
    ) {
      return true;
    }

    // Absent breathing is handled separately in main assessment
    return false;
  }

  /**
   * Assess for circulatory compromise
   * Checks circulation status, pulse, and perfusion indicators
   */
  hasCirculatoryCompromise(patientData: PatientData): boolean {
    const { circulation, pulse, capillaryRefill, radialPulse } =
      patientData.vitals;

    // Direct circulation problems
    if (circulation === 'bleeding' || circulation === 'shock') {
      return true;
    }

    // Absent radial pulse indicates poor perfusion
    if (radialPulse === 'absent') {
      return true;
    }

    // Capillary refill > 2 seconds indicates poor perfusion
    if (
      capillaryRefill !== null &&
      capillaryRefill !== undefined &&
      capillaryRefill > 2
    ) {
      return true;
    }

    // Extreme pulse rates can indicate circulatory compromise
    if (pulse !== null) {
      // Bradycardia or severe tachycardia
      if (pulse < 50 || pulse > 120) {
        return true;
      }
    }

    return false;
  }

  /**
   * Assess ability to follow simple commands
   * Tests mental status using AVPU scale
   */
  canFollowSimpleCommands(patientData: PatientData): boolean {
    const { consciousness } = patientData.vitals;

    // Alert patients can follow commands
    if (consciousness === 'alert') {
      return true;
    }

    // Patients responding to verbal stimuli can usually follow simple commands
    if (consciousness === 'verbal') {
      return true;
    }

    // Patients only responding to pain or unresponsive cannot follow commands
    return false;
  }

  /**
   * Recalculate triage priority for existing patient
   * Used when patient data is updated
   */
  recalculatePriority(patientData: PatientData): TriagePriority {
    const assessment = this.assessPatient(patientData);
    return assessment.priority;
  }

  /**
   * Get detailed triage rules for educational/audit purposes
   */
  getTriageRules(): TriageRule[] {
    return [
      {
        condition: patient => this.canWalk(patient),
        priority: getTriagePriority('green'),
        reasoning: 'Ambulatory and alert - minor injuries',
        step: 'Walking wounded assessment',
      },
      {
        condition: patient => patient.vitals.breathing === 'absent',
        priority: getTriagePriority('black'),
        reasoning: 'No spontaneous breathing',
        step: 'Breathing assessment',
      },
      {
        condition: patient => this.hasRespiratoryDistress(patient),
        priority: getTriagePriority('red'),
        reasoning: 'Respiratory distress or rate >30/min',
        step: 'Respiratory assessment',
      },
      {
        condition: patient => this.hasCirculatoryCompromise(patient),
        priority: getTriagePriority('red'),
        reasoning: 'Poor circulation or perfusion',
        step: 'Circulation assessment',
      },
      {
        condition: patient => !this.canFollowSimpleCommands(patient),
        priority: getTriagePriority('red'),
        reasoning: 'Altered mental status',
        step: 'Mental status assessment',
      },
    ];
  }

  /**
   * Validate patient data for triage assessment
   * Ensures required fields are present for accurate triage
   */
  validatePatientData(patientData: PatientData): {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Check required fields for basic triage
    if (!patientData.vitals.breathing) {
      missingFields.push('breathing status');
    }

    if (!patientData.vitals.consciousness) {
      missingFields.push('consciousness level');
    }

    if (!patientData.vitals.circulation) {
      missingFields.push('circulation status');
    }

    // Check optional but important fields
    if (patientData.vitals.pulse === null) {
      warnings.push('pulse rate not recorded');
    }

    if (patientData.vitals.respiratoryRate === null) {
      warnings.push('respiratory rate not recorded');
    }

    if (!patientData.mobility) {
      warnings.push('mobility status not assessed');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }
}

// Create singleton instance
export const triageEngine = new TriageEngine();
