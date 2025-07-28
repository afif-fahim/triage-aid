/**
 * Breadcrumb Navigation Component
 * Provides breadcrumb navigation for better user orientation
 */

import { useState, useEffect } from 'preact/hooks';
import { routerService, type BreadcrumbItem } from '../services/RouterService';
import { useTranslation } from '../hooks';

interface BreadcrumbNavigationProps {
  className?: string;
}

export function BreadcrumbNavigation({
  className = '',
}: BreadcrumbNavigationProps) {
  const { t, isRTL } = useTranslation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    // Subscribe to breadcrumb changes
    const unsubscribe = routerService.onBreadcrumbChange(setBreadcrumbs);

    return unsubscribe;
  }, []);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for single-level navigation
  }

  const handleBreadcrumbClick = async (item: BreadcrumbItem) => {
    if (item.path && !item.active) {
      await routerService.navigateWithBasePath(item.path);
    }
  };

  const translateLabel = (label: string): string => {
    if (label.startsWith('nav.')) {
      return t(label as keyof typeof t);
    }
    return label;
  };

  return (
    <nav
      className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'} text-sm text-medical-text-secondary ${className}`}
      aria-label={t('nav.breadcrumb')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ol
        className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}
      >
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className={`w-4 h-4 mx-1 text-gray-400 ${isRTL ? 'rotate-180' : ''} flex-shrink-0`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
                role="presentation"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            {item.active ? (
              <span
                className="font-medium text-blue-800 truncate"
                aria-current="page"
              >
                {translateLabel(item.label)}
              </span>
            ) : (
              <button
                onClick={() => handleBreadcrumbClick(item)}
                className="hover:text-medical-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-opacity-50 rounded px-1 py-0.5 truncate min-w-0"
                type="button"
                aria-label={`${t('nav.navigateTo')} ${translateLabel(item.label)}`}
              >
                {translateLabel(item.label)}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
