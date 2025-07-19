/**
 * Application State Interface
 * Defines the structure for managing application state
 */

import type { TriagePriority } from './TriagePriority';
import type { PatientData } from './PatientData';

export interface AppState {
  // Current view/route
  currentView: 'dashboard' | 'intake' | 'patient-detail';

  // Selected patient for editing
  selectedPatientId: string | null;

  // UI preferences
  language: 'en' | 'ar';
  theme: 'light' | 'dark';

  // Dashboard filters and sorting
  dashboardFilter: {
    priority: TriagePriority['level'] | 'all';
    status: PatientData['status'] | 'all';
    sortBy: 'priority' | 'timestamp';
    sortOrder: 'asc' | 'desc';
  };

  // App metadata
  isOnline: boolean;
  lastSync: Date | null;
  version: string;

  // Loading states
  isLoading: boolean;

  // Error state
  error: AppError | null;
}

/**
 * Application Error Interface
 */
export interface AppError {
  type: 'data' | 'validation' | 'system' | 'network';
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Initial application state
 */
export const INITIAL_APP_STATE: AppState = {
  currentView: 'dashboard',
  selectedPatientId: null,
  language: 'en',
  theme: 'light',
  dashboardFilter: {
    priority: 'all',
    status: 'all',
    sortBy: 'priority',
    sortOrder: 'asc',
  },
  isOnline: navigator.onLine,
  lastSync: null,
  version: '1.0.0',
  isLoading: false,
  error: null,
};

/**
 * Action types for state management
 */
export type AppAction =
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_SELECTED_PATIENT'; payload: string | null }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'ar' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | {
      type: 'SET_DASHBOARD_FILTER';
      payload: Partial<AppState['dashboardFilter']>;
    }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'RESET_STATE' };

/**
 * View navigation types
 */
export type AppView = AppState['currentView'];

/**
 * Language support types
 */
export type SupportedLanguage = 'en' | 'ar';

/**
 * Theme types
 */
export type AppTheme = 'light' | 'dark';
