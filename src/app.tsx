import './app.css';

export function App() {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
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
            <p class="text-lg text-gray-600">
              Offline medical triage assessment tool
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
