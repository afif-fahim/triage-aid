/**
 * Voice Triage Component
 * Provides voice-to-text functionality with transcription display and editing
 */

import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { JSX } from 'preact';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Alert } from './ui/Alert';
import { voiceRecognitionService } from '../services/VoiceRecognitionService';
import { localAIService } from '../services/LocalAIService';
import { useTranslation } from '../hooks/useTranslation';
import {
  getVoiceErrorMessage,
  getVoiceStatusMessage,
  formatConfidence,
  isConfidenceAcceptable,
} from '../utils/voiceUtils';
import type {
  VoiceError,
  VoiceStatus,
  VoiceRecognitionResult,
  VoiceLanguage,
  TriageAnalysis,
} from '../types/VoiceRecognition';

interface VoiceTriageComponentProps {
  onTextGenerated?: (text: string) => void;
  onFieldsPopulated?: (analysis: TriageAnalysis) => void;
  isEnabled?: boolean;
  language?: VoiceLanguage;
  className?: string;
}

export function VoiceTriageComponent({
  onTextGenerated,
  onFieldsPopulated,
  isEnabled = true,
  language = 'en',
  className = '',
}: VoiceTriageComponentProps) {
  const { t } = useTranslation();

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [voiceError, setVoiceError] = useState<VoiceError | null>(null);
  const [lastResult, setLastResult] = useState<VoiceRecognitionResult | null>(
    null
  );

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const finalTranscriptRef = useRef('');

  // Handle transcription results
  const handleTranscription = useCallback(
    (result: VoiceRecognitionResult) => {
      setLastResult(result);

      if (result.isFinal) {
        // Add final result to transcript
        const newFinalText = `${finalTranscriptRef.current + result.transcript} `;
        finalTranscriptRef.current = newFinalText;
        setTranscribedText(newFinalText);
        setInterimText('');

        // Notify parent component
        if (onTextGenerated) {
          onTextGenerated(newFinalText.trim());
        }
      } else {
        // Show interim result
        setInterimText(result.transcript);
      }
    },
    [onTextGenerated]
  );

  // Handle voice recognition errors
  const handleVoiceError = useCallback((error: VoiceError) => {
    setVoiceError(error);
    setIsListening(false);

    // Auto-clear recoverable errors after 5 seconds
    if (error.recoverable) {
      setTimeout(() => {
        setVoiceError(null);
      }, 5000);
    }
  }, []);

  // Handle voice status changes
  const handleStatusChange = useCallback((status: VoiceStatus) => {
    setVoiceStatus(status);
    setIsListening(status.isListening);
  }, []);

  // Initialize voice recognition service
  useEffect(() => {
    console.info(
      'VoiceTriageComponent: Initializing voice recognition service'
    );

    // Reinitialize the service to ensure it's in a clean state
    voiceRecognitionService.reinitialize();

    // Set up event listeners
    voiceRecognitionService.onTranscription(handleTranscription);
    voiceRecognitionService.onError(handleVoiceError);
    voiceRecognitionService.onStatusChange(handleStatusChange);

    // Set language
    voiceRecognitionService.setLanguage(language);

    // Get initial status
    const initialStatus = voiceRecognitionService.getStatus();
    setVoiceStatus(initialStatus);
    setIsListening(initialStatus.isListening);

    // Cleanup on unmount
    return () => {
      console.info(
        'VoiceTriageComponent: Cleaning up voice recognition service'
      );
      voiceRecognitionService.destroy();
    };
  }, [language, handleTranscription, handleVoiceError, handleStatusChange]);

  // Check if all required APIs are supported
  const checkBrowserSupport = (): boolean => {
    // Check if service is properly initialized
    if (!voiceRecognitionService.isInitialized()) {
      console.warn(
        'Voice recognition service not initialized, attempting to reinitialize...'
      );
      voiceRecognitionService.reinitialize();

      // Check again after reinitialize
      if (!voiceRecognitionService.isInitialized()) {
        setVoiceError({
          type: 'unsupported',
          message:
            'Speech recognition is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.',
          recoverable: false,
        });
        return false;
      }
    }

    // Check for Speech Recognition API
    if (!voiceStatus?.isSupported) {
      setVoiceError({
        type: 'unsupported',
        message:
          'Speech recognition is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.',
        recoverable: false,
      });
      return false;
    }

    // Check for Media Devices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError({
        type: 'unsupported',
        message:
          'Microphone access is not supported in this browser. Please use a modern browser with HTTPS.',
        recoverable: false,
      });
      return false;
    }

    return true;
  };

  // Request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error: any) {
      console.error('Microphone permission error:', error);

      let errorMessage = 'Microphone access is required for voice input.';
      let errorType: VoiceError['type'] = 'permission';
      let recoverable = true;

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage =
            "Microphone permission was denied. Please click the microphone icon in your browser's address bar and allow access, then try again.";
          recoverable = true;
          break;
        case 'NotFoundError':
          errorMessage =
            'No microphone found. Please connect a microphone and try again.';
          recoverable = true;
          break;
        case 'NotSupportedError':
          errorMessage =
            'Microphone access is not supported in this browser or requires HTTPS.';
          errorType = 'unsupported';
          recoverable = false;
          break;
        case 'NotReadableError':
          errorMessage =
            'Microphone is already in use by another application. Please close other applications using the microphone and try again.';
          recoverable = true;
          break;
        case 'OverconstrainedError':
          errorMessage =
            'Microphone constraints could not be satisfied. Please try again.';
          recoverable = true;
          break;
        default:
          errorMessage = `Microphone access failed: ${error.message || error.name}. Please try again.`;
          recoverable = true;
      }

      setVoiceError({
        type: errorType,
        message: errorMessage,
        recoverable,
      });

      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = async () => {
    // Check browser support first
    if (!checkBrowserSupport()) {
      return; // Error already set in checkBrowserSupport
    }

    try {
      if (isListening) {
        voiceRecognitionService.stopListening();
      } else {
        // Clear previous error
        setVoiceError(null);

        // Request microphone permission first
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          return; // Error already set in requestMicrophonePermission
        }

        // Show transcription area when starting
        setShowTranscription(true);

        // Start voice recognition
        await voiceRecognitionService.startListening();
      }
    } catch (error) {
      console.error('Failed to toggle voice recognition:', error);
      setVoiceError({
        type: 'recognition',
        message: 'Failed to start voice recognition. Please try again.',
        recoverable: true,
      });
    }
  };

  // Handle manual text editing
  const handleTextChange = (e: JSX.TargetedEvent<HTMLTextAreaElement>) => {
    const newText = (e.target as HTMLTextAreaElement).value;
    setTranscribedText(newText);
    finalTranscriptRef.current = newText;

    if (onTextGenerated) {
      onTextGenerated(newText);
    }
  };

  // Clear transcription
  const clearTranscription = () => {
    setTranscribedText('');
    setInterimText('');
    finalTranscriptRef.current = '';
    setShowTranscription(false);
    setVoiceError(null);

    if (onTextGenerated) {
      onTextGenerated('');
    }
  };

  // Process with AI
  const processWithAI = async () => {
    if (!transcribedText.trim()) return;

    setIsProcessing(true);

    try {
      // Use LocalAIService to process the transcribed text
      const analysis = await localAIService.processTriageText(
        transcribedText.trim()
      );

      // Call the parent component with the AI analysis
      if (onFieldsPopulated) {
        onFieldsPopulated(analysis);
      }
    } catch (error) {
      console.error('AI processing failed:', error);
      setVoiceError({
        type: 'recognition',
        message:
          'Failed to process text with AI. Please try again or fill the form manually.',
        recoverable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get recording indicator color
  const getRecordingIndicatorColor = () => {
    if (voiceError && !voiceError.recoverable) return 'bg-red-500';
    if (isListening) return 'bg-red-500 animate-pulse';
    if (voiceStatus?.isSupported) return 'bg-green-500';
    return 'bg-gray-400';
  };

  // Get voice button variant
  const getVoiceButtonVariant = () => {
    if (voiceError && !voiceError.recoverable) return 'danger';
    if (isListening) return 'danger';
    return 'primary';
  };

  // Get confidence indicator
  const renderConfidenceIndicator = () => {
    if (!lastResult || !lastResult.isFinal) return null;

    const isAcceptable = isConfidenceAcceptable(lastResult.confidence);
    const confidenceText = formatConfidence(lastResult.confidence);

    return (
      <div
        className={`text-xs ${isAcceptable ? 'text-green-600' : 'text-yellow-600'}`}
      >
        Confidence: {confidenceText}
      </div>
    );
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <Card className={`voice-triage-component ${className}`} padding="md">
      <div className="space-y-4">
        {/* Header with voice toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('voice.title', 'Voice Input')}
            </h3>

            {/* Recording indicator */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${getRecordingIndicatorColor()}`}
                aria-label={isListening ? 'Recording' : 'Not recording'}
              />
              <span className="text-sm text-gray-600">
                {voiceStatus
                  ? getVoiceStatusMessage(voiceStatus)
                  : 'Initializing...'}
              </span>
            </div>
          </div>

          {/* Voice toggle button */}
          <Button
            variant={getVoiceButtonVariant()}
            size="md"
            onClick={toggleVoiceRecognition}
            disabled={!voiceStatus?.isSupported || isRequestingPermission}
            loading={isRequestingPermission}
            aria-label={
              isRequestingPermission
                ? 'Requesting microphone permission'
                : isListening
                  ? 'Stop recording'
                  : 'Start recording'
            }
          >
            {isRequestingPermission ? (
              <>
                <svg
                  className="w-4 h-4 mr-2 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Requesting Permission...
              </>
            ) : isListening ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('voice.stop', 'Stop')}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('voice.start', 'Start Recording')}
              </>
            )}
          </Button>
        </div>

        {/* Error display */}
        {voiceError && (
          <Alert
            variant="danger"
            dismissible
            onDismiss={() => setVoiceError(null)}
          >
            <div className="space-y-2">
              <p className="font-medium">
                {t('voice.error', 'Voice Recognition Error')}
              </p>
              <p className="text-sm">{getVoiceErrorMessage(voiceError)}</p>
              {voiceError.recoverable && (
                <p className="text-xs text-gray-600">
                  {t(
                    'voice.errorAutoHide',
                    'This message will disappear automatically.'
                  )}
                </p>
              )}
            </div>
          </Alert>
        )}

        {/* Transcription display */}
        {showTranscription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="transcription"
                className="block text-sm font-medium text-gray-700"
              >
                {t('voice.transcription', 'Transcription')}
              </label>
              <div className="flex items-center space-x-2">
                {renderConfidenceIndicator()}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTranscription}
                  aria-label="Clear transcription"
                >
                  {t('voice.clear', 'Clear')}
                </Button>
              </div>
            </div>

            {/* Transcription textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="transcription"
                value={transcribedText + interimText}
                onChange={handleTextChange}
                placeholder={t(
                  'voice.placeholder',
                  'Voice transcription will appear here. You can edit the text before processing.'
                )}
                className={`
                  w-full min-h-[120px] p-3 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-medical-primary focus:border-medical-primary
                  resize-vertical font-mono text-sm
                  ${interimText ? 'bg-blue-50' : 'bg-white'}
                `}
                rows={5}
              />

              {/* Interim text indicator */}
              {interimText && (
                <div className="absolute bottom-2 right-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {t('voice.listening', 'Listening...')}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowTranscription(false)}
              >
                {t('voice.hide', 'Hide Transcription')}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={processWithAI}
                disabled={!transcribedText.trim() || isProcessing}
                loading={isProcessing}
              >
                {t('voice.processAI', 'Process with AI')}
              </Button>
            </div>
          </div>
        )}

        {/* Language indicator */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-center justify-between">
            <span>
              {t('voice.language', 'Language')}:{' '}
              {language === 'en' ? 'English' : 'Arabic (Coming Soon)'}
            </span>
            {language === 'ar' && (
              <span className="text-yellow-600">
                {t('voice.arabicSoon', 'Arabic support coming soon')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
