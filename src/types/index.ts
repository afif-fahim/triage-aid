/**
 * Main Types Export File
 * Centralized exports for all TypeScript interfaces and types
 */

// Patient Data Types
export type {
  PatientData,
  PatientDataInput,
  PatientDataUpdate,
} from './PatientData';

// Triage Priority Types
export type { TriagePriority, TriagePriorityLevel } from './TriagePriority';

export {
  TRIAGE_PRIORITIES,
  getTriagePriority,
  getAllTriagePriorities,
  compareTriagePriorities,
} from './TriagePriority';

// Application State Types
export type {
  AppState,
  AppError,
  AppAction,
  AppView,
  SupportedLanguage,
  AppTheme,
} from './AppState';

export { INITIAL_APP_STATE } from './AppState';

// Validation Types
export type {
  ValidationResult,
  ValidationError,
  ValidationRule,
} from './ValidationSchemas';

export {
  PATIENT_DATA_VALIDATION_SCHEMA,
  PatientDataValidator,
  VALIDATION_MESSAGES,
} from './ValidationSchemas';

// Voice Recognition Types
export type {
  VoiceError,
  VoiceStatus,
  VoiceLanguage,
  VoiceSettings,
  VoiceRecognitionResult,
  VoiceRecognitionService,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechRecognition,
  SpeechRecognitionConstructor,
  SpeechRecognitionResultList,
  SpeechRecognitionResult,
  SpeechRecognitionAlternative,
  SpeechGrammarList,
  SpeechGrammar,
} from './VoiceRecognition';
