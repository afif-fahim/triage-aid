import { useState, useEffect } from 'preact/hooks';
import './app.css';
import {
  PatientIntakeForm,
  PatientDashboard,
  PatientDetailView,
  LanguageSwitcher,
  BreadcrumbNavigation,
} from './components';
import {
  ResponsiveContainer,
  Toast,
  Button,
  Card,
  ToastContainer,
  ErrorBoundary,
  FallbackErrorState,
} from './components/ui';
import { PWAStatus } from './components/PWAStatus';
import { pwaService } from './services/PWAService';
import { i18nService } from './services/I18nService';
import {
  errorHandlingService,
  ToastNotification,
} from './services/ErrorHandlingService';
import { useTranslation, useRouter } from './hooks';

export function App() {
  const { t, isRTL, direction } = useTranslation();
  const { currentView, params, navigate, navigateToView } = useRouter();
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [pwaInitialized, setPwaInitialized] = useState(false);
  const [i18nInitialized, setI18nInitialized] = useState(false);

  // Get patient ID from route params
  const selectedPatientId = params.id || null;

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize i18n service first
        await i18nService.initialize();
        setI18nInitialized(true);

        // Initialize PWA service
        await pwaService.initialize();
        setPwaInitialized(true);

        // Initialize toast container for error handling service
        const toastCallback = (notification: ToastNotification) => {
          setToast(notification);
        };
        errorHandlingService.setToastCallback(toastCallback);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        // App still works without some features
        setI18nInitialized(true);
        setPwaInitialized(true);

        // Show error notification
        if (error instanceof Error) {
          errorHandlingService.handleError({
            type: 'system',
            code: 'INITIALIZATION_FAILED',
            message: error.message,
            details: error,
            timestamp: new Date(),
            recoverable: true,
          });
        }
      }
    };

    initializeServices();
  }, []);

  const handlePatientSubmit = (_patientId: string) => {
    setToast({
      message: t('toast.patientCreated'),
      type: 'success',
    });
    navigateToView('dashboard');
  };

  const handleStartAssessment = () => {
    navigateToView('intake');
    setToast(null);
  };

  const handleViewDashboard = () => {
    navigateToView('dashboard');
    setToast(null);
  };

  const handleCancelAssessment = () => {
    navigateToView('dashboard');
  };

  const handlePatientSelect = (patientId: string) => {
    navigateToView('patient-detail', { id: patientId });
    setToast(null);
  };

  const handleBackToHome = () => {
    navigate('/');
    setToast(null);
  };

  const handlePatientUpdate = (_patientId: string, _updates: unknown) => {
    setToast({
      message: t('toast.patientUpdated'),
      type: 'success',
    });
  };

  const handlePatientDelete = (_patientId: string) => {
    setToast({
      message: t('toast.patientDeleted'),
      type: 'success',
    });
    navigateToView('dashboard');
  };

  const handleClosePatientDetail = () => {
    navigateToView('dashboard');
  };

  // Don't render until i18n is initialized
  if (!i18nInitialized) {
    return (
      <div class="min-h-screen bg-medical-background flex items-center justify-center">
        <div class="text-medical-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div
      class={`min-h-screen bg-medical-background ${isRTL ? 'rtl' : 'ltr'}`}
      dir={direction}
    >
      {/* PWA Status and Language Switcher */}
      <div
        class={`fixed top-4 z-50 flex items-center gap-2 ${isRTL ? 'left-4' : 'right-4'}`}
      >
        <LanguageSwitcher variant="dropdown" />
        {pwaInitialized && <PWAStatus />}
      </div>

      {/* Navigation Header */}
      {currentView && currentView !== 'home' && (
        <nav class="bg-medical-surface shadow-sm border-b border-gray-200 safe-top">
          <ResponsiveContainer maxWidth="full" padding="sm">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToHome}
                  className="text-medical-primary hover:text-blue-700 font-medium shrink-0"
                >
                  {isRTL ? 'مساعد الفرز ←' : '← TriageAid'}
                </Button>
                <span class="text-gray-300 hidden sm:inline">|</span>

                {/* Breadcrumb Navigation */}
                <div class="min-w-0 flex-1">
                  <BreadcrumbNavigation className="hidden sm:block" />
                  <span class="text-medical-text-primary font-medium text-sm sm:hidden truncate">
                    {currentView === 'dashboard' && t('nav.dashboard')}
                    {currentView === 'intake' && t('nav.assessment')}
                    {currentView === 'patient-detail' &&
                      `${t('nav.patientDetails')}${selectedPatientId ? ` - #${selectedPatientId.slice(0, 8).toUpperCase()}` : ''}`}
                  </span>
                </div>
              </div>

              {currentView === 'dashboard' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartAssessment}
                  className={`shrink-0 ${isRTL ? 'mr-2' : 'ml-2'}`}
                >
                  <span class="hidden sm:inline">{t('nav.newAssessment')}</span>
                  <span class="sm:hidden">{t('nav.new')}</span>
                </Button>
              )}
            </div>
          </ResponsiveContainer>
        </nav>
      )}

      <ResponsiveContainer maxWidth="3xl" padding="md" className="safe-bottom">
        {/* Toast Notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            actions={toast.actions}
            onClose={() => setToast(null)}
          />
        )}

        {/* Global Toast Container for Error Handling Service */}
        <ToastContainer position="top-right" maxToasts={3} />

        {/* Home View */}
        {(!currentView || currentView === 'home') && (
          <div class="text-center animate-fade-in">
            <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto">
              <div class="mb-8">
                <svg
                  class="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6"
                  viewBox="0 0 512 512"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="256" cy="256" r="256" fill="#1E40AF" />
                  <rect
                    x="216"
                    y="136"
                    width="80"
                    height="240"
                    rx="8"
                    fill="white"
                  />
                  <rect
                    x="136"
                    y="216"
                    width="240"
                    height="80"
                    rx="8"
                    fill="white"
                  />
                  <circle cx="180" cy="180" r="16" fill="#DC2626" />
                  <circle cx="332" cy="180" r="16" fill="#D97706" />
                  <circle cx="180" cy="332" r="16" fill="#059669" />
                  <circle cx="332" cy="332" r="16" fill="#374151" />
                </svg>
                <h1 class="text-responsive-2xl font-bold text-medical-text-primary mb-3">
                  {t('home.title')}
                </h1>
                <p class="text-responsive-base text-medical-text-secondary mb-8 max-w-md mx-auto">
                  {t('home.subtitle')}
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleStartAssessment}
                    className="sm:flex-1"
                  >
                    {t('home.startAssessment')}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={handleViewDashboard}
                    className="sm:flex-1"
                  >
                    {t('home.viewDashboard')}
                  </Button>
                </div>
              </div>

              {/* Feature highlights */}
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
                <div class="text-center">
                  <div class="w-12 h-12 bg-medical-primary bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6 text-medical-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 class="text-sm font-medium text-medical-text-primary mb-1">
                    {t('home.features.startProtocol')}
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    {t('home.features.startProtocolDesc')}
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 bg-medical-success bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6 text-medical-success"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 class="text-sm font-medium text-medical-text-primary mb-1">
                    {t('home.features.offlineReady')}
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    {t('home.features.offlineReadyDesc')}
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 bg-medical-accent bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6 text-medical-accent"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 class="text-sm font-medium text-medical-text-primary mb-1">
                    {t('home.features.secure')}
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    {t('home.features.secureDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div class="animate-fade-in">
            <ErrorBoundary
              fallback={
                <FallbackErrorState
                  title={t('error.dashboardError')}
                  message={t('error.dashboardErrorDesc')}
                  onRetry={handleViewDashboard}
                  onReset={handleBackToHome}
                />
              }
            >
              <PatientDashboard onPatientSelect={handlePatientSelect} />
            </ErrorBoundary>
          </div>
        )}

        {/* Intake Form View */}
        {currentView === 'intake' && (
          <div class="animate-fade-in">
            <ErrorBoundary
              fallback={
                <FallbackErrorState
                  title={t('error.intakeError')}
                  message={t('error.intakeErrorDesc')}
                  onRetry={handleStartAssessment}
                  onReset={handleCancelAssessment}
                />
              }
            >
              <PatientIntakeForm
                onSubmit={handlePatientSubmit}
                onCancel={handleCancelAssessment}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Patient Detail View */}
        {currentView === 'patient-detail' && selectedPatientId && (
          <div class="animate-fade-in">
            <ErrorBoundary
              fallback={
                <FallbackErrorState
                  title={t('error.patientDetailError')}
                  message={t('error.patientDetailErrorDesc')}
                  onRetry={() => handlePatientSelect(selectedPatientId)}
                  onReset={handleClosePatientDetail}
                />
              }
            >
              <PatientDetailView
                patientId={selectedPatientId}
                onClose={handleClosePatientDetail}
                onPatientUpdate={handlePatientUpdate}
                onPatientDelete={handlePatientDelete}
              />
            </ErrorBoundary>
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
