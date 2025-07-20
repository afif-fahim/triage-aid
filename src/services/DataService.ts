/**
 * Data Service for managing patient data with encryption
 * Provides CRUD operations for encrypted patient records
 */

import {
  PatientData,
  PatientDataInput,
  PatientDataUpdate,
  TriagePriority,
  getTriagePriority,
} from '../types';
import { triageDB, type EncryptedPatientRecord } from './DatabaseService';
import { securityService } from './SecurityService';
import { triageEngine } from './TriageEngine';

/**
 * Data service interface
 */
export interface IDataService {
  // Patient CRUD operations
  createPatient(patientData: PatientDataInput): Promise<string>;
  getPatient(id: string): Promise<PatientData | null>;
  updatePatient(id: string, updates: PatientDataUpdate): Promise<void>;
  getAllPatients(): Promise<PatientData[]>;
  deletePatient(id: string): Promise<void>;

  // Bulk operations
  getPatientsByStatus(status: PatientData['status']): Promise<PatientData[]>;
  getPatientsByPriority(
    priority: TriagePriority['level']
  ): Promise<PatientData[]>;

  // Data management
  clearAllData(): Promise<void>;
  exportData(): Promise<string>;
  importData(
    encryptedData: string
  ): Promise<{ imported: number; errors: string[] }>;
  getStorageStats(): Promise<{
    totalPatients: number;
    storageUsed: number;
    patientsByStatus: Record<string, number>;
    patientsByPriority: Record<string, number>;
  }>;

  // Bulk operations
  bulkUpdatePatientStatus(
    patientIds: string[],
    status: PatientData['status']
  ): Promise<{ updated: number; errors: string[] }>;
  bulkDeletePatients(
    patientIds: string[]
  ): Promise<{ deleted: number; errors: string[] }>;
  bulkExportPatients(patientIds: string[]): Promise<string>;
}

/**
 * Data service implementation with encryption
 */
