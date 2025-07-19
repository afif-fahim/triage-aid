/**
 * Database Service using Dexie.js for IndexedDB operations
 * Handles patient data storage with encryption support
 */

import Dexie, { type EntityTable } from 'dexie';

/**
 * Encrypted patient data structure for storage
 */
export interface EncryptedPatientRecord {
  id: string;
  encryptedData: string; // Encrypted JSON string of PatientData
  timestamp: Date;
  lastUpdated: Date;
  priority: number; // Store urgency number for sorting without decryption
  status: string; // Store status for filtering without decryption
}

/**
 * Database schema and configuration
 */
export class TriageDatabase extends Dexie {
  // Define tables
  patients!: EntityTable<EncryptedPatientRecord, 'id'>;

  constructor() {
    super('TriageAidDB');

    // Define schema
    this.version(1).stores({
      patients: 'id, timestamp, lastUpdated, priority, status',
    });

    // Add hooks for data validation
    this.patients.hook('creating', (_primKey, obj) => {
      obj.timestamp = obj.timestamp || new Date();
      obj.lastUpdated = obj.lastUpdated || new Date();
    });

    this.patients.hook('updating', modifications => {
      (modifications as any).lastUpdated = new Date();
    });
  }

  /**
   * Initialize database and handle version upgrades
   */
  async initialize(): Promise<void> {
    try {
      await this.open();
      console.info('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('Database initialization failed');
    }
  }

  /**
   * Clear all data (for testing or reset purposes)
   */
  async clearAllData(): Promise<void> {
    await this.patients.clear();
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalPatients: number;
    patientsByStatus: Record<string, number>;
    patientsByPriority: Record<number, number>;
  }> {
    const allPatients = await this.patients.toArray();

    const patientsByStatus: Record<string, number> = {};
    const patientsByPriority: Record<number, number> = {};

    allPatients.forEach(patient => {
      patientsByStatus[patient.status] =
        (patientsByStatus[patient.status] || 0) + 1;
      patientsByPriority[patient.priority] =
        (patientsByPriority[patient.priority] || 0) + 1;
    });

    return {
      totalPatients: allPatients.length,
      patientsByStatus,
      patientsByPriority,
    };
  }
}

// Create singleton instance
export const triageDB = new TriageDatabase();
