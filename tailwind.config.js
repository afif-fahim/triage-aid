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
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    // RTL support plugin - Updated for v4 compatibility
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        '.rtl .rtl\\:text-right': {
          'text-align': 'right',
        },
        '.rtl .rtl\\:text-left': {
          'text-align': 'left',
        },
        '.rtl .rtl\\:ml-auto': {
          'margin-left': 'auto',
        },
        '.rtl .rtl\\:mr-auto': {
          'margin-right': 'auto',
        },
        '.rtl .rtl\\:pl-4': {
          'padding-left': '1rem',
        },
        '.rtl .rtl\\:pr-4': {
          'padding-right': '1rem',
        },
        '.rtl .rtl\\:flex-row-reverse': {
          'flex-direction': 'row-reverse',
        },
        '.rtl .rtl\\:space-x-reverse > :not([hidden]) ~ :not([hidden])': {
          '--tw-space-x-reverse': '1',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
