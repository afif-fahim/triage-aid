/**
 * Voice Settings Service
 * Manages voice AI preferences, model downloads, and configuration
 */

import type {
  VoiceSettings,
  ModelInfo,
  ModelStatus,
} from '../types/VoiceRecognition';
import { localAIService } from './LocalAIService';
import { voiceRecognitionService } from './VoiceRecognitionService';

export interface VoiceSettingsService {
  // Settings management
  getSettings(): VoiceSettings;
  updateSettings(settings: Partial<VoiceSettings>): Promise<void>;
  resetSettings(): Promise<void>;

  // Model management
  getModelInfo(): ModelInfo | null;
  getModelStatus(): ModelStatus;
  downloadModel(onProgress?: (progress: number) => void): Promise<void>;
  deleteModel(): Promise<void>;

  // Storage management
  getStorageUsage(): Promise<{ used: number; available: number }>;

  // Event handling
  onSettingsChange(callback: (settings: VoiceSettings) => void): () => void;
  onModelStatusChange(callback: (status: ModelStatus) => void): () => void;
}

class VoiceSettingsServiceImpl implements VoiceSettingsService {
  private settings: VoiceSettings;
  private settingsListeners: Array<(settings: VoiceSettings) => void> = [];
  private modelStatusListeners: Array<(status: ModelStatus) => void> = [];
  private readonly STORAGE_KEY = 'triageaid-voice-settings';

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): VoiceSettings {
    return {
      enabled: false,
      language: 'en',
      autoPopulate: true,
      sensitivity: 0.7,
      modelPreference: 'small',
      downloadOnWifi: true,
    };
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load voice settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<VoiceSettings>): Promise<void> {
    const previousSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // Apply settings to services
    try {
      // Update voice recognition service
      if (
        newSettings.language &&
        newSettings.language !== previousSettings.language
      ) {
        voiceRecognitionService.setLanguage(newSettings.language);
      }

      if (
        newSettings.sensitivity !== undefined &&
        newSettings.sensitivity !== previousSettings.sensitivity
      ) {
        voiceRecognitionService.setSensitivity(newSettings.sensitivity);
      }

      // Save settings
      this.saveSettings();

      // Notify listeners
      this.notifySettingsListeners();
    } catch (error) {
      // Revert settings on error
      this.settings = previousSettings;
      throw new Error(
        `Failed to update voice settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async resetSettings(): Promise<void> {
    this.settings = this.getDefaultSettings();
    this.saveSettings();

    // Reset services to default state
    voiceRecognitionService.setLanguage(this.settings.language);
    voiceRecognitionService.setSensitivity(this.settings.sensitivity);

    this.notifySettingsListeners();
  }

  getModelInfo(): ModelInfo | null {
    return localAIService.getModelInfo();
  }

  getModelStatus(): ModelStatus {
    return localAIService.getModelStatus();
  }

  async downloadModel(onProgress?: (progress: number) => void): Promise<void> {
    try {
      await localAIService.downloadModel(onProgress);
      this.notifyModelStatusListeners();
    } catch (error) {
      this.notifyModelStatusListeners();
      throw error;
    }
  }

  async deleteModel(): Promise<void> {
    try {
      await localAIService.clearModel();
      this.notifyModelStatusListeners();
    } catch (error) {
      this.notifyModelStatusListeners();
      throw error;
    }
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      // Estimate storage usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
        };
      }

      // Fallback estimation
      return {
        used: 0,
        available: 1024 * 1024 * 1024, // 1GB fallback
      };
    } catch (error) {
      console.warn('Failed to get storage usage:', error);
      return {
        used: 0,
        available: 1024 * 1024 * 1024, // 1GB fallback
      };
    }
  }

  onSettingsChange(callback: (settings: VoiceSettings) => void): () => void {
    this.settingsListeners.push(callback);

    return () => {
      const index = this.settingsListeners.indexOf(callback);
      if (index > -1) {
        this.settingsListeners.splice(index, 1);
      }
    };
  }

  onModelStatusChange(callback: (status: ModelStatus) => void): () => void {
    this.modelStatusListeners.push(callback);

    return () => {
      const index = this.modelStatusListeners.indexOf(callback);
      if (index > -1) {
        this.modelStatusListeners.splice(index, 1);
      }
    };
  }

  private notifySettingsListeners(): void {
    this.settingsListeners.forEach(callback => {
      try {
        callback(this.getSettings());
      } catch (error) {
        console.error('Error in settings change listener:', error);
      }
    });
  }

  private notifyModelStatusListeners(): void {
    const status = this.getModelStatus();
    this.modelStatusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in model status change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const voiceSettingsService = new VoiceSettingsServiceImpl();
