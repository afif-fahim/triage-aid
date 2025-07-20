/**
 * RTL Layout Utilities
 * Helper functions for RTL layout support
 */

import { i18nService } from '../services/I18nService';

/**
 * Get RTL-aware margin classes
 */
export function getMarginClass(side: 'left' | 'right', size: string): string {
  const isRTL = i18nService.isRTL();

  if (side === 'left') {
    return isRTL ? `mr-${size}` : `ml-${size}`;
  } else {
    return isRTL ? `ml-${size}` : `mr-${size}`;
  }
}

/**
 * Get RTL-aware padding classes
 */
export function getPaddingClass(side: 'left' | 'right', size: string): string {
  const isRTL = i18nService.isRTL();

  if (side === 'left') {
    return isRTL ? `pr-${size}` : `pl-${size}`;
  } else {
    return isRTL ? `pl-${size}` : `pr-${size}`;
  }
}

/**
 * Get RTL-aware text alignment
 */
export function getTextAlign(align: 'left' | 'right'): string {
  const isRTL = i18nService.isRTL();

  if (align === 'left') {
    return isRTL ? 'text-right' : 'text-left';
  } else {
    return isRTL ? 'text-left' : 'text-right';
  }
}

/**
 * Get RTL-aware flex direction
 */
export function getFlexDirection(reverse: boolean = false): string {
  const isRTL = i18nService.isRTL();

  if (reverse) {
    return isRTL ? 'flex-row' : 'flex-row-reverse';
  } else {
    return isRTL ? 'flex-row-reverse' : 'flex-row';
  }
}

/**
 * Get RTL-aware positioning classes
 */
export function getPositionClass(side: 'left' | 'right', size: string): string {
  const isRTL = i18nService.isRTL();

  if (side === 'left') {
    return isRTL ? `right-${size}` : `left-${size}`;
  } else {
    return isRTL ? `left-${size}` : `right-${size}`;
  }
}

/**
 * Combine multiple RTL-aware classes
 */
export function rtlClasses(...classes: string[]): string {
  return classes.join(' ');
}
