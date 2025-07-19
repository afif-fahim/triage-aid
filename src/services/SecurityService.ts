/**
 * Security Service for client-side encryption and patient ID generation
 * Uses Web Crypto API for secure data handling
 */

import type { PatientData } from '../types';

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  tagLength: 128, // 128 bits for GCM tag
} as const;

/**
 * Security service interface
 */
export interface ISecurityService {
  generatePatientId(): string;
  encryptPatientData(data: PatientData): Promise<string>;
  decryptPatientData(encryptedData: string): Promise<PatientData>;
  validateInput(input: any): boolean;
}

/**
 * Security service implementation using Web Crypto API
 */
export class SecurityService implements ISecurityService {
  private encryptionKey: CryptoKey | null = null;
  private readonly keyStorageKey = 'triage-encryption-key';

  constructor() {
    this.initializeEncryption();
  }

  /**
   * Initialize encryption key (create or retrieve from storage)
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Try to load existing key from localStorage
      const storedKey = localStorage.getItem(this.keyStorageKey);

      if (storedKey) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: ENCRYPTION_CONFIG.algorithm },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        await this.generateNewEncryptionKey();
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      // Fallback: generate new key
      await this.generateNewEncryptionKey();
    }
  }

  /**
   * Generate a new encryption key and store it
   */
  private async generateNewEncryptionKey(): Promise<void> {
    this.encryptionKey = await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength,
      },
      true, // extractable for storage
      ['encrypt', 'decrypt']
    );

    // Export and store the key
    const keyData = await crypto.subtle.exportKey('raw', this.encryptionKey);
    const keyBase64 = this.arrayBufferToBase64(keyData);
    localStorage.setItem(this.keyStorageKey, keyBase64);
  }

  /**
   * Get or create encryption key
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    if (!this.encryptionKey) {
      throw new Error('Failed to initialize encryption key');
    }

    return this.encryptionKey;
  }

  /**
   * Generate anonymous patient ID using UUID v4
   */
  generatePatientId(): string {
    // Use crypto.randomUUID() if available (modern browsers)
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const randomValue = crypto.getRandomValues(new Uint8Array(1))[0] || 0;
      const r = (randomValue & 15) >> (c === 'x' ? 0 : 2);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Encrypt patient data using AES-GCM
   */
  async encryptPatientData(data: PatientData): Promise<string> {
    try {
      const key = await this.getEncryptionKey();

      // Convert data to JSON string then to ArrayBuffer
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);

      // Generate random IV
      const iv = crypto.getRandomValues(
        new Uint8Array(ENCRYPTION_CONFIG.ivLength)
      );

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combinedBuffer = new Uint8Array(
        iv.length + encryptedBuffer.byteLength
      );
      combinedBuffer.set(iv, 0);
      combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combinedBuffer.buffer);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt patient data');
    }
  }

  /**
   * Decrypt patient data
   */
  async decryptPatientData(encryptedData: string): Promise<PatientData> {
    try {
      const key = await this.getEncryptionKey();

      // Convert from base64
      const combinedBuffer = this.base64ToArrayBuffer(encryptedData);

      // Extract IV and encrypted data
      const iv = combinedBuffer.slice(0, ENCRYPTION_CONFIG.ivLength);
      const encryptedBuffer = combinedBuffer.slice(ENCRYPTION_CONFIG.ivLength);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
        },
        key,
        encryptedBuffer
      );

      // Convert back to string and parse JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      const data = JSON.parse(jsonString) as PatientData;

      // Convert date strings back to Date objects
      data.timestamp = new Date(data.timestamp);
      data.lastUpdated = new Date(data.lastUpdated);

      return data;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt patient data');
    }
  }

  /**
   * Validate input data structure
   */
  validateInput(input: any): boolean {
    try {
      // Basic validation - check if input can be serialized
      JSON.stringify(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all encryption keys (for logout/reset)
   */
  async clearEncryptionKeys(): Promise<void> {
    localStorage.removeItem(this.keyStorageKey);
    this.encryptionKey = null;
  }
}

// Create singleton instance
export const securityService = new SecurityService();
