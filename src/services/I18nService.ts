/**
 * Internationalization Service
 * Handles language switching, translation, and RTL layout support
 */

import type { SupportedLanguage } from '../types';

export interface TranslationKeys {
  // App Navigation
  'app.title': string;
  'app.subtitle': string;
  'nav.back': string;
  'nav.dashboard': string;
  'nav.assessment': string;
  'nav.patientDetails': string;
  'nav.newAssessment': string;
  'nav.new': string;
  'nav.breadcrumb': string;
  'nav.navigateTo': string;
  'nav.home': string;
  'nav.unsavedChanges': string;
  'nav.unsavedFormChanges': string;
  'nav.changeLanguage': string;

  // Error Messages
  'error.dataError': string;
  'error.validationError': string;
  'error.networkError': string;
  'error.systemError': string;
  'error.unknownError': string;
  'error.storageQuotaExceeded': string;
  'error.encryptionFailed': string;
  'error.workingOffline': string;
  'error.syncFailed': string;
  'error.cleanupOldData': string;
  'error.retrySync': string;
  'error.patientNotFound': string;
  'error.invalidPatientData': string;
  'error.triageCalculationFailed': string;
  'error.databaseConnectionFailed': string;
  'error.dashboardError': string;
  'error.dashboardErrorDesc': string;
  'error.intakeError': string;
  'error.intakeErrorDesc': string;
  'error.patientDetailError': string;
  'error.patientDetailErrorDesc': string;
  'error.formValidationFailed': string;
  'error.requiredFieldsMissing': string;
  'error.invalidDataFormat': string;
  'error.connectionLost': string;
  'error.sessionExpired': string;
  'error.permissionDenied': string;
  'error.deviceStorageFull': string;
  'error.browserNotSupported': string;
  'error.initialization_failed': string;
  'error.component_error': string;
  'error.recoveryAction': string;
  'error.refreshApp': string;

  // Home Screen
  'home.startAssessment': string;
  'home.viewDashboard': string;
  'home.features.triageProtocol': string;
  'home.features.triageProtocolDesc': string;
  'home.features.offlineReady': string;
  'home.features.offlineReadyDesc': string;
  'home.features.secure': string;
  'home.features.secureDesc': string;
  'home.documentation': string;
  'home.githubProject': string;

  // Patient Intake Form
  'intake.progress': string;
  'intake.patientId': string;
  'intake.basicInfo': string;
  'intake.ageGroup': string;
  'intake.ageGroup.child': string;
  'intake.ageGroup.adult': string;
  'intake.vitals': string;
  'intake.normalVitals': string;
  'intake.pulse': string;
  'intake.pulsePlaceholder': string;
  'intake.respiratoryRate': string;
  'intake.respiratoryPlaceholder': string;
  'intake.clinicalAssessment': string;
  'intake.breathing': string;
  'intake.breathing.normal': string;
  'intake.breathing.labored': string;
  'intake.breathing.absent': string;
  'intake.circulation': string;
  'intake.circulation.normal': string;
  'intake.circulation.bleeding': string;
  'intake.circulation.shock': string;
  'intake.consciousness': string;
  'intake.consciousness.alert': string;
  'intake.consciousness.verbal': string;
  'intake.consciousness.pain': string;
  'intake.consciousness.unresponsive': string;
  'intake.mobility': string;
  'intake.mobility.ambulatory': string;
  'intake.mobility.immobile': string;
  'intake.additional': string;
  'intake.capillaryRefill': string;
  'intake.capillaryPlaceholder': string;
  'intake.radialPulse': string;
  'intake.radialPulse.present': string;
  'intake.radialPulse.absent': string;
  'intake.injuries': string;
  'intake.injuriesPlaceholder': string;
  'intake.notes': string;
  'intake.notesPlaceholder': string;
  'intake.submit': string;
  'intake.cancel': string;
  'intake.calculating': string;
  'intake.completeRequired': string;

