/**
 * Voice Recognition Types and Interfaces
 * Types for voice-to-text functionality and AI integration
 */

export interface VoiceError {
  type: 'permission' | 'network' | 'recognition' | 'unsupported';
  message: string;
  recoverable: boolean;
}

export interface VoiceStatus {
  isSupported: boolean;
  hasPermission: boolean;
  isListening: boolean;
  language: string;
}

export type VoiceLanguage = 'en' | 'ar';

export interface VoiceSettings {
  enabled: boolean;
  language: VoiceLanguage;
  autoPopulate: boolean;
  sensitivity: number; // 0-1
  modelPreference: 'small' | 'medium' | 'large';
  downloadOnWifi: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
}

export interface VoiceRecognitionService {
  // Core functionality
  startListening(): Promise<void>;
  stopListening(): void;
  isListening(): boolean;

  // Configuration
  setLanguage(language: VoiceLanguage): void;
  setSensitivity(level: number): void;

  // Events
  onTranscription(callback: (result: VoiceRecognitionResult) => void): void;
  onError(callback: (error: VoiceError) => void): void;
  onStatusChange(callback: (status: VoiceStatus) => void): void;

  // Cleanup
  destroy(): void;
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Web Speech API types (for browsers that support it)
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
  [index: number]: SpeechGrammar;
}

export interface SpeechGrammar {
  src: string;
  weight: number;
}

// AI Model Types
export interface ModelInfo {
  name: string;
  size: number;
  version: string;
  downloadDate: Date;
  language: VoiceLanguage;
}

export interface TriageAnalysis {
  confidence: number;
  extractedFields: {
    ageGroup?: 'child' | 'adult';
    breathing?: 'normal' | 'labored' | 'absent';
    circulation?: 'normal' | 'bleeding' | 'shock';
    consciousness?: 'alert' | 'verbal' | 'pain' | 'unresponsive';
    mobility?: 'ambulatory' | 'non-ambulatory';
    pulse?: number;
    respiratoryRate?: number;
    capillaryRefill?: number;
    radialPulse?: 'present' | 'absent';
    injuries?: string[];
    notes?: string;
  };
  reasoning: string;
  suggestions: string[];
  method?: 'lamini' | 'rules' | 'unknown';
  error?: string;
}

export interface StoredModel {
  id: string;
  name: string;
  version: string;
  language: VoiceLanguage;
  size: number;
  downloadDate: Date;
  modelData: ArrayBuffer;
  metadata: {
    accuracy: number;
    speed: number;
    memoryUsage: number;
  };
}

export type ModelStatus = 'not-downloaded' | 'downloading' | 'ready' | 'error';

export interface LocalAIService {
  // Model management
  isModelAvailable(): boolean;
  downloadModel(onProgress?: (progress: number) => void): Promise<void>;
  getModelInfo(): ModelInfo | null;
  getModelStatus(): ModelStatus;

  // AI processing
  processTriageText(text: string): Promise<TriageAnalysis>;

  // Configuration
  setModelPath(path: string): void;
  clearModel(): Promise<void>;

  // Cleanup
  destroy(): void;
}
