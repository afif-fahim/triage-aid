/**
 * Voice Recognition Service
 * Handles speech-to-text conversion using Web Speech API
 */

import type {
  VoiceError,
  VoiceStatus,
  VoiceLanguage,
  VoiceRecognitionResult,
  VoiceRecognitionService as IVoiceRecognitionService,
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from '../types/VoiceRecognition';

export class VoiceRecognitionService implements IVoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isCurrentlyListening = false;
  private currentLanguage: VoiceLanguage = 'en';
  private sensitivity = 0.7;

  // Event callbacks
  private transcriptionCallback:
    | ((result: VoiceRecognitionResult) => void)
    | null = null;
  private errorCallback: ((error: VoiceError) => void) | null = null;
  private statusCallback: ((status: VoiceStatus) => void) | null = null;

  constructor() {
    console.info('Initializing VoiceRecognitionService...');
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    // Check for Web Speech API support
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      this.emitError({
        type: 'unsupported',
        message: 'Speech recognition is not supported in this browser',
        recoverable: false,
      });
      return;
    }

    try {
      this.recognition = new SpeechRecognitionConstructor();

      this.setupRecognitionConfig();
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      this.emitError({
        type: 'unsupported',
        message: 'Failed to initialize speech recognition',
        recoverable: false,
      });
    }
  }

  private setupRecognitionConfig(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.getLanguageCode(this.currentLanguage);
    this.recognition.maxAlternatives = 1;
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isCurrentlyListening = true;
      this.emitStatusChange();
    };

    this.recognition.onend = () => {
      this.isCurrentlyListening = false;
      this.emitStatusChange();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleRecognitionError(event);
    };

    this.recognition.onaudiostart = () => {
      // Audio capture started
    };

    this.recognition.onaudioend = () => {
      // Audio capture ended
    };

    this.recognition.onspeechstart = () => {
      // Speech detected
    };

    this.recognition.onspeechend = () => {
      // Speech ended
    };
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    if (!this.transcriptionCallback) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result) continue;

      const alternative = result[0];
      if (!alternative) continue;

      // Only process results that meet our confidence threshold
      if (alternative.confidence >= this.sensitivity) {
        const recognitionResult: VoiceRecognitionResult = {
          transcript: alternative.transcript,
          confidence: alternative.confidence,
          isFinal: result.isFinal,
          timestamp: new Date(),
        };

        this.transcriptionCallback(recognitionResult);
      }
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    let errorType: VoiceError['type'] = 'recognition';
    let recoverable = true;
    let message = event.message || `Speech recognition error: ${event.error}`;

    switch (event.error) {
      case 'not-allowed':
      case 'permission-denied':
        errorType = 'permission';
        recoverable = false;
        message =
          'Microphone permission was denied. Please allow microphone access and try again.';
        break;
      case 'network':
        errorType = 'network';
        recoverable = true;
        message =
          'Network connection is required for voice recognition. Please check your connection.';
        break;
      case 'no-speech':
        errorType = 'recognition';
        recoverable = true;
        message = 'No speech detected. Please try speaking more clearly.';
        break;
      case 'audio-capture':
        errorType = 'recognition';
        recoverable = true;
        message =
          'Audio capture failed. Please check your microphone and try again.';
        break;
      case 'service-not-allowed':
        errorType = 'permission';
        recoverable = false;
        message =
          'Speech recognition service is not allowed. Please enable it in your browser settings.';
        break;
      case 'bad-grammar':
        errorType = 'recognition';
        recoverable = true;
        message = 'Speech recognition grammar error. Please try again.';
        break;
      case 'language-not-supported':
        errorType = 'unsupported';
        recoverable = false;
        message =
          'The selected language is not supported for speech recognition.';
        break;
      default:
        errorType = 'recognition';
        recoverable = true;
        message = `Speech recognition error: ${event.error}. Please try again.`;
    }

    this.emitError({
      type: errorType,
      message,
      recoverable,
    });

    // Stop listening on non-recoverable errors
    if (!recoverable) {
      this.isCurrentlyListening = false;
      this.emitStatusChange();
    }
  }

  private getLanguageCode(language: VoiceLanguage): string {
    switch (language) {
      case 'en':
        return 'en-US';
      case 'ar':
        return 'ar-SA';
      default:
        return 'en-US';
    }
  }

  private emitError(error: VoiceError): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  private emitStatusChange(): void {
    if (this.statusCallback) {
      this.statusCallback(this.getStatus());
    }
  }

  getStatus(): VoiceStatus {
    return {
      isSupported: Boolean(this.recognition),
      hasPermission: this.checkPermission(),
      isListening: this.isCurrentlyListening,
      language: this.currentLanguage,
    };
  }

  private checkPermission(): boolean {
    // This is a simplified check - in reality, we can only know
    // permission status after attempting to start recognition
    // We'll assume permission is available if the API is supported
    // The actual permission check happens when getUserMedia is called
    return Boolean(this.recognition);
  }

  // Public API methods
  async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isCurrentlyListening) {
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.emitError({
        type: 'recognition',
        message: 'Failed to start speech recognition',
        recoverable: true,
      });
      throw error;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isCurrentlyListening) {
      this.recognition.stop();
    }
  }

  isListening(): boolean {
    return this.isCurrentlyListening;
  }

  setLanguage(language: VoiceLanguage): void {
    this.currentLanguage = language;
    if (this.recognition) {
      this.recognition.lang = this.getLanguageCode(language);
    }
  }

  setSensitivity(level: number): void {
    this.sensitivity = Math.max(0, Math.min(1, level));
  }

  onTranscription(callback: (result: VoiceRecognitionResult) => void): void {
    this.transcriptionCallback = callback;
  }

  onError(callback: (error: VoiceError) => void): void {
    this.errorCallback = callback;
  }

  onStatusChange(callback: (status: VoiceStatus) => void): void {
    this.statusCallback = callback;
  }

  destroy(): void {
    if (this.recognition) {
      this.stopListening();
      this.recognition = null;
    }

    this.transcriptionCallback = null;
    this.errorCallback = null;
    this.statusCallback = null;
    this.isCurrentlyListening = false;
  }
}

// Export singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
