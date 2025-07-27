/**
 * Language Switcher Component
 * Provides UI for switching between supported languages
 */

import { useState, useEffect } from 'preact/hooks';
import { i18nService, type SupportedLanguage } from '../services/I18nService';
import { useTranslation } from '../hooks';
import { Button } from './ui';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageSwitcher({
  className = '',
  variant = 'dropdown',
  size = 'sm',
}: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18nService.getCurrentLanguage()
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Subscribe to language changes
    const unsubscribe = i18nService.subscribe(language => {
      setCurrentLanguage(language);
    });

    return unsubscribe;
  }, []);

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18nService.setLanguage(language);
    setIsOpen(false);
  };

  const availableLanguages = i18nService.getAvailableLanguages();
  const currentLangInfo = availableLanguages.find(
    lang => lang.code === currentLanguage
  );

  if (variant === 'toggle') {
    // Simple toggle between two languages
    const otherLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    const otherLangInfo = availableLanguages.find(
      lang => lang.code === otherLanguage
    );

    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => handleLanguageChange(otherLanguage)}
        className={`${className} font-medium`}
      >
        {otherLangInfo?.nativeName}
      </Button>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative language-switcher-container ${className}`}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="font-medium flex items-center gap-1 min-w-[44px] justify-center"
        aria-label={t('nav.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="hidden sm:inline">{currentLangInfo?.nativeName}</span>
        <span className="sm:hidden text-xs font-bold">
          {currentLangInfo?.code.toUpperCase()}
        </span>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu - positioned based on text direction */}
          <div
            className={`
              absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]
              ${currentLanguage === 'ar' ? 'left-0' : 'right-0'}
            `}
            role="menu"
            aria-orientation="vertical"
          >
            {availableLanguages.map(language => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                role="menuitem"
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg
                  flex items-center justify-between transition-colors duration-150
                  ${currentLanguage === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  ${language.code === 'ar' ? 'text-right' : 'text-left'}
                `}
              >
                <span className="font-medium">{language.nativeName}</span>
                {currentLanguage === language.code && (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
