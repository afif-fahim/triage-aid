/**
 * Translation Hook
 * Custom hook for using translations in components
 */

import { useState, useEffect } from 'preact/hooks';
import {
  i18nService,
  type SupportedLanguage,
  type TranslationKey,
} from '../services/I18nService';

export interface UseTranslationReturn {
  t: (key: TranslationKey, fallback?: string) => string;
  language: SupportedLanguage;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  formatNumber: (number: number) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
}

/**
 * Hook for accessing translation functions and language state
 */
export function useTranslation(): UseTranslationReturn {
  const [language, setLanguage] = useState<SupportedLanguage>(
    i18nService.getCurrentLanguage()
  );

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18nService.subscribe(newLanguage => {
      setLanguage(newLanguage);
    });

    return unsubscribe;
  }, []);

  return {
    t: (key: TranslationKey, fallback?: string) => i18nService.t(key, fallback),
    language,
    isRTL: i18nService.isRTL(),
    direction: i18nService.getDirection(),
    formatNumber: (number: number) => i18nService.formatNumber(number),
    formatDate: (date: Date) => i18nService.formatDate(date),
    formatTime: (date: Date) => i18nService.formatTime(date),
  };
}
