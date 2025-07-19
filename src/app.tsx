import { useState, useEffect } from 'preact/hooks';
import './app.css';
import {
  PatientIntakeForm,
  PatientDashboard,
  PatientDetailView,
} from './components';
import { ResponsiveContainer, Toast, Button, Card } from './components/ui';
import { PWAStatus } from './components/PWAStatus';
import { pwaService } from './services/PWAService';

type AppView = 'home' | 'dashboard' | 'intake' | 'patient-detail';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const [pwaInitialized, setPwaInitialized] = useState(false);

  // Initialize PWA service
  useEffect(() => {
    const initializePWA = async () => {
      try {
        await pwaService.initialize();
        setPwaInitialized(true);
        
      } catch (error) {
        console.error('Failed to initialize PWA service:', error);
        // App still works without PWA features
        setPwaInitialized(true);
      }
    };

    initializePWA();
  }, []);

  const handlePatientSubmit = (patientId: string) => {
    setToast({
      message: `Patient ${patientId.slice(0, 8)}... successfully created!`,
      type: 'success',
    });
    setCurrentView('dashboard');
  };

  const handleStartAssessment = () => {
    setCurrentView('intake');
    setToast(null);
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
    setToast(null);
  };

  const handleCancelAssessment = () => {
    setCurrentView('dashboard');
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('patient-detail');
    setToast(null);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedPatientId(null);
    setToast(null);
  };

  const handlePatientUpdate = (patientId: string, _updates: unknown) => {
    setToast({
      message: `Patient ${patientId.slice(0, 8)}... successfully updated!`,
      type: 'success',
    });
  };

  const handlePatientDelete = (patientId: string) => {
    setToast({
      message: `Patient ${patientId.slice(0, 8)}... successfully deleted!`,
      type: 'success',
    });
    setCurrentView('dashboard');
    setSelectedPatientId(null);
  };

  const handleClosePatientDetail = () => {
    setCurrentView('dashboard');
    setSelectedPatientId(null);
  };

  return (
    <div class="min-h-screen bg-medical-background">
      {/* PWA Status Component */}
      {pwaInitialized && (
        <div class="fixed top-4 right-4 z-50">
          <PWAStatus />
        </div>
      )}

      {/* Navigation Header */}
      {currentView !== 'home' && (
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
                  ← TriageAid
                </Button>
                <span class="text-gray-300 hidden sm:inline">|</span>
                <span class="text-medical-text-primary font-medium text-sm sm:text-base truncate">
                  {currentView === 'dashboard' && 'Patient Dashboard'}
                  {currentView === 'intake' && 'Patient Assessment'}
                  {currentView === 'patient-detail' &&
                    `Patient Details${selectedPatientId ? ` - #${selectedPatientId.slice(0, 8).toUpperCase()}` : ''}`}
                </span>
              </div>

              {currentView === 'dashboard' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartAssessment}
                  className="shrink-0 ml-2"
                >
                  <span class="hidden sm:inline">+ New Assessment</span>
                  <span class="sm:hidden">+ New</span>
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
            onClose={() => setToast(null)}
          />
        )}

        {/* Home View */}
        {currentView === 'home' && (
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
                  TriageAid
                </h1>
                <p class="text-responsive-base text-medical-text-secondary mb-8 max-w-md mx-auto">
                  Offline medical triage assessment tool for emergency response
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleStartAssessment}
                    className="sm:flex-1"
                  >
                    Start Patient Assessment
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={handleViewDashboard}
                    className="sm:flex-1"
                  >
                    View Dashboard
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
                    START Protocol
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    Automated triage assessment
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
                    Offline Ready
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    Works without internet
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
                    Secure
                  </h3>
                  <p class="text-xs text-medical-text-secondary">
                    Encrypted local storage
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div class="animate-fade-in">
            <PatientDashboard onPatientSelect={handlePatientSelect} />
          </div>
        )}

        {/* Intake Form View */}
        {currentView === 'intake' && (
          <div class="animate-fade-in">
            <PatientIntakeForm
              onSubmit={handlePatientSubmit}
              onCancel={handleCancelAssessment}
            />
          </div>
        )}

        {/* Patient Detail View */}
        {currentView === 'patient-detail' && selectedPatientId && (
          <div class="animate-fade-in">
            <PatientDetailView
              patientId={selectedPatientId}
              onClose={handleClosePatientDetail}
              onPatientUpdate={handlePatientUpdate}
              onPatientDelete={handlePatientDelete}
            />
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
}