export class DataService implements IDataService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the data service
   */
  private async initialize(): Promise<void> {
    try {
      await triageDB.initialize();
      this.isInitialized = true;
    } catch (error) {
      console.error('DataService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Create a new patient record
   */
  async createPatient(patientData: PatientDataInput): Promise<string> {
    await this.ensureInitialized();

    try {
      // Generate unique patient ID
      const patientId = securityService.generatePatientId();

      // Create complete patient data with system fields
      const completePatientData: PatientData = {
        id: patientId,
        ...patientData,
        timestamp: new Date(),
        lastUpdated: new Date(),
        priority: getTriagePriority('green'), // Temporary default, will be calculated next
        status: 'active',
      };

      // Calculate triage priority using START algorithm
      const triageAssessment = triageEngine.assessPatient(completePatientData);
      completePatientData.priority = triageAssessment.priority;

      // Encrypt patient data
      const encryptedData =
        await securityService.encryptPatientData(completePatientData);

      // Create encrypted record for storage
      const encryptedRecord: EncryptedPatientRecord = {
        id: patientId,
        encryptedData,
        timestamp: completePatientData.timestamp,
        lastUpdated: completePatientData.lastUpdated,
        priority: completePatientData.priority.urgency,
        status: completePatientData.status,
      };

      // Store in database
      await triageDB.patients.add(encryptedRecord);

      return patientId;
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw new Error('Failed to create patient record');
    }
  }

  /**
   * Get a patient by ID
   */
  async getPatient(id: string): Promise<PatientData | null> {
    await this.ensureInitialized();

    try {
      const encryptedRecord = await triageDB.patients.get(id);

      if (!encryptedRecord) {
        return null;
      }

      // Decrypt patient data
      const patientData = await securityService.decryptPatientData(
        encryptedRecord.encryptedData
      );

      return patientData;
    } catch (error) {
      console.error('Failed to get patient:', error);
      throw new Error('Failed to retrieve patient record');
    }
  }

  /**
   * Update a patient record
   */
  async updatePatient(id: string, updates: PatientDataUpdate): Promise<void> {
    await this.ensureInitialized();

    try {
      // Get existing patient data
      const existingPatient = await this.getPatient(id);

      if (!existingPatient) {
        throw new Error('Patient not found');
      }

      // Merge updates with existing data
      const updatedPatient: PatientData = {
        ...existingPatient,
        ...updates,
        vitals: {
          ...existingPatient.vitals,
          ...updates.vitals,
        },
        lastUpdated: new Date(),
        // Preserve system fields
        id: existingPatient.id,
        timestamp: existingPatient.timestamp,
      };

      // Recalculate triage priority if vitals were updated
      if (updates.vitals || updates.mobility) {
        const newPriority = triageEngine.recalculatePriority(updatedPatient);
        updatedPatient.priority = newPriority;
      }

      // Encrypt updated data
      const encryptedData =
        await securityService.encryptPatientData(updatedPatient);

      // Update database record
      await triageDB.patients.update(id, {
        encryptedData,
        lastUpdated: updatedPatient.lastUpdated,
        priority: updatedPatient.priority.urgency,
        status: updatedPatient.status,
      });
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw new Error('Failed to update patient record');
    }
  }

  /**
   * Get all patients
   */
  async getAllPatients(): Promise<PatientData[]> {
    await this.ensureInitialized();

    try {
      const encryptedRecords = await triageDB.patients.toArray();
      // Sort by priority after retrieval
      encryptedRecords.sort((a, b) => a.priority - b.priority);

      const patients: PatientData[] = [];

      for (const record of encryptedRecords) {
        try {
          const patientData = await securityService.decryptPatientData(
            record.encryptedData
          );
          patients.push(patientData);
        } catch (error) {
          console.error(`Failed to decrypt patient ${record.id}:`, error);
          // Continue with other patients, don't fail the entire operation
        }
      }

      return patients;
    } catch (error) {
      console.error('Failed to get all patients:', error);
      throw new Error('Failed to retrieve patient records');
    }
  }

  /**
   * Delete a patient record
   */
  async deletePatient(id: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await triageDB.patients.delete(id);

      // Verify deletion by trying to retrieve the patient
      const deletedPatient = await triageDB.patients.get(id);
      if (deletedPatient) {
        throw new Error('Failed to delete patient');
      }
    } catch (error) {
      console.error('Failed to delete patient:', error);
      throw new Error('Failed to delete patient record');
    }
  }

  /**
   * Get patients by status
   */
  async getPatientsByStatus(
    status: PatientData['status']
  ): Promise<PatientData[]> {
    await this.ensureInitialized();

    try {
      const encryptedRecords = await triageDB.patients
        .where('status')
        .equals(status)
        .toArray();
      // Sort by priority after retrieval
      encryptedRecords.sort((a, b) => a.priority - b.priority);

      const patients: PatientData[] = [];

      for (const record of encryptedRecords) {
        try {
          const patientData = await securityService.decryptPatientData(
            record.encryptedData
          );
          patients.push(patientData);
        } catch (error) {
          console.error(`Failed to decrypt patient ${record.id}:`, error);
        }
      }

      return patients;
    } catch (error) {
      console.error('Failed to get patients by status:', error);
      throw new Error('Failed to retrieve patients by status');
    }
  }

  /**
   * Get patients by priority level
   */
  async getPatientsByPriority(
    priority: TriagePriority['level']
  ): Promise<PatientData[]> {
    await this.ensureInitialized();

    try {
      const priorityData = getTriagePriority(priority);
      const priorityUrgency = priorityData.urgency;

      const encryptedRecords = await triageDB.patients
        .where('priority')
        .equals(priorityUrgency)
        .toArray();
      // Sort by timestamp after retrieval
      encryptedRecords.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const patients: PatientData[] = [];

      for (const record of encryptedRecords) {
        try {
          const patientData = await securityService.decryptPatientData(
            record.encryptedData
          );
          patients.push(patientData);
        } catch (error) {
          console.error(`Failed to decrypt patient ${record.id}:`, error);
        }
      }

      return patients;
    } catch (error) {
      console.error('Failed to get patients by priority:', error);
      throw new Error('Failed to retrieve patients by priority');
    }
  }

  /**
   * Clear all patient data
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    try {
      await triageDB.clearAllData();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear patient data');
    }
  }

  /**
   * Export all patient data (encrypted)
   */
  async exportData(): Promise<string> {
    await this.ensureInitialized();

    try {
      const encryptedRecords = await triageDB.patients.toArray();

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        patients: encryptedRecords,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export patient data');
    }
  }

  /**
   * Import patient data from encrypted backup
   */
  async importData(
    encryptedData: string
  ): Promise<{ imported: number; errors: string[] }> {
    await this.ensureInitialized();

    const errors: string[] = [];
    let imported = 0;

    try {
      const importData = JSON.parse(encryptedData);

      // Validate import data structure
      if (
        !importData.version ||
        !importData.patients ||
        !Array.isArray(importData.patients)
      ) {
        throw new Error('Invalid import data format');
      }

      // Check version compatibility
      if (importData.version !== '1.0') {
        errors.push(`Unsupported data version: ${importData.version}`);
      }

      // Import each patient record
      for (const record of importData.patients) {
        try {
          // Validate record structure
          if (!record.id || !record.encryptedData) {
            errors.push(`Invalid patient record: missing required fields`);
            continue;
          }

          // Check if patient already exists
          const existingPatient = await triageDB.patients.get(record.id);
          if (existingPatient) {
            errors.push(`Patient ${record.id} already exists - skipped`);
            continue;
          }

          // Validate encrypted data by attempting to decrypt
          try {
            await securityService.decryptPatientData(record.encryptedData);
          } catch {
            errors.push(`Failed to decrypt patient ${record.id}: invalid data`);
            continue;
          }

          // Import the record
          await triageDB.patients.add({
            id: record.id,
            encryptedData: record.encryptedData,
            timestamp: new Date(record.timestamp),
            lastUpdated: new Date(record.lastUpdated),
            priority: record.priority,
            status: record.status,
          });

          imported++;
        } catch (error) {
          errors.push(
            `Failed to import patient ${record.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return { imported, errors };
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import patient data');
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalPatients: number;
    storageUsed: number;
    patientsByStatus: Record<string, number>;
    patientsByPriority: Record<string, number>;
  }> {
    await this.ensureInitialized();

    try {
      const dbStats = await triageDB.getStats();

      // Estimate storage usage (rough calculation)
      const allRecords = await triageDB.patients.toArray();
      const storageUsed = allRecords.reduce((total, record) => {
        return total + record.encryptedData.length + 200; // Add overhead estimate
      }, 0);

      return {
        totalPatients: dbStats.totalPatients,
        storageUsed,
        patientsByStatus: dbStats.patientsByStatus,
        patientsByPriority: dbStats.patientsByPriority,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw new Error('Failed to retrieve storage statistics');
    }
  }

  /**
   * Bulk update patient status
   */
  async bulkUpdatePatientStatus(
    patientIds: string[],
    status: PatientData['status']
  ): Promise<{ updated: number; errors: string[] }> {
    await this.ensureInitialized();

    const errors: string[] = [];
    let updated = 0;

    for (const patientId of patientIds) {
      try {
        await this.updatePatient(patientId, { status });
        updated++;
      } catch (error) {
        errors.push(
          `Failed to update patient ${patientId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return { updated, errors };
  }

  /**
   * Bulk delete patients
   */
  async bulkDeletePatients(
    patientIds: string[]
  ): Promise<{ deleted: number; errors: string[] }> {
    await this.ensureInitialized();

    const errors: string[] = [];
    let deleted = 0;

    for (const patientId of patientIds) {
      try {
        await this.deletePatient(patientId);
        deleted++;
      } catch (error) {
        errors.push(
          `Failed to delete patient ${patientId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return { deleted, errors };
  }

  /**
   * Bulk export specific patients (encrypted)
   */
  async bulkExportPatients(patientIds: string[]): Promise<string> {
    await this.ensureInitialized();

    try {
      const encryptedRecords = await triageDB.patients
        .where('id')
        .anyOf(patientIds)
        .toArray();

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        patients: encryptedRecords,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to bulk export patients:', error);
      throw new Error('Failed to export selected patients');
    }
  }
}

// Create singleton instance
export const dataService = new DataService();
