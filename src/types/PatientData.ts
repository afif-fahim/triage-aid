/**
 * Patient Data Interface
 * Defines the structure for patient information used in triage assessment
 * Based on START Triage protocol requirements
 */

import type { TriagePriority } from './TriagePriority';

export interface PatientData {
  // Unique identifier (UUID v4)
  id: string;

  // Basic demographics (minimal for privacy)
  ageGroup: 'child' | 'adult';

  // Vital signs for triage assessment
  vitals: {
    pulse: number | null; // beats per minute
    breathing: 'normal' | 'labored' | 'absent';
    circulation: 'normal' | 'bleeding' | 'shock';
    consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive'; // AVPU scale
    respiratoryRate?: number | null; // breaths per minute
    capillaryRefill?: number | null; // seconds
    radialPulse?: 'present' | 'absent';
  };

  // Mobility assessment for START algorithm
  mobility?: 'ambulatory' | 'non-ambulatory';

  // Injury assessment
  injuries: string[]; // Array of injury descriptions

  // System metadata
  timestamp: Date; // When patient was first assessed
  lastUpdated: Date; // When record was last modified
  priority: TriagePriority; // Calculated triage priority
  status: 'active' | 'treated' | 'transferred' | 'discharged';

  // Optional notes (encrypted)
  notes?: string;
}

/**
 * Input data for creating a new patient record
 * Omits system-generated fields like id, timestamp, priority
 */
export interface PatientDataInput {
  ageGroup: 'child' | 'adult';
  vitals: {
    pulse: number | null;
    breathing: 'normal' | 'labored' | 'absent';
    circulation: 'normal' | 'bleeding' | 'shock';
    consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive';
    respiratoryRate?: number | null;
    capillaryRefill?: number | null;
    radialPulse?: 'present' | 'absent';
  };
  mobility?: 'ambulatory' | 'non-ambulatory';
  injuries: string[];
  notes?: string;
}

/**
 * Partial update interface for patient data
 */
export interface PatientDataUpdate {
  ageGroup?: 'child' | 'adult';
  vitals?: Partial<PatientData['vitals']>;
  mobility?: 'ambulatory' | 'non-ambulatory';
  injuries?: string[];
  status?: 'active' | 'treated' | 'transferred' | 'discharged';
  notes?: string;
}