  // Triage Priorities
  'triage.red': string;
  'triage.redDesc': string;
  'triage.yellow': string;
  'triage.yellowDesc': string;
  'triage.green': string;
  'triage.greenDesc': string;
  'triage.black': string;
  'triage.blackDesc': string;

  // Patient Dashboard
  'dashboard.title': string;
  'dashboard.noPatients': string;
  'dashboard.noPatientsSub': string;
  'dashboard.noPatientsFilter': string;
  'dashboard.totalPatients': string;
  'dashboard.refresh': string;
  'dashboard.filters': string;
  'dashboard.filterByPriority': string;
  'dashboard.filterByStatus': string;
  'dashboard.sortBy': string;
  'dashboard.sortByPriority': string;
  'dashboard.sortByTime': string;
  'dashboard.all': string;
  'dashboard.active': string;
  'dashboard.treated': string;
  'dashboard.transferred': string;
  'dashboard.discharged': string;
  'dashboard.dataManagement': string;

  // Data Management
  'dataManagement.title': string;
  'dataManagement.storageStats': string;
  'dataManagement.totalPatients': string;
  'dataManagement.storageUsed': string;
  'dataManagement.activePatients': string;
  'dataManagement.treatedPatients': string;
  'dataManagement.backupRestore': string;
  'dataManagement.exportAll': string;
  'dataManagement.importData': string;
  'dataManagement.backupNote': string;
  'dataManagement.bulkOperations': string;
  'dataManagement.selectAll': string;
  'dataManagement.selected': string;
  'dataManagement.updateStatus': string;
  'dataManagement.exportSelected': string;
  'dataManagement.deleteSelected': string;

  // Patient Details
  'patient.intake.title': string;
  'patient.edit.title': string;
  'patient.details': string;
  'patient.edit': string;
  'patient.save': string;
  'patient.delete': string;
  'patient.status': string;
  'patient.priority': string;
  'patient.assessedAt': string;
  'patient.lastUpdated': string;
  'patient.confirmStatusChange': string;
  'patient.confirmStatusChangeMsg': string;
  'patient.confirmDelete': string;
  'patient.confirmDeleteMsg': string;
  'patient.actionCanNotBeUndone': string;
  'patient.dischargeMsg': string;

  // Assessment details
  'assessment.start.sub': string;

  // Status Labels
  'status.active': string;
  'status.treated': string;
  'status.transferred': string;
  'status.discharged': string;

  // Common Actions
  'common.add': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.update': string;
  'common.close': string;
  'common.confirm': string;
  'common.loading': string;
  'common.updating': string;
  'common.complete': string;
  'common.error': string;
  'common.success': string;
  'common.warning': string;
  'common.tryAgain': string;
  'common.markAs': string;
  'common.info': string;
  'common.additionalInfo': string;

  // Validation Messages
  'validation.required': string;
  'validation.invalidPulse': string;
  'validation.invalidRespiratory': string;
  'validation.invalidCapillary': string;
  'validation.selectOption': string;
  'validation.notRecorded': string;
  'validation.errorFound': string;
  'validation.errorsFound': string;
  'validation.required_field': string;
  'validation.invalid_range': string;
  'validation.invalid_pattern': string;
  'validation.invalid_type': string;

  // Toast Messages
  'toast.patientCreated': string;
  'toast.patientUpdated': string;
  'toast.patientDeleted': string;
  'toast.errorOccurred': string;
  'toast.formSubmitSuccess': string;
  'toast.formSubmitError': string;
  'toast.dataLoadError': string;
  'toast.dataSaveError': string;
  'toast.operationSuccess': string;
  'toast.operationFailed': string;

