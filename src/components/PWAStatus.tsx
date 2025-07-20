import { useState, useEffect } from 'preact/hooks';
import {
  pwaService,
  PWAStatus as PWAStatusType,
  PWAUpdateInfo,
} from '../services/PWAService';

interface PWAStatusProps {
  className?: string;
}

export function PWAStatus({ className = '' }: PWAStatusProps) {
  const [status, setStatus] = useState<PWAStatusType>(pwaService.getStatus());
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo>({
    available: false,
    waiting: false,
  });
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribeStatus = pwaService.onStatusChange(setStatus);
    const unsubscribeUpdate = pwaService.onUpdate(info => {
      setUpdateInfo(info);
      if (info.available) {
        setShowUpdatePrompt(true);
      }
    });

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribeStatus();
      unsubscribeUpdate();
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleApplyUpdate = async () => {
    if (!updateInfo.waiting) return;

    setIsUpdating(true);
    try {
      await pwaService.applyUpdate();
      setShowUpdatePrompt(false);
    } catch (error) {
      console.error('Failed to apply update:', error);
      setIsUpdating(false);
    }
  };

  const handleInstallApp = async () => {
    const installed = await pwaService.showInstallPrompt();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
  };

  return (
    <div className={`pwa-status ${className}`}>
      {/* Update Available Prompt */}
      {showUpdatePrompt && (
        <div className="update-prompt">
          <div className="update-content">
            <div className="update-icon">🔄</div>
            <div className="update-text">
              <h3>Update Available</h3>
              <p>A new version of TriageAid is ready to install.</p>
            </div>
            <div className="update-actions">
              <button
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="btn btn-primary btn-sm"
              >
                {isUpdating ? 'Updating...' : 'Update Now'}
              </button>
              <button
                onClick={handleDismissUpdate}
                className="btn btn-secondary btn-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install App Prompt */}
      {showInstallPrompt && !status.isInstalled && (
        <div className="install-prompt">
          <div className="install-content">
            <div className="install-icon">📱</div>
            <div className="install-text">
              <h3>Install TriageAid</h3>
              <p>
                Install the app for quick access and better offline experience.
              </p>
            </div>
            <div className="install-actions">
              <button
                onClick={handleInstallApp}
                className="btn btn-primary btn-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismissInstall}
                className="btn btn-secondary btn-sm"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .pwa-status {
          position: relative;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .update-prompt,
        .install-prompt {
          position: fixed;
          top: 1rem;
          right: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          max-width: 320px;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
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

        .update-content,
        .install-content {
          padding: 1rem;
        }

        .update-icon,
        .install-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .update-text h3,
        .install-text h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .update-text p,
        .install-text p {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .update-actions,
        .install-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
        }

        .btn-primary {
          background: #1e40af;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        @media (max-width: 640px) {
          .update-prompt,
          .install-prompt {
            left: 1rem;
            right: 1rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
