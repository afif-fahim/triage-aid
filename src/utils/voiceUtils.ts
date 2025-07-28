/**
 * Voice Recognition Utility Functions
 * Helper functions for voice recognition functionality
 */

import type {
  VoiceError,
  VoiceStatus,
  VoiceLanguage,
} from '../types/VoiceRecognition';

/**
 * Check if voice recognition is supported in the current browser
 */
export function isVoiceRecognitionSupported(): boolean {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Get user-friendly error message for voice recognition errors
 */
export function getVoiceErrorMessage(error: VoiceError): string {
  switch (error.type) {
    case 'permission':
      return 'Microphone permission is required for voice input. Please allow microphone access and try again.';
    case 'network':
      return 'Network connection is required for voice recognition. Please check your connection and try again.';
    case 'recognition':
      return 'Voice recognition failed. Please try speaking more clearly or use manual input.';
    case 'unsupported':
      return 'Voice recognition is not supported in this browser. Please use manual input or try a different browser.';
    default:
      return 'An unknown error occurred with voice recognition. Please try again or use manual input.';
  }
}

/**
 * Get user-friendly status message for voice recognition
 */
export function getVoiceStatusMessage(status: VoiceStatus): string {
  if (!status.isSupported) {
    return 'Voice recognition is not supported in this browser';
  }

  if (!status.hasPermission) {
    return 'Microphone permission is required';
  }

  if (status.isListening) {
    return 'Listening... Speak now';
  }

  return 'Voice recognition is ready';
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: VoiceLanguage): string {
  switch (language) {
    case 'en':
      return 'English';
    case 'ar':
      return 'Arabic (Coming Soon)';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a language is currently supported
 */
export function isLanguageSupported(language: VoiceLanguage): boolean {
  // Currently only English is fully supported
  return language === 'en';
}

/**
 * Format confidence score as percentage
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Determine if confidence score is acceptable
 */
export function isConfidenceAcceptable(
  confidence: number,
  threshold = 0.7
): boolean {
  return confidence >= threshold;
}
