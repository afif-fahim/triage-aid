/**
 * Local AI Service
 * Manages local AI models for triage text processing and form population
 */

import { pipeline, env } from '@xenova/transformers';
import type {
  LocalAIService as ILocalAIService,
  ModelInfo,
  TriageAnalysis,
  ModelStatus,
  StoredModel,
} from '../types/VoiceRecognition';
import { modelDownloadService, type ModelDownloadOptions } from './ModelDownloadService';

// Configure Transformers.js environment
env.allowRemoteModels = true;
env.allowLocalModels = true;

class LocalAIService implements ILocalAIService {
  private modelInfo: ModelInfo | null = null;
  private modelStatus: ModelStatus = 'not-downloaded';
  private pipeline: any = null;
  private modelWorker: Worker | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if we have a stored model
      const storedModel = await this.getStoredModel();
      if (storedModel) {
        this.modelInfo = {
          name: storedModel.name,
          size: storedModel.size,
          version: storedModel.version,
          downloadDate: storedModel.downloadDate,
          language: storedModel.language,
        };
        this.modelStatus = 'ready';
      }
    } catch (error) {
      console.error('Failed to initialize LocalAIService:', error);
      this.modelStatus = 'error';
    }
  }

  private async getStoredModel(): Promise<StoredModel | null> {
    try {
      // Use ModelDownloadService to get stored model
      return await modelDownloadService.getStoredModel('LaMini-Flan-T5-248M-1.0.0');
    } catch (error) {
      console.error('Error accessing stored model:', error);
      return null;
    }
  }



  isModelAvailable(): boolean {
    return this.modelStatus === 'ready' && this.modelInfo !== null;
  }

  isLaminiModelReady(): boolean {
    return (
      this.isModelAvailable() &&
      this.modelInfo?.name === 'LaMini-Flan-T5-248M' &&
      this.pipeline !== null
    );
  }

  async downloadModel(onProgress?: (progress: number) => void): Promise<void> {
    if (this.modelStatus === 'downloading') {
      throw new Error('Model download already in progress');
    }

    this.modelStatus = 'downloading';

    try {
      // Use ModelDownloadService for downloading
      const downloadOptions: ModelDownloadOptions = {
        modelName: 'LaMini-Flan-T5-248M',
        modelUrl: this.getModelUrl(),
        version: '1.0.0',
        language: 'en',
        expectedSize: 248000000,
        resumable: true
      };

      // Convert ModelDownloadService progress to simple percentage
      const progressCallback = onProgress ? (downloadProgress: any) => {
        // Map download progress (0-90%) + pipeline initialization (90-100%)
        const percentage = Math.min(downloadProgress.percentage * 0.9, 90);
        onProgress(percentage);
      } : undefined;

      const storedModel = await modelDownloadService.downloadModel(
        downloadOptions,
        progressCallback
      );

      if (onProgress) {
        onProgress(95);
      }

      // Initialize the pipeline with the downloaded model
      console.info('Initializing Transformers.js pipeline...');
      this.pipeline = await pipeline(
        'text2text-generation',
        this.getModelUrl()
      );

      this.modelInfo = {
        name: storedModel.name,
        size: storedModel.size,
        version: storedModel.version,
        downloadDate: storedModel.downloadDate,
        language: storedModel.language,
      };

      this.modelStatus = 'ready';

      if (onProgress) {
        onProgress(100);
      }

      console.info('Model successfully loaded and ready for inference');
    } catch (error) {
      console.error('Model download/initialization failed:', error);
      this.modelStatus = 'error';
      this.pipeline = null;
      throw error;
    }
  }

  private getModelUrl(): string {
    return 'Xenova/LaMini-Flan-T5-248M';
  }



  getModelInfo(): ModelInfo | null {
    return this.modelInfo;
  }

  getModelStatus(): ModelStatus {
    return this.modelStatus;
  }

  async processTriageText(text: string): Promise<TriageAnalysis> {
    if (!this.isModelAvailable()) {
      throw new Error(
        'AI model is not available. Please download the model first.'
      );
    }

    try {
      // Try to use LaMini model first
      return await this.analyzeTextWithLamini(text);
    } catch (error) {
      console.warn(
        'LaMini model failed, falling back to rule-based analysis:',
        error
      );
      // Fallback to rule-based analysis
      return await this.analyzeTextWithRules(text);
    }
  }

  private async analyzeTextWithLamini(text: string): Promise<TriageAnalysis> {
    const storedModel = await this.getStoredModel();
    if (!storedModel) {
      throw new Error('LaMini model not found in storage');
    }

    // Create the prompt for LaMini-Flan-T5-248M
    const prompt = this.createTriagePrompt(text);

    try {
      // Use Web Workers for model inference to avoid blocking the main thread
      const result = await this.runLaminiInference(prompt, storedModel);
      const analysis = this.parseLaminiResponse(result);
      analysis.method = 'lamini';
      return analysis;
    } catch (error: unknown) {
      // Fallback to rule-based analysis and inform the user
      const ruleAnalysis = await this.analyzeTextWithRules(text);
      ruleAnalysis.method = 'rules';
      ruleAnalysis.error = `Lamini model failed: ${error?.message || error}`;
      ruleAnalysis.reasoning = `Fallback to rule-based analysis due to AI model error. ${
        ruleAnalysis.reasoning || ''
      }`;
      return ruleAnalysis;
    }
  }

  private createTriagePrompt(text: string): string {
    return `Analyze this medical triage case and extract structured information in JSON format.

Patient description: ${text}

Extract these fields if mentioned:
- ageGroup: "child" or "adult"  
- breathing: "normal", "labored", or "absent"
- circulation: "normal", "bleeding", or "shock"
- consciousness: "alert", "verbal", "pain", or "unresponsive"
- mobility: "ambulatory" or "non-ambulatory"
- pulse: number (beats per minute)
- respiratoryRate: number (breaths per minute)
- injuries: array of injury descriptions

Respond with JSON:
{
  "confidence": 0.8,
  "extractedFields": {...},
  "reasoning": "analysis explanation",
  "suggestions": ["clinical recommendations"]
}`;
  }

  private async runLaminiInference(
    prompt: string,
    _model: StoredModel
  ): Promise<string> {
    try {
      // Initialize the pipeline if not already done
      if (!this.pipeline) {
        console.info('Loading text generation model...');
        this.pipeline = await pipeline(
          'text2text-generation',
          this.getModelUrl()
        );
      }

      // Generate response using the model
      const result = await this.pipeline(prompt, {
        max_new_tokens: 512,
        temperature: 0.3,
        do_sample: true,
        top_p: 0.9,
      });

      // Extract the generated text
      const generatedText = Array.isArray(result)
        ? result[0]?.generated_text
        : result.generated_text;

      if (!generatedText) {
        throw new Error('No text generated from model');
      }

      return generatedText;
    } catch (error) {
      console.error('Transformers.js inference failed:', error);
      // Fallback to rule-based analysis and inform the user
      throw error; // Let the caller handle the fallback and user notification
    }
  }

  private parseLaminiResponse(response: string): TriageAnalysis {
    try {
      // Try to parse JSON response from LaMini
      const parsed = JSON.parse(response);

      // Validate the response structure
      if (
        !parsed.confidence ||
        !parsed.extractedFields ||
        !parsed.reasoning ||
        !parsed.suggestions
      ) {
        throw new Error('Invalid response structure from LaMini model');
      }

      return {
        confidence: Math.min(Math.max(parsed.confidence, 0), 1), // Clamp between 0-1
        extractedFields: parsed.extractedFields,
        reasoning: parsed.reasoning,
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
      };
    } catch (error) {
      console.error('Failed to parse LaMini response:', error);
      throw new Error('Invalid JSON response from LaMini model');
    }
  }

  private async analyzeTextWithRules(text: string): Promise<TriageAnalysis> {
    // Fallback rule-based analysis when LaMini model is unavailable
    // This provides basic triage field extraction using pattern matching
    const lowerText = text.toLowerCase();
    const extractedFields: TriageAnalysis['extractedFields'] = {};
    const suggestions: string[] = [];
    let confidence = 0.6; // Lower confidence for rule-based fallback

    // Age group detection
    if (
      lowerText.includes('child') ||
      lowerText.includes('kid') ||
      lowerText.includes('pediatric')
    ) {
      extractedFields.ageGroup = 'child';
      suggestions.push('Detected pediatric patient');
    } else if (lowerText.includes('adult') || lowerText.includes('grown')) {
      extractedFields.ageGroup = 'adult';
      suggestions.push('Detected adult patient');
    }

    // Breathing assessment
    if (
      lowerText.includes('not breathing') ||
      lowerText.includes('no breath')
    ) {
      extractedFields.breathing = 'absent';
      suggestions.push('Critical: No breathing detected');
      confidence = 0.9;
    } else if (
      lowerText.includes('difficulty breathing') ||
      lowerText.includes('labored')
    ) {
      extractedFields.breathing = 'labored';
      suggestions.push('Breathing difficulties noted');
    } else if (
      lowerText.includes('breathing normal') ||
      lowerText.includes('breathing fine')
    ) {
      extractedFields.breathing = 'normal';
    }

    // Consciousness level (AVPU)
    if (
      lowerText.includes('unconscious') ||
      lowerText.includes('unresponsive')
    ) {
      extractedFields.consciousness = 'unresponsive';
      suggestions.push('Critical: Patient unresponsive');
      confidence = 0.95;
    } else if (lowerText.includes('responds to pain')) {
      extractedFields.consciousness = 'pain';
    } else if (lowerText.includes('responds to voice')) {
      extractedFields.consciousness = 'verbal';
    } else if (lowerText.includes('alert') || lowerText.includes('awake')) {
      extractedFields.consciousness = 'alert';
    }

    // Circulation/bleeding
    if (lowerText.includes('bleeding') || lowerText.includes('blood')) {
      extractedFields.circulation = 'bleeding';
      suggestions.push('Bleeding detected - assess severity');
    } else if (lowerText.includes('shock') || lowerText.includes('pale')) {
      extractedFields.circulation = 'shock';
      suggestions.push('Signs of shock noted');
    }

    // Mobility
    if (lowerText.includes('walking') || lowerText.includes('ambulatory')) {
      extractedFields.mobility = 'ambulatory';
    } else if (
      lowerText.includes('cannot walk') ||
      lowerText.includes('immobile')
    ) {
      extractedFields.mobility = 'non-ambulatory';
    }

    // Extract pulse if mentioned
    const pulseMatch = lowerText.match(/pulse\s+(\d+)/);
    if (pulseMatch && pulseMatch[1]) {
      extractedFields.pulse = parseInt(pulseMatch[1], 10);
    }

    // Extract respiratory rate
    const respMatch = lowerText.match(/respiratory?\s+rate\s+(\d+)/);
    if (respMatch && respMatch[1]) {
      extractedFields.respiratoryRate = parseInt(respMatch[1], 10);
    }

    // Extract injuries
    const injuries: string[] = [];
    if (lowerText.includes('fracture')) injuries.push('Fracture');
    if (lowerText.includes('burn')) injuries.push('Burn injury');
    if (lowerText.includes('laceration') || lowerText.includes('cut'))
      injuries.push('Laceration');
    if (lowerText.includes('head injury')) injuries.push('Head injury');

    if (injuries.length > 0) {
      extractedFields.injuries = injuries;
    }

    // Generate reasoning
    const reasoning = this.generateReasoning(extractedFields, suggestions);

    return {
      confidence,
      extractedFields,
      reasoning,
      suggestions,
    };
  }

  private generateReasoning(
    fields: TriageAnalysis['extractedFields'],
    _suggestions: string[]
  ): string {
    const reasons: string[] = [];

    if (fields.consciousness === 'unresponsive') {
      reasons.push('Patient is unresponsive, indicating critical condition');
    }

    if (fields.breathing === 'absent') {
      reasons.push('No breathing detected, immediate intervention required');
    }

    if (fields.circulation === 'bleeding') {
      reasons.push('Active bleeding noted, requires hemorrhage control');
    }

    if (fields.mobility === 'ambulatory') {
      reasons.push('Patient is ambulatory, suggesting less severe injuries');
    }

    if (reasons.length === 0) {
      reasons.push('Fallback analysis using rule-based pattern matching');
    }

    return `${reasons.join('. ')}.`;
  }

  setModelPath(_path: string): void {
    // For POC, model path is not used
    // In production, this would configure the model location
  }

  async clearModel(): Promise<void> {
    try {
      // Use ModelDownloadService to delete the model
      await modelDownloadService.deleteStoredModel('LaMini-Flan-T5-248M-1.0.0');

      // Clean up the pipeline
      if (this.pipeline) {
        this.pipeline = null;
      }

      this.modelInfo = null;
      this.modelStatus = 'not-downloaded';
    } catch (error) {
      console.error('Error clearing model:', error);
      throw error;
    }
  }

  destroy(): void {
    // Cleanup any resources
    if (this.pipeline) {
      this.pipeline = null;
    }
    if (this.modelWorker) {
      this.modelWorker.terminate();
      this.modelWorker = null;
    }
    this.modelInfo = null;
    this.modelStatus = 'not-downloaded';
  }
}

// Export singleton instance
export const localAIService = new LocalAIService();
export default localAIService;
