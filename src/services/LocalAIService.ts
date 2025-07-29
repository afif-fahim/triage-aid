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
import {
  modelDownloadService,
  type ModelDownloadOptions,
} from './ModelDownloadService';

// Configure Transformers.js environment
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;

// Model configuration - easily changeable for different models
const MODEL_CONFIG = {
  id: 'Qwen/Qwen2-0.5B-Instruct',
  name: 'Qwen2-0.5B-Instruct',
  version: '1.0.0',
  expectedSize: 500000000, // ~500MB
  task: 'text-generation' as const,
  language: 'en' as const,
};

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
      return await modelDownloadService.getStoredModel(
        `${MODEL_CONFIG.name}-${MODEL_CONFIG.version}`
      );
    } catch (error) {
      console.error('Error accessing stored model:', error);
      return null;
    }
  }

  isModelAvailable(): boolean {
    return this.modelStatus === 'ready' && this.modelInfo !== null;
  }

  isAIModelReady(): boolean {
    return (
      this.isModelAvailable() &&
      this.modelInfo?.name === MODEL_CONFIG.name &&
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
        modelName: MODEL_CONFIG.name,
        modelUrl: this.getModelUrl(),
        version: MODEL_CONFIG.version,
        language: MODEL_CONFIG.language,
        expectedSize: MODEL_CONFIG.expectedSize,
        resumable: true,
      };

      // Convert ModelDownloadService progress to simple percentage
      const progressCallback = onProgress
        ? (downloadProgress: any) => {
            // Map download progress (0-90%) + pipeline initialization (90-100%)
            const percentage = Math.min(downloadProgress.percentage * 0.9, 90);
            onProgress(percentage);
          }
        : undefined;

      const storedModel = await modelDownloadService.downloadModel(
        downloadOptions,
        progressCallback
      );

      if (onProgress) {
        onProgress(95);
      }

      // Initialize the pipeline with the downloaded model
      console.info('Initializing AI model pipeline...');
      this.pipeline = await pipeline(MODEL_CONFIG.task, this.getModelUrl());

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

      // Provide more specific error messages
      let errorMessage = 'Failed to download or initialize the AI model';
      if (error instanceof Error) {
        if (
          error.message.includes('404') ||
          error.message.includes('not found')
        ) {
          errorMessage =
            'AI model not found. Please check your internet connection and try again.';
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          errorMessage =
            'Network error while downloading AI model. Please check your internet connection.';
        } else if (
          error.message.includes('quota') ||
          error.message.includes('storage')
        ) {
          errorMessage =
            'Not enough storage space to download the AI model. Please free up space and try again.';
        } else {
          errorMessage = `AI model initialization failed: ${error.message}`;
        }
      }

      throw new Error(errorMessage);
    }
  }

  private getModelUrl(): string {
    // Return the configured model ID for Transformers.js
    return MODEL_CONFIG.id;
  }

  getModelInfo(): ModelInfo | null {
    return this.modelInfo;
  }

  getModelStatus(): ModelStatus {
    return this.modelStatus;
  }

  async processTriageText(text: string): Promise<TriageAnalysis> {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for analysis');
    }

    // Validate input text quality
    const textQuality = this.assessTextQuality(text);
    if (textQuality.score < 0.3) {
      console.warn('Low quality input text detected:', textQuality.issues);
    }

    try {
      let analysis: TriageAnalysis;

      if (this.isModelAvailable()) {
        // Try to use AI model first
        analysis = await this.analyzeTextWithAI(text);
        analysis.method = 'ai';
      } else {
        // Use rule-based analysis
        analysis = await this.analyzeTextWithRules(text);
        analysis.method = 'rules';
      }

      // Validate and enhance the analysis
      analysis = this.validateAndEnhanceAnalysis(analysis, textQuality);

      return analysis;
    } catch (error) {
      console.warn(
        'Primary analysis failed, falling back to rule-based analysis:',
        error
      );

      // Fallback to rule-based analysis
      const fallbackAnalysis = await this.analyzeTextWithRules(text);
      fallbackAnalysis.method = 'rules';
      fallbackAnalysis.error = `Primary analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      return this.validateAndEnhanceAnalysis(fallbackAnalysis, textQuality);
    }
  }

  private assessTextQuality(text: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 1.0;

    // Check text length
    if (text.length < 10) {
      issues.push('Text too short for meaningful analysis');
      score -= 0.4;
    } else if (text.length < 30) {
      issues.push('Limited text for comprehensive analysis');
      score -= 0.2;
    }

    // Check for medical relevance
    const medicalTerms = [
      'patient',
      'breathing',
      'pulse',
      'conscious',
      'injury',
      'pain',
      'bleeding',
      'trauma',
      'emergency',
      'medical',
      'hospital',
      'ambulance',
      'vital',
      'signs',
    ];

    const hasmedicalTerms = medicalTerms.some(term =>
      text.toLowerCase().includes(term)
    );

    if (!hasmedicalTerms) {
      issues.push('No clear medical context detected');
      score -= 0.3;
    }

    // Check for coherence (basic grammar and structure)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      issues.push('No clear sentence structure');
      score -= 0.2;
    }

    return { score: Math.max(score, 0), issues };
  }

  private validateAndEnhanceAnalysis(
    analysis: TriageAnalysis,
    textQuality: { score: number; issues: string[] }
  ): TriageAnalysis {
    // Adjust confidence based on text quality
    const qualityAdjustedConfidence = analysis.confidence * textQuality.score;

    // Add quality warnings to suggestions if needed
    const enhancedSuggestions = [...analysis.suggestions];
    if (textQuality.score < 0.5) {
      enhancedSuggestions.unshift(
        'Low quality input detected - clinical verification strongly recommended'
      );
    }

    // Validate field consistency (START protocol logic)
    const consistencyIssues = this.validateFieldConsistency(
      analysis.extractedFields
    );
    if (consistencyIssues.length > 0) {
      enhancedSuggestions.push(
        ...consistencyIssues.map(issue => `Consistency check: ${issue}`)
      );
    }

    // Add START protocol recommendations
    const startRecommendations = this.generateStartProtocolRecommendations(
      analysis.extractedFields
    );
    enhancedSuggestions.push(...startRecommendations);

    return {
      ...analysis,
      confidence: qualityAdjustedConfidence,
      suggestions: [...new Set(enhancedSuggestions)], // Remove duplicates
      reasoning: `${analysis.reasoning} Text quality score: ${textQuality.score.toFixed(2)}.`,
    };
  }

  private validateFieldConsistency(
    fields: TriageAnalysis['extractedFields']
  ): string[] {
    const issues: string[] = [];

    // Check for logical inconsistencies
    if (fields.breathing === 'absent' && fields.consciousness === 'alert') {
      issues.push('Inconsistent: Patient cannot be alert without breathing');
    }

    if (
      fields.mobility === 'ambulatory' &&
      fields.consciousness === 'unresponsive'
    ) {
      issues.push('Inconsistent: Unresponsive patient cannot be ambulatory');
    }

    if (fields.pulse && fields.pulse > 0 && fields.breathing === 'absent') {
      issues.push('Verify: Pulse present but no breathing detected');
    }

    if (
      fields.circulation === 'normal' &&
      fields.injuries &&
      fields.injuries.some(
        i =>
          i.toLowerCase().includes('bleeding') ||
          i.toLowerCase().includes('hemorrhage')
      )
    ) {
      issues.push(
        'Inconsistent: Normal circulation but bleeding injuries noted'
      );
    }

    return issues;
  }

  private generateStartProtocolRecommendations(
    fields: TriageAnalysis['extractedFields']
  ): string[] {
    const recommendations: string[] = [];

    // START protocol triage categories
    if (fields.breathing === 'absent') {
      recommendations.push(
        'RED (Immediate): No breathing - airway management required'
      );
    } else if (
      fields.breathing === 'labored' ||
      fields.consciousness === 'unresponsive' ||
      fields.circulation === 'shock'
    ) {
      recommendations.push(
        'RED (Immediate): Critical condition requires immediate care'
      );
    } else if (
      fields.circulation === 'bleeding' ||
      fields.consciousness === 'pain' ||
      fields.consciousness === 'verbal' ||
      (fields.pulse && (fields.pulse < 60 || fields.pulse > 100))
    ) {
      recommendations.push('YELLOW (Delayed): Urgent care needed but can wait');
    } else if (
      fields.mobility === 'ambulatory' &&
      fields.consciousness === 'alert' &&
      fields.breathing === 'normal'
    ) {
      recommendations.push('GREEN (Minor): Walking wounded - lowest priority');
    }

    // Specific clinical recommendations
    if (fields.respiratoryRate && fields.respiratoryRate > 30) {
      recommendations.push(
        'Monitor for respiratory failure - consider ventilatory support'
      );
    }

    if (fields.capillaryRefill && fields.capillaryRefill > 2) {
      recommendations.push(
        'Poor perfusion - assess for shock and consider fluid resuscitation'
      );
    }

    if (fields.injuries && fields.injuries.length > 2) {
      recommendations.push(
        'Multiple trauma - systematic secondary survey required'
      );
    }

    return recommendations;
  }

  private async analyzeTextWithAI(text: string): Promise<TriageAnalysis> {
    const storedModel = await this.getStoredModel();
    if (!storedModel) {
      throw new Error('AI model not found in storage');
    }

    // Create the prompt for AI model inference
    const prompt = this.createTriagePrompt(text);

    try {
      // Use Web Workers for model inference to avoid blocking the main thread
      const result = await this.runAIInference(prompt, storedModel);
      const analysis = this.parseAIResponse(result);
      analysis.method = 'ai';
      return analysis;
    } catch (error: any) {
      // Fallback to rule-based analysis and inform the user
      const ruleAnalysis = await this.analyzeTextWithRules(text);
      ruleAnalysis.method = 'rules';
      ruleAnalysis.error = `AI model failed: ${error?.message || error}`;
      ruleAnalysis.reasoning = `Fallback to rule-based analysis due to AI model error. ${
        ruleAnalysis.reasoning || ''
      }`;
      return ruleAnalysis;
    }
  }

  private createTriagePrompt(text: string): string {
    return `You are a medical AI assistant specialized in emergency triage assessment using the START (Simple Triage and Rapid Treatment) protocol. Analyze the following patient description and extract structured medical information.

PATIENT DESCRIPTION: "${text}"

EXTRACTION RULES:
1. Only extract information explicitly mentioned or clearly implied
2. Use medical terminology and standard values
3. Assign confidence based on clarity of information
4. Follow START protocol priorities: Breathing → Circulation → Mental Status → Mobility

REQUIRED FIELDS TO EXTRACT:
- ageGroup: "child" (under 15) or "adult" (15+)
- breathing: "normal" (12-20/min), "labored" (difficulty/distress), "absent" (not breathing)
- circulation: "normal" (good perfusion), "bleeding" (active hemorrhage), "shock" (poor perfusion)
- consciousness: "alert" (responsive/oriented), "verbal" (responds to voice), "pain" (responds to pain), "unresponsive" (no response)
- mobility: "ambulatory" (can walk), "non-ambulatory" (cannot walk)
- pulse: number (beats per minute, if mentioned)
- respiratoryRate: number (breaths per minute, if mentioned)
- capillaryRefill: number (seconds, if mentioned)
- radialPulse: "present" or "absent" (if mentioned)
- injuries: array of specific injury descriptions
- notes: any additional relevant clinical observations

CONFIDENCE SCORING:
- 0.9-1.0: Explicitly stated with medical terms
- 0.7-0.8: Clearly described in lay terms
- 0.5-0.6: Implied from context
- 0.3-0.4: Uncertain inference
- 0.1-0.2: Very weak indication

RESPONSE FORMAT (valid JSON only):
{
  "confidence": 0.85,
  "extractedFields": {
    "breathing": "labored",
    "consciousness": "alert",
    "injuries": ["laceration to forehead"]
  },
  "reasoning": "Patient shows clear signs of respiratory distress with labored breathing. Consciousness level is alert as patient is responsive and oriented. Visible laceration noted on forehead requiring attention.",
  "suggestions": ["Monitor respiratory status closely", "Control bleeding from head laceration", "Assess for additional injuries"]
}`;
  }

  private async runAIInference(
    prompt: string,
    _model: StoredModel
  ): Promise<string> {
    try {
      // Initialize the pipeline if not already done
      if (!this.pipeline) {
        console.info('Loading AI model...');
        this.pipeline = await pipeline(MODEL_CONFIG.task, this.getModelUrl());
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
      console.error('AI model inference failed:', error);
      // Fallback to rule-based analysis and inform the user
      throw error; // Let the caller handle the fallback and user notification
    }
  }

  private parseAIResponse(response: string): TriageAnalysis {
    try {
      // Clean the response to extract JSON
      let cleanResponse = response.trim();

      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanResponse);

      // Validate and sanitize the response structure
      const validatedResponse = this.validateAndSanitizeAIResponse(parsed);

      return validatedResponse;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Try to extract partial information from malformed response
      return this.extractPartialAIResponse(response);
    }
  }

  private validateAndSanitizeAIResponse(parsed: any): TriageAnalysis {
    // Validate confidence score
    let confidence = 0.5; // Default confidence
    if (typeof parsed.confidence === 'number') {
      confidence = Math.min(Math.max(parsed.confidence, 0), 1);
    }

    // Validate extracted fields
    const extractedFields: TriageAnalysis['extractedFields'] = {};
    if (parsed.extractedFields && typeof parsed.extractedFields === 'object') {
      const fields = parsed.extractedFields;

      // Validate age group
      if (fields.ageGroup === 'child' || fields.ageGroup === 'adult') {
        extractedFields.ageGroup = fields.ageGroup;
      }

      // Validate breathing
      if (['normal', 'labored', 'absent'].includes(fields.breathing)) {
        extractedFields.breathing = fields.breathing;
      }

      // Validate circulation
      if (['normal', 'bleeding', 'shock'].includes(fields.circulation)) {
        extractedFields.circulation = fields.circulation;
      }

      // Validate consciousness
      if (
        ['alert', 'verbal', 'pain', 'unresponsive'].includes(
          fields.consciousness
        )
      ) {
        extractedFields.consciousness = fields.consciousness;
      }

      // Validate mobility
      if (['ambulatory', 'non-ambulatory'].includes(fields.mobility)) {
        extractedFields.mobility = fields.mobility;
      }

      // Validate numeric fields
      if (
        typeof fields.pulse === 'number' &&
        fields.pulse >= 30 &&
        fields.pulse <= 250
      ) {
        extractedFields.pulse = fields.pulse;
      }

      if (
        typeof fields.respiratoryRate === 'number' &&
        fields.respiratoryRate >= 6 &&
        fields.respiratoryRate <= 60
      ) {
        extractedFields.respiratoryRate = fields.respiratoryRate;
      }

      if (
        typeof fields.capillaryRefill === 'number' &&
        fields.capillaryRefill >= 0 &&
        fields.capillaryRefill <= 10
      ) {
        extractedFields.capillaryRefill = fields.capillaryRefill;
      }

      // Validate radial pulse
      if (['present', 'absent'].includes(fields.radialPulse)) {
        extractedFields.radialPulse = fields.radialPulse;
      }

      // Validate injuries array
      if (Array.isArray(fields.injuries)) {
        extractedFields.injuries = fields.injuries.filter(
          (injury: any) =>
            typeof injury === 'string' && injury.trim().length > 0
        );
      }

      // Validate notes
      if (typeof fields.notes === 'string' && fields.notes.trim().length > 0) {
        extractedFields.notes = fields.notes.trim();
      }
    }

    // Validate reasoning
    let reasoning = 'AI analysis completed';
    if (
      typeof parsed.reasoning === 'string' &&
      parsed.reasoning.trim().length > 0
    ) {
      reasoning = parsed.reasoning.trim();
    }

    // Validate suggestions
    let suggestions: string[] = [];
    if (Array.isArray(parsed.suggestions)) {
      suggestions = parsed.suggestions.filter(
        (suggestion: any) =>
          typeof suggestion === 'string' && suggestion.trim().length > 0
      );
    }

    // Adjust confidence based on number of extracted fields
    const fieldCount = Object.keys(extractedFields).length;
    if (fieldCount === 0) {
      confidence = Math.min(confidence, 0.3);
    } else if (fieldCount < 3) {
      confidence = Math.min(confidence, 0.6);
    }

    return {
      confidence,
      extractedFields,
      reasoning,
      suggestions,
    };
  }

  private extractPartialAIResponse(response: string): TriageAnalysis {
    // Fallback method to extract partial information from malformed AI response
    console.warn(
      'Attempting to extract partial information from malformed AI response'
    );

    const extractedFields: TriageAnalysis['extractedFields'] = {};
    const suggestions: string[] = [];

    // Try to extract key information using regex patterns
    const lowerResponse = response.toLowerCase();

    // Extract breathing status
    if (
      lowerResponse.includes('breathing') &&
      lowerResponse.includes('absent')
    ) {
      extractedFields.breathing = 'absent';
      suggestions.push('Critical breathing issue identified');
    } else if (
      lowerResponse.includes('breathing') &&
      lowerResponse.includes('labored')
    ) {
      extractedFields.breathing = 'labored';
      suggestions.push('Breathing difficulties noted');
    }

    // Extract consciousness level
    if (
      lowerResponse.includes('unresponsive') ||
      lowerResponse.includes('unconscious')
    ) {
      extractedFields.consciousness = 'unresponsive';
      suggestions.push('Patient unresponsive');
    } else if (lowerResponse.includes('alert')) {
      extractedFields.consciousness = 'alert';
    }

    // Extract circulation issues
    if (
      lowerResponse.includes('bleeding') ||
      lowerResponse.includes('hemorrhage')
    ) {
      extractedFields.circulation = 'bleeding';
      suggestions.push('Bleeding detected');
    } else if (lowerResponse.includes('shock')) {
      extractedFields.circulation = 'shock';
      suggestions.push('Signs of shock');
    }

    return {
      confidence: 0.4, // Low confidence for partial extraction
      extractedFields,
      reasoning:
        'Partial information extracted from malformed AI response. Clinical assessment recommended.',
      suggestions,
    };
  }

  private async analyzeTextWithRules(text: string): Promise<TriageAnalysis> {
    // Enhanced rule-based analysis with better pattern matching and confidence scoring
    const lowerText = text.toLowerCase();
    const extractedFields: TriageAnalysis['extractedFields'] = {};
    const suggestions: string[] = [];
    const fieldConfidences: Record<string, number> = {};

    // Age group detection with confidence scoring
    const agePatterns = {
      child: [
        /\b(child|kid|pediatric|infant|baby|toddler|teenager|teen)\b/g,
        /\b(\d+)\s*(year|yr)s?\s*old\b/g,
        /\bunder\s*(\d+)\b/g,
      ],
      adult: [
        /\b(adult|grown\s*up|man|woman|elderly|senior)\b/g,
        /\b(\d+)\s*(year|yr)s?\s*old\b/g,
      ],
    };

    let childScore = 0;
    let adultScore = 0;

    agePatterns.child.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const ageMatch = match.match(/(\d+)/);
          if (ageMatch && ageMatch[1]) {
            const age = parseInt(ageMatch[1], 10);
            if (age < 15) childScore += 0.9;
            else adultScore += 0.9;
          } else {
            childScore += 0.7;
          }
        });
      }
    });

    agePatterns.adult.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const ageMatch = match.match(/(\d+)/);
          if (ageMatch && ageMatch[1]) {
            const age = parseInt(ageMatch[1], 10);
            if (age >= 15) adultScore += 0.9;
            else childScore += 0.9;
          } else {
            adultScore += 0.6;
          }
        });
      }
    });

    if (childScore > adultScore && childScore > 0.5) {
      extractedFields.ageGroup = 'child';
      fieldConfidences.ageGroup = Math.min(childScore, 0.9);
      suggestions.push('Pediatric patient - use age-appropriate protocols');
    } else if (adultScore > 0.5) {
      extractedFields.ageGroup = 'adult';
      fieldConfidences.ageGroup = Math.min(adultScore, 0.9);
    }

    // Enhanced breathing assessment
    const breathingPatterns = {
      absent: [
        /\b(not breathing|no breath|stopped breathing|apneic|respiratory arrest)\b/g,
        /\b(no air movement|chest not rising)\b/g,
      ],
      labored: [
        /\b(difficulty breathing|labored|struggling to breathe|shortness of breath|dyspnea)\b/g,
        /\b(wheezing|stridor|gasping|rapid breathing|tachypnea)\b/g,
        /\b(using accessory muscles|retractions)\b/g,
      ],
      normal: [
        /\b(breathing normal|normal respirations|breathing fine|regular breathing)\b/g,
        /\b(clear airway|good air entry)\b/g,
      ],
    };

    const breathingScore = this.calculatePatternScore(
      lowerText,
      breathingPatterns
    );
    const breathingResult = this.getHighestScoringField(breathingScore);

    if (breathingResult.field && breathingResult.score > 0.4) {
      extractedFields.breathing = breathingResult.field as any;
      fieldConfidences.breathing = breathingResult.score;

      if (breathingResult.field === 'absent') {
        suggestions.push(
          'CRITICAL: No breathing - immediate airway management required'
        );
      } else if (breathingResult.field === 'labored') {
        suggestions.push('Respiratory distress noted - monitor closely');
      }
    }

    // Enhanced consciousness assessment (AVPU scale)
    const consciousnessPatterns = {
      unresponsive: [
        /\b(unconscious|unresponsive|comatose|no response)\b/g,
        /\b(does not respond|non-responsive)\b/g,
      ],
      pain: [
        /\b(responds to pain|pain response|withdraws from pain)\b/g,
        /\b(grimaces to pain|localizes pain)\b/g,
      ],
      verbal: [
        /\b(responds to voice|verbal response|answers questions)\b/g,
        /\b(confused|disoriented but responsive)\b/g,
      ],
      alert: [
        /\b(alert|awake|oriented|conscious|responsive)\b/g,
        /\b(talking|speaking|following commands)\b/g,
      ],
    };

    const consciousnessScore = this.calculatePatternScore(
      lowerText,
      consciousnessPatterns
    );
    const consciousnessResult = this.getHighestScoringField(consciousnessScore);

    if (consciousnessResult.field && consciousnessResult.score > 0.4) {
      extractedFields.consciousness = consciousnessResult.field as any;
      fieldConfidences.consciousness = consciousnessResult.score;

      if (consciousnessResult.field === 'unresponsive') {
        suggestions.push(
          'CRITICAL: Patient unresponsive - assess airway and breathing'
        );
      } else if (consciousnessResult.field === 'pain') {
        suggestions.push('Altered mental status - monitor neurological signs');
      }
    }

    // Enhanced circulation assessment
    const circulationPatterns = {
      bleeding: [
        /\b(bleeding|blood|hemorrhage|active bleeding)\b/g,
        /\b(laceration|cut|wound|trauma)\b/g,
      ],
      shock: [
        /\b(shock|pale|clammy|weak pulse|hypotensive)\b/g,
        /\b(cool skin|delayed capillary refill|tachycardia)\b/g,
      ],
      normal: [
        /\b(good circulation|normal pulse|pink|warm)\b/g,
        /\b(no bleeding|hemodynamically stable)\b/g,
      ],
    };

    const circulationScore = this.calculatePatternScore(
      lowerText,
      circulationPatterns
    );
    const circulationResult = this.getHighestScoringField(circulationScore);

    if (circulationResult.field && circulationResult.score > 0.4) {
      extractedFields.circulation = circulationResult.field as
        | 'normal'
        | 'bleeding'
        | 'shock';
      fieldConfidences.circulation = circulationResult.score;

      if (circulationResult.field === 'bleeding') {
        suggestions.push(
          'Active bleeding - apply direct pressure and assess severity'
        );
      } else if (circulationResult.field === 'shock') {
        suggestions.push(
          'Signs of shock - monitor vital signs and consider fluid resuscitation'
        );
      }
    }

    // Enhanced mobility assessment
    const mobilityPatterns = {
      ambulatory: [
        /\b(walking|ambulatory|mobile|can walk)\b/g,
        /\b(standing|moving around)\b/g,
      ],
      'non-ambulatory': [
        /\b(cannot walk|immobile|unable to move|paralyzed)\b/g,
        /\b(wheelchair|stretcher|carried)\b/g,
      ],
    };

    const mobilityScore = this.calculatePatternScore(
      lowerText,
      mobilityPatterns
    );
    const mobilityResult = this.getHighestScoringField(mobilityScore);

    if (mobilityResult.field && mobilityResult.score > 0.4) {
      extractedFields.mobility = mobilityResult.field as
        | 'ambulatory'
        | 'non-ambulatory';
      fieldConfidences.mobility = mobilityResult.score;
    }

    // Enhanced vital signs extraction with validation
    const vitalSigns = this.extractVitalSigns(lowerText);
    Object.assign(extractedFields, vitalSigns.fields);
    Object.assign(fieldConfidences, vitalSigns.confidences);
    suggestions.push(...vitalSigns.suggestions);

    // Enhanced injury detection
    const injuryResult = this.extractInjuries(lowerText);
    if (injuryResult.injuries.length > 0) {
      extractedFields.injuries = injuryResult.injuries;
      fieldConfidences.injuries = injuryResult.confidence;
      suggestions.push(...injuryResult.suggestions);
    }

    // Calculate overall confidence based on field confidences
    const overallConfidence = this.calculateOverallConfidence(fieldConfidences);

    // Generate enhanced reasoning
    const reasoning = this.generateEnhancedReasoning(
      extractedFields,
      fieldConfidences,
      suggestions
    );

    return {
      confidence: overallConfidence,
      extractedFields,
      reasoning,
      suggestions: [...new Set(suggestions)], // Remove duplicates
    };
  }

  private calculatePatternScore(
    text: string,
    patterns: Record<string, RegExp[]>
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    for (const [field, regexList] of Object.entries(patterns)) {
      let fieldScore = 0;
      regexList.forEach(regex => {
        const matches = text.match(regex);
        if (matches) {
          // Higher score for more specific matches
          fieldScore += matches.length * 0.3;
        }
      });
      scores[field] = Math.min(fieldScore, 0.9); // Cap at 0.9
    }

    return scores;
  }

  private getHighestScoringField(scores: Record<string, number>): {
    field: string | null;
    score: number;
  } {
    let maxScore = 0;
    let maxField = null;

    for (const [field, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxField = field;
      }
    }

    return { field: maxField, score: maxScore };
  }

  private extractVitalSigns(text: string): {
    fields: Partial<TriageAnalysis['extractedFields']>;
    confidences: Record<string, number>;
    suggestions: string[];
  } {
    const fields: Partial<TriageAnalysis['extractedFields']> = {};
    const confidences: Record<string, number> = {};
    const suggestions: string[] = [];

    // Pulse extraction with validation
    const pulsePatterns = [
      /\bpulse\s+(\d+)\b/g,
      /\bheart\s+rate\s+(\d+)\b/g,
      /\bhr\s+(\d+)\b/g,
      /\b(\d+)\s+bpm\b/g,
    ];

    for (const pattern of pulsePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0 && matches[0] && matches[0][1]) {
        const pulse = parseInt(matches[0][1], 10);
        if (pulse >= 30 && pulse <= 250) {
          // Reasonable pulse range
          fields.pulse = pulse;
          confidences.pulse = 0.8;

          if (pulse < 60) {
            suggestions.push('Bradycardia noted - monitor cardiac status');
          } else if (pulse > 100) {
            suggestions.push(
              'Tachycardia noted - assess for underlying causes'
            );
          }
        }
        break;
      }
    }

    // Respiratory rate extraction with validation
    const respPatterns = [
      /\brespiratory\s+rate\s+(\d+)\b/g,
      /\brr\s+(\d+)\b/g,
      /\bbreaths?\s+per\s+minute\s+(\d+)\b/g,
      /\b(\d+)\s+respirations\b/g,
    ];

    for (const pattern of respPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0 && matches[0] && matches[0][1]) {
        const respRate = parseInt(matches[0][1], 10);
        if (respRate >= 6 && respRate <= 60) {
          // Reasonable respiratory rate range
          fields.respiratoryRate = respRate;
          confidences.respiratoryRate = 0.8;

          if (respRate < 12) {
            suggestions.push('Bradypnea noted - assess respiratory status');
          } else if (respRate > 20) {
            suggestions.push(
              'Tachypnea noted - monitor for respiratory distress'
            );
          }
        }
        break;
      }
    }

    // Capillary refill extraction
    const capRefillPatterns = [
      /\bcapillary\s+refill\s+(\d+(?:\.\d+)?)\s*(?:sec|second)s?\b/g,
      /\bcrt\s+(\d+(?:\.\d+)?)\b/g,
    ];

    for (const pattern of capRefillPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0 && matches[0] && matches[0][1]) {
        const capRefill = parseFloat(matches[0][1]);
        if (capRefill >= 0 && capRefill <= 10) {
          // Reasonable range
          fields.capillaryRefill = capRefill;
          confidences.capillaryRefill = 0.8;

          if (capRefill > 2) {
            suggestions.push('Delayed capillary refill - assess circulation');
          }
        }
        break;
      }
    }

    // Radial pulse assessment
    const radialPulsePatterns = [
      /\bradial\s+pulse\s+(present|absent|palpable|not\s+palpable)\b/g,
      /\bpulse\s+(present|absent|palpable|not\s+palpable)\b/g,
    ];

    for (const pattern of radialPulsePatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0 && matches[0] && matches[0][1]) {
        const status = matches[0][1].toLowerCase();
        if (status.includes('absent') || status.includes('not')) {
          fields.radialPulse = 'absent';
          suggestions.push('Absent radial pulse - assess central circulation');
        } else {
          fields.radialPulse = 'present';
        }
        confidences.radialPulse = 0.8;
        break;
      }
    }

    return { fields, confidences, suggestions };
  }

  private extractInjuries(text: string): {
    injuries: string[];
    confidence: number;
    suggestions: string[];
  } {
    const injuries: string[] = [];
    const suggestions: string[] = [];
    let totalMatches = 0;

    const injuryPatterns = [
      {
        pattern: /\b(fracture|broken\s+bone|fx)\b/g,
        injury: 'Fracture',
        priority: 'high',
      },
      {
        pattern: /\b(burn|thermal\s+injury)\b/g,
        injury: 'Burn injury',
        priority: 'high',
      },
      {
        pattern: /\b(laceration|cut|gash)\b/g,
        injury: 'Laceration',
        priority: 'medium',
      },
      {
        pattern: /\b(head\s+injury|traumatic\s+brain\s+injury|tbi)\b/g,
        injury: 'Head injury',
        priority: 'critical',
      },
      {
        pattern: /\b(chest\s+trauma|pneumothorax|hemothorax)\b/g,
        injury: 'Chest trauma',
        priority: 'critical',
      },
      {
        pattern: /\b(abdominal\s+trauma|internal\s+bleeding)\b/g,
        injury: 'Abdominal trauma',
        priority: 'critical',
      },
      {
        pattern: /\b(spinal\s+injury|back\s+injury)\b/g,
        injury: 'Spinal injury',
        priority: 'critical',
      },
      {
        pattern: /\b(contusion|bruise|hematoma)\b/g,
        injury: 'Contusion',
        priority: 'low',
      },
      {
        pattern: /\b(dislocation|dislocated)\b/g,
        injury: 'Dislocation',
        priority: 'medium',
      },
      {
        pattern: /\b(amputation|severed)\b/g,
        injury: 'Amputation',
        priority: 'critical',
      },
    ];

    injuryPatterns.forEach(({ pattern, injury, priority }) => {
      const matches = text.match(pattern);
      if (matches) {
        injuries.push(injury);
        totalMatches += matches.length;

        if (priority === 'critical') {
          suggestions.push(`CRITICAL: ${injury} requires immediate attention`);
        } else if (priority === 'high') {
          suggestions.push(`${injury} requires urgent care`);
        }
      }
    });

    // Calculate confidence based on number and specificity of matches
    const confidence = Math.min(totalMatches * 0.2 + 0.3, 0.9);

    return { injuries, confidence, suggestions };
  }

  private calculateOverallConfidence(
    fieldConfidences: Record<string, number>
  ): number {
    const confidenceValues = Object.values(fieldConfidences);
    if (confidenceValues.length === 0) return 0.3; // Base confidence for rule-based analysis

    // Weighted average with higher weight for critical fields
    const criticalFields = ['breathing', 'consciousness', 'circulation'];
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(fieldConfidences).forEach(([field, confidence]) => {
      const weight = criticalFields.includes(field) ? 2 : 1;
      weightedSum += confidence * weight;
      totalWeight += weight;
    });

    return Math.min(weightedSum / totalWeight, 0.8); // Cap rule-based confidence at 0.8
  }

  private generateEnhancedReasoning(
    fields: TriageAnalysis['extractedFields'],
    confidences: Record<string, number>,
    _suggestions: string[]
  ): string {
    const reasons: string[] = [];

    // START protocol priority assessment
    if (fields.breathing === 'absent') {
      reasons.push(
        'CRITICAL: No breathing detected - highest priority per START protocol'
      );
    } else if (fields.breathing === 'labored') {
      reasons.push(
        'Respiratory distress identified - requires immediate assessment'
      );
    }

    if (fields.consciousness === 'unresponsive') {
      reasons.push(
        'Patient unresponsive - indicates severe neurological compromise'
      );
    } else if (fields.consciousness === 'pain') {
      reasons.push('Altered mental status - responds only to painful stimuli');
    }

    if (fields.circulation === 'bleeding') {
      reasons.push(
        'Active hemorrhage noted - requires immediate bleeding control'
      );
    } else if (fields.circulation === 'shock') {
      reasons.push(
        'Signs of shock present - indicates compromised circulation'
      );
    }

    if (fields.mobility === 'ambulatory') {
      reasons.push(
        'Patient is ambulatory - suggests less severe injuries (GREEN category)'
      );
    } else if (fields.mobility === 'non-ambulatory') {
      reasons.push('Patient cannot walk - requires further assessment');
    }

    // Vital signs assessment
    if (fields.pulse) {
      if (fields.pulse < 60) {
        reasons.push(
          `Bradycardia present (${fields.pulse} bpm) - monitor cardiac status`
        );
      } else if (fields.pulse > 100) {
        reasons.push(
          `Tachycardia present (${fields.pulse} bpm) - may indicate stress or shock`
        );
      }
    }

    if (fields.respiratoryRate) {
      if (fields.respiratoryRate < 12) {
        reasons.push(
          `Bradypnea noted (${fields.respiratoryRate}/min) - concerning respiratory pattern`
        );
      } else if (fields.respiratoryRate > 20) {
        reasons.push(
          `Tachypnea noted (${fields.respiratoryRate}/min) - indicates respiratory distress`
        );
      }
    }

    if (fields.injuries && fields.injuries.length > 0) {
      reasons.push(
        `Multiple injuries identified: ${fields.injuries.join(', ')}`
      );
    }

    // Confidence assessment
    const avgConfidence =
      Object.values(confidences).reduce((a, b) => a + b, 0) /
      Object.values(confidences).length;
    if (avgConfidence < 0.5) {
      reasons.push(
        'Analysis based on limited information - clinical assessment recommended'
      );
    }

    if (reasons.length === 0) {
      reasons.push(
        'Rule-based analysis completed with pattern matching algorithms'
      );
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
      await modelDownloadService.deleteStoredModel(
        `${MODEL_CONFIG.name}-${MODEL_CONFIG.version}`
      );

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
