import { render } from 'preact';
import './index.css';
import { App } from './app.tsx';

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.info('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.info('SW registration failed: ', registrationError);
      });
  });
}

const appElement = document.getElementById('app');
if (appElement) {
  render(<App />, appElement);
} else {
  console.error('Could not find app element');
}
