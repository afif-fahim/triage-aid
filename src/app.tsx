import { useState, useEffect } from 'preact/hooks';
import { lazy, Suspense } from 'preact/compat';
import './app.css';
import { LanguageSwitcher, BreadcrumbNavigation } from './components';
import { SettingsModal } from './components/SettingsModal';
import {
  ResponsiveContainer,
  Toast,
  Button,
  Card,
  ToastContainer,
  ErrorBoundary,
  FallbackErrorState,
  LoadingSpinner,
} from './components/ui';
import { PWAConnectionStatus, PWAPrompts } from './components/PWAStatus';

// Lazy load heavy components
const PatientIntakeForm = lazy(() =>
  import('./components/PatientIntakeForm').then(m => ({
    default: m.PatientIntakeForm,
  }))
);
const PatientDashboard = lazy(() =>
  import('./components/PatientDashboard').then(m => ({
    default: m.PatientDashboard,
  }))
);
const PatientDetailView = lazy(() =>
  import('./components/PatientDetailView').then(m => ({
    default: m.PatientDetailView,
  }))
);
import { pwaService } from './services/PWAService';
import { i18nService } from './services/I18nService';
import {
  errorHandlingService,
  ToastNotification,
} from './services/ErrorHandlingService';
import { useTranslation, useRouter } from './hooks';

export function App() {
  const { t, isRTL, direction } = useTranslation();
  const { currentView, params, navigateToView, goBack } = useRouter();
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [pwaInitialized, setPwaInitialized] = useState(false);
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    // Navigate to dashboard - the main working area for medical staff
    // This provides the best workflow experience as users can:
    // 1. Start another assessment immediately
    // 2. Review existing patients
    // 3. Access all triage management features
    navigateToView('dashboard');
  };

  const handlePatientSelect = (patientId: string) => {
    navigateToView('patient-detail', { id: patientId });
    setToast(null);
  };

  const handleBackToPrev = () => {
    goBack();
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
      {/* Header Layout */}
      <header class="bg-white/50 backdrop-blur-md shadow-sm border-b border-gray-200 safe-top sticky top-0 z-50">
        <ResponsiveContainer maxWidth="full" padding="sm">
          <div class="flex items-center justify-between min-h-[60px] gap-2">
            {/* Left Section - Navigation */}
            <div class="flex items-center min-w-0 flex-1">
              {currentView && currentView !== 'home' ? (
                <div class="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToPrev}
                    className="text-medical-primary hover:text-blue-700 font-medium shrink-0"
                  >
                    {t('nav.back')}
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
              ) : (
                <div class="flex items-center">
                  <h1 class="text-lg font-semibold text-medical-text-primary">
                    {t('app.title')}
                  </h1>
                </div>
              )}
            </div>

            {/* Center Section - Action Button (when applicable) */}
            <div class="hidden sm:flex items-center shrink-0">
              {currentView === 'dashboard' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartAssessment}
                >
                  + {t('nav.newAssessment')}
                </Button>
              )}
            </div>

            {/* Right Section - Controls */}
            <div
              class={`flex items-center gap-2 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {/* Mobile New Assessment Button */}
              <div class="sm:hidden">
                {currentView === 'dashboard' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStartAssessment}
                    aria-label={t('nav.newAssessment')}
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </Button>
                )}
              </div>

              {/* Settings Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2"
                aria-label="Settings"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </Button>

              {/* Language Switcher */}
              <div class="relative">
                <LanguageSwitcher variant="dropdown" size="sm" />
              </div>

              {/* PWA Status */}
              {pwaInitialized && (
                <div class="">
                  <PWAConnectionStatus />
                </div>
              )}
            </div>
          </div>
        </ResponsiveContainer>
      </header>

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
        <ToastContainer position="bottom-right" maxToasts={3} />

        {/* Home View */}
        {(!currentView || currentView === 'home') && (
          <div class="text-center animate-fade-in">
            <Card variant="elevated" padding="lg" className="max-w-2xl mx-auto">
              <div class="mb-8">
                {/* Logo */}
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
                  <circle cx="332" cy="332" r="16" fill="#6A6C6D" />
                </svg>
                <h1 class="text-responsive-2xl font-bold text-medical-text-primary mb-3">
                  {t('app.title')}
                </h1>
                <p class="text-responsive-base text-medical-text-secondary mb-8 max-w-md mx-auto">
                  {t('app.subtitle')}
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
                {/* Triage Protocols */}
                <div class="text-center">
                  <div class="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="9" />
                      <path
                        d="M10 6a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H7a1 1 0 110-2h2V7a1 1 0 011-1z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <h3 class="text-sm font-medium text-medical-text-primary mb-1">
                    {t('home.features.triageProtocol')}
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    {t('home.features.triageProtocolDesc')}
                  </p>
                </div>
                {/* Offline App */}
                <div class="text-center">
                  <div class="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6"
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
                {/* Secure */}
                <div class="text-center">
                  <div class="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg
                      class="w-6 h-6"
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

              {/* Documentation and Project Links */}
              <div class="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() =>
                    window.open(
                      'https://afif-fahim.notion.site/TriageAid-Offline-Medical-Triage-Assessment-Tool-2326e231ee9580959117d64a242032e9',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex-1"
                  aria-label="Open documentation in new tab"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('home.documentation')}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() =>
                    window.open(
                      'https://github.com/afif-fahim/triage-aid',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="flex-1"
                  aria-label="Open GitHub project in new tab"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t('home.githubProject')}
                </Button>
              </div>

              {/* Hackathon Attribution */}
              <div class="mt-6 pt-6 border-t border-gray-200 text-center">
                <p class="text-sm text-medical-text-secondary">
                  Built for{' '}
                  <a
                    href="https://www.deendevelopers.com/gaza"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-medical-primary hover:text-blue-700 hover:underline"
                  >
                    <span class="inline-flex items-center gap-1">
                      Hack for Gaza
                      <img
                        src="https://flagcdn.com/16x12/ps.png"
                        width="16"
                        height="12"
                        alt="Palestine"
                        class="inline-block"
                      />
                    </span>
                  </a>
                </p>
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
                  onReset={handleBackToPrev}
                />
              }
            >
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <PatientDashboard onPatientSelect={handlePatientSelect} />
              </Suspense>
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
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <PatientIntakeForm
                  onSubmit={handlePatientSubmit}
                  onCancel={handleCancelAssessment}
                />
              </Suspense>
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
              <Suspense fallback={<LoadingSpinner size="lg" />}>
                <PatientDetailView
                  patientId={selectedPatientId}
                  onClose={handleClosePatientDetail}
                  onPatientUpdate={handlePatientUpdate}
                  onPatientDelete={handlePatientDelete}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
      </ResponsiveContainer>

      {/* PWA Prompts */}
      {pwaInitialized && <PWAPrompts />}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
