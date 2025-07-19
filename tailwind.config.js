/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical triage priority colors
        triage: {
          red: '#DC2626',      // Immediate - Life threatening
          yellow: '#D97706',   // Urgent/Delayed - Serious injuries
          green: '#059669',    // Minor - Can wait
          black: '#374151',    // Deceased/Expectant
        },
        // Medical-appropriate soft color palette
        medical: {
          primary: '#1E40AF',    // Professional blue
          secondary: '#6B7280',  // Neutral gray
          accent: '#0891B2',     // Calming teal
          background: '#F9FAFB', // Soft white
          surface: '#FFFFFF',    // Pure white
          text: {
            primary: '#111827',   // Dark gray
            secondary: '#6B7280', // Medium gray
            muted: '#9CA3AF',     // Light gray
          },
          success: '#10B981',    // Success green
          warning: '#F59E0B',    // Warning amber
          error: '#EF4444',      // Error red
          info: '#3B82F6',       // Info blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
