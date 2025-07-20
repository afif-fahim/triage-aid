import { useState, useEffect } from 'preact/hooks';
import { pwaService } from '../services/PWAService';
import { useTranslation } from '../hooks';
import { Button, Card } from './ui';

interface PWAInstallBannerProps {
  className?: string;
}

export function PWAInstallBanner({ className = '' }: PWAInstallBannerProps) {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Check if already installed
    if (pwaService.isInstalled()) {
      return;
    }

    // Check if user has dismissed the banner recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed =
        (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show for 7 days after dismissal
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show banner after a delay if conditions are met
    const timer = window.setTimeout(() => {
      if (!pwaService.isInstalled() && !dismissed) {
        setShowBanner(true);
      }
    }, 10000); // Show after 10 seconds

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the install prompt
      setShowBanner(false);
      return;
    }

    setIsInstalling(true);
    try {
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;

      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      } else {
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={`pwa-install-banner ${className}`}>
      <Card variant="elevated" padding="md" className="install-banner-card">
        <div className="flex items-start gap-3">
          <div className="install-icon">
            <svg
              className="w-8 h-8 text-medical-primary"
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

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-medical-text-primary mb-1">
              {t('pwa.installTitle', 'Install TriageAid')}
            </h3>
            <p className="text-xs text-medical-text-secondary mb-3 leading-relaxed">
              {t(
                'pwa.installDescription',
                'Get quick access and work offline by installing the app on your device.'
              )}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="text-xs"
              >
                {isInstalling
                  ? t('pwa.installing', 'Installing...')
                  : t('pwa.install', 'Install')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs text-medical-text-secondary"
              >
                {t('pwa.notNow', 'Not now')}
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-medical-text-secondary hover:text-medical-text-primary p-1 -m-1"
            aria-label={t('common.close', 'Close')}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </Card>

      <style jsx>{`
        .pwa-install-banner {
          position: fixed;
          bottom: 1rem;
          left: 1rem;
          right: 1rem;
          z-index: 50;
          animation: slideUp 0.3s ease-out;
        }

        .install-banner-card {
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .install-icon {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          background: rgba(30, 64, 175, 0.1);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (min-width: 640px) {
          .pwa-install-banner {
            left: auto;
            right: 1rem;
            max-width: 320px;
          }
        }

        @media (max-width: 480px) {
          .pwa-install-banner {
            left: 0.5rem;
            right: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
