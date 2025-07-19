/**
 * Data Service for managing patient data with encryption
 * Provides CRUD operations for encrypted patient records
 */

import {
  PatientData,
  PatientDataInput,
  PatientDataUpdate,
  TriagePriority,
  TRIAGE_PRIORITIES,
} from '../types';
import { triageDB, type EncryptedPatientRecord } from './DatabaseService';
import { securityService } from './SecurityService';

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
  getStorageStats(): Promise<{
    totalPatients: number;
    storageUsed: number;
    patientsByStatus: Record<string, number>;
    patientsByPriority: Record<string, number>;
  }>;
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
        priority: TRIAGE_PRIORITIES.green!, // Default priority, will be calculated by triage engine
        status: 'active',
      };

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

      // If vitals were updated, priority might need recalculation
      // This will be handled by the triage engine in a separate service

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
      const priorityData = TRIAGE_PRIORITIES[priority];
      if (!priorityData) {
        throw new Error(`Invalid priority level: ${priority}`);
      }
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
}

// Create singleton instance
export const dataService = new DataService();
