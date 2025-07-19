import { useState } from 'preact/hooks';
import './app.css';
import {
  PatientIntakeForm,
  PatientDashboard,
  PatientDetailView,
} from './components';

type AppView = 'home' | 'dashboard' | 'intake' | 'patient-detail';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePatientSubmit = (patientId: string) => {
    setSuccessMessage(
      `Patient ${patientId.slice(0, 8)}... successfully created!`
    );
    setCurrentView('dashboard');

    // Clear success message after 5 seconds
    window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleStartAssessment = () => {
    setCurrentView('intake');
    setSuccessMessage(null);
  };

  const handleViewDashboard = () => {
    setCurrentView('dashboard');
    setSuccessMessage(null);
  };

  const handleCancelAssessment = () => {
    setCurrentView('dashboard');
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCurrentView('patient-detail');
    setSuccessMessage(null);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedPatientId(null);
    setSuccessMessage(null);
  };

  const handlePatientUpdate = (patientId: string, _updates: unknown) => {
    setSuccessMessage(
      `Patient ${patientId.slice(0, 8)}... successfully updated!`
    );

    // Clear success message after 5 seconds
    window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handlePatientDelete = (patientId: string) => {
    setSuccessMessage(
      `Patient ${patientId.slice(0, 8)}... successfully deleted!`
    );
    setCurrentView('dashboard');
    setSelectedPatientId(null);

    // Clear success message after 5 seconds
    window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleClosePatientDetail = () => {
    setCurrentView('dashboard');
    setSelectedPatientId(null);
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      {currentView !== 'home' && (
        <nav class="bg-white shadow-sm border-b border-gray-200">
          <div class="container mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button
                  onClick={handleBackToHome}
                  class="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  ← TriageAid
                </button>
                <span class="text-gray-300">|</span>
                <span class="text-gray-700 font-medium">
                  {currentView === 'dashboard' && 'Patient Dashboard'}
                  {currentView === 'intake' && 'Patient Assessment'}
                  {currentView === 'patient-detail' &&
                    `Patient Details${selectedPatientId ? ` - #${selectedPatientId.slice(0, 8).toUpperCase()}` : ''}`}
                </span>
              </div>

              {currentView === 'dashboard' && (
                <button
                  onClick={handleStartAssessment}
                  class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  + New Assessment
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      <div class="container mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p class="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Home View */}
        {currentView === 'home' && (
          <div class="text-center">
            <div class="mb-8">
              <svg
                class="logo mx-auto mb-4"
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
              <h1 class="text-4xl font-bold text-gray-900 mb-2">TriageAid</h1>
              <p class="text-lg text-gray-600 mb-8">
                Offline medical triage assessment tool
              </p>

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStartAssessment}
                  class="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Start Patient Assessment
                </button>
                <button
                  onClick={handleViewDashboard}
                  class="bg-gray-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  View Patient Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <PatientDashboard onPatientSelect={handlePatientSelect} />
        )}

        {/* Intake Form View */}
        {currentView === 'intake' && (
          <PatientIntakeForm
            onSubmit={handlePatientSubmit}
            onCancel={handleCancelAssessment}
          />
        )}

        {/* Patient Detail View */}
        {currentView === 'patient-detail' && selectedPatientId && (
          <PatientDetailView
            patientId={selectedPatientId}
            onClose={handleClosePatientDetail}
            onPatientUpdate={handlePatientUpdate}
            onPatientDelete={handlePatientDelete}
          />
        )}
      </div>
    </div>
  );
}
