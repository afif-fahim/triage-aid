import { useState, useEffect } from 'preact/hooks';
import { pwaService, PWAUpdateInfo } from '../services/PWAService';
import { useTranslation } from '../hooks';
import { Button, Card } from './ui';

interface AppUpdateNotificationProps {
  className?: string;
}

export function AppUpdateNotification({
  className = '',
}: AppUpdateNotificationProps) {
  const { t } = useTranslation();
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo>({
    available: false,
    waiting: false,
  });
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    // Subscribe to update notifications
    const unsubscribe = pwaService.onUpdate(info => {
      setUpdateInfo(info);
      if (info.available && info.waiting) {
        setShowNotification(true);
      }
    });

    // Get current version
    pwaService.getVersion().then(setVersion);

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo.waiting) return;

    setIsUpdating(true);
    try {
      await pwaService.applyUpdate();
      // The page will reload automatically after update
    } catch (error) {
      console.error('Failed to apply update:', error);
      setIsUpdating(false);
      // Show error message
      setShowNotification(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!showNotification || !updateInfo.available) {
    return null;
  }

  return (
    <div className={`app-update-notification ${className}`}>
      <Card
        variant="elevated"
        padding="md"
        className="update-notification-card"
      >
        <div className="flex items-start gap-3">
          <div className="update-icon">
            <svg
              className="w-6 h-6 text-medical-success animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-medical-text-primary mb-1">
              {t('pwa.updateAvailable', 'Update Available')}
            </h3>
            <p className="text-xs text-medical-text-secondary mb-3 leading-relaxed">
              {t(
                'pwa.updateDescription',
                'A new version of TriageAid is ready with improvements and bug fixes.'
              )}
            </p>

            {version && (
              <p className="text-xs text-medical-text-secondary mb-3 opacity-75">
                {t('pwa.currentVersion', 'Current version')}: {version}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating
                  ? t('pwa.updating', 'Updating...')
                  : t('pwa.updateNow', 'Update Now')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-xs text-medical-text-secondary"
              >
                {t('pwa.refresh', 'Refresh')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs text-medical-text-secondary"
              >
                {t('pwa.later', 'Later')}
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
        .app-update-notification {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 60;
          animation: slideIn 0.3s ease-out;
          max-width: 350px;
        }

        .update-notification-card {
          border: 1px solid #10b981;
          background: #f0fdf4;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);
        }

        .update-icon {
          flex-shrink: 0;
          width: 2rem;
          height: 2rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .app-update-notification {
            left: 1rem;
            right: 1rem;
            max-width: none;
          }
        }

        @media (max-width: 480px) {
          .app-update-notification {
            left: 0.5rem;
            right: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