  // PWA Messages
  'pwa.installTitle': string;
  'pwa.installDescription': string;
  'pwa.install': string;
  'pwa.installing': string;
  'pwa.notNow': string;
  'pwa.updateAvailable': string;
  'pwa.updateDescription': string;
  'pwa.updateNow': string;
  'pwa.updating': string;
  'pwa.refresh': string;
  'pwa.later': string;
  'pwa.currentVersion': string;
  'pwa.offline': string;
  'pwa.online': string;
  'pwa.workingOffline': string;
  'pwa.backOnline': string;
}

export type TranslationKey = keyof TranslationKeys;

class I18nService {
  private currentLanguage: SupportedLanguage = 'en';
  private translations: Record<SupportedLanguage, TranslationKeys> = {
    en: {} as TranslationKeys,
    ar: {} as TranslationKeys,
  };
  private listeners: Array<(language: SupportedLanguage) => void> = [];

  constructor() {
    this.loadTranslations();
    this.loadLanguagePreference();
  }

  /**
   * Load translations for all supported languages
   */
  private async loadTranslations(): Promise<void> {
    try {
      // Load English translations
      const enTranslations = await import('../locales/en.json');
      this.translations.en = enTranslations.default;

      // Load Arabic translations
      const arTranslations = await import('../locales/ar.json');
      this.translations.ar = arTranslations.default;
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to empty translations - app will show keys
    }
  }

  /**
   * Load language preference from localStorage
   */
  private loadLanguagePreference(): void {
    try {
      const savedLanguage = localStorage.getItem(
        'triageaid-language'
      ) as SupportedLanguage;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
        this.currentLanguage = savedLanguage;
      }
    } catch (error) {
      console.warn('Failed to load language preference:', error);
    }
  }

  /**
   * Save language preference to localStorage
   */
  private saveLanguagePreference(language: SupportedLanguage): void {
    try {
      localStorage.setItem('triageaid-language', language);
    } catch (error) {
      console.warn('Failed to save language preference:', error);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    if (language !== this.currentLanguage) {
      this.currentLanguage = language;
      this.saveLanguagePreference(language);
      this.updateDocumentDirection();
      this.notifyListeners();
    }
  }

  /**
   * Get translation for a key
   */
  t(key: TranslationKey, fallback?: string): string {
    const translation = this.translations[this.currentLanguage]?.[key];

    if (translation) {
      return translation;
    }

    // Fallback to English if current language doesn't have the key
    if (this.currentLanguage !== 'en') {
      const englishTranslation = this.translations.en?.[key];
      if (englishTranslation) {
        return englishTranslation;
      }
    }

    // Return fallback or key itself
    return fallback || key;
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }

  /**
   * Get text direction for current language
   */
  getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  /**
   * Update document direction based on current language
   */
  private updateDocumentDirection(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = this.getDirection();
      document.documentElement.lang = this.currentLanguage;
    }
  }

  /**
   * Subscribe to language changes
   */
  subscribe(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of language change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }

  /**
   * Initialize i18n service
   */
  async initialize(): Promise<void> {
    await this.loadTranslations();
    this.updateDocumentDirection();
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
  }> {
    return [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
      },
    ];
  }

  /**
   * Format number according to current locale
   */
  formatNumber(number: number): string {
    try {
      return new Intl.NumberFormat(
        this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US'
      ).format(number);
    } catch (error) {
      console.error('Error formatting number:', error);
      // Fallback to default locale if Intl is not supported
      if (this.currentLanguage === 'ar') {
        return number.toLocaleString('ar-SA');
      }
      return number.toString();
    }
  }

  /**
   * Format date according to current locale
   */
  formatDate(date: Date): string {
    try {
      return new Intl.DateTimeFormat(
        this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
        {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toLocaleString();
    }
  }

  /**
   * Format time according to current locale
   */
  formatTime(date: Date): string {
    try {
      return new Intl.DateTimeFormat(
        this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      ).format(date);
    } catch (error) {
      console.error('Error formatting time:', error);
      return date.toLocaleTimeString();
    }
  }
}

// Create singleton instance
export const i18nService = new I18nService();

// Export types
export type { SupportedLanguage };
