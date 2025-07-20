import { render } from 'preact';
import './index.css';
import { App } from './app.tsx';
import { i18nService } from './services/I18nService';

// Initialize services and render app
async function initializeApp() {
  try {
    // Initialize i18n service first
    await i18nService.initialize();

    // Router service initializes automatically when imported in App component

    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.info('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.info('SW registration failed: ', registrationError);
          });
      });
    }

    // Render the app
    const appElement = document.getElementById('app');
    if (appElement) {
      render(<App />, appElement);
    } else {
      console.error('Could not find app element');
    }
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Render app anyway with fallback
    const appElement = document.getElementById('app');
    if (appElement) {
      render(<App />, appElement);
    }
  }
}

initializeApp();
