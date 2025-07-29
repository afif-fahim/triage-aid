/**
 * Voice Settings Component
 * UI for managing voice AI preferences, model downloads, and configuration
 */

import { useState, useEffect } from 'preact/hooks';
import type {
  VoiceSettings,
  ModelStatus,
  ModelInfo,
} from '../types/VoiceRecognition';
import { voiceSettingsService } from '../services/VoiceSettingsService';
import { useTranslation } from '../hooks/useTranslation';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { ProgressBar } from './ui/ProgressBar';
import { Alert } from './ui/Alert';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface VoiceSettingsComponentProps {
  className?: string;
}

export function VoiceSettingsComponent({
  className = '',
}: VoiceSettingsComponentProps) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<VoiceSettings>(
    voiceSettingsService.getSettings()
  );
  const [modelStatus, setModelStatus] = useState<ModelStatus>(
    voiceSettingsService.getModelStatus()
  );
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(
    voiceSettingsService.getModelInfo()
  );
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<{
    used: number;
    available: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribeSettings =
      voiceSettingsService.onSettingsChange(setSettings);
    const unsubscribeModelStatus = voiceSettingsService.onModelStatusChange(
      status => {
        setModelStatus(status);
        setModelInfo(voiceSettingsService.getModelInfo());
        if (status !== 'downloading') {
          setIsDownloading(false);
          setDownloadProgress(0);
        }
      }
    );

    // Load storage usage
    loadStorageUsage();

    return () => {
      unsubscribeSettings();
      unsubscribeModelStatus();
    };
  }, []);

  const loadStorageUsage = async () => {
    try {
      const usage = await voiceSettingsService.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.warn('Failed to load storage usage:', error);
    }
  };

  const handleSettingChange = async (
    key: keyof VoiceSettings,
    value: unknown
  ) => {
    try {
      setError(null);
      await voiceSettingsService.updateSettings({ [key]: value });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update settings'
      );
    }
  };

  const handleDownloadModel = async () => {
    try {
      setError(null);
      setIsDownloading(true);
      setDownloadProgress(0);

      await voiceSettingsService.downloadModel(progress => {
        setDownloadProgress(progress);
      });

      await loadStorageUsage();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to download model'
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDeleteModel = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await voiceSettingsService.deleteModel();
      await loadStorageUsage();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete model'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      setError(null);
      await voiceSettingsService.resetSettings();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to reset settings'
      );
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getModelStatusText = (status: ModelStatus): string => {
    switch (status) {
      case 'not-downloaded':
        return t('voice.settings.modelNotDownloaded');
      case 'downloading':
        return t('voice.settings.modelDownloading');
      case 'ready':
        return t('voice.settings.modelReady');
      case 'error':
        return t('voice.settings.modelError');
      default:
        return t('voice.settings.modelUnknown');
    }
  };

  const getModelStatusColor = (
    status: ModelStatus
  ): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'downloading':
        return 'info';
      case 'error':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('voice.settings.general')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('voice.settings.enableVoiceAI')}
                </label>
                <p className="text-sm text-gray-500">
                  {t('voice.settings.enableVoiceAIDesc')}
                </p>
              </div>
              <Checkbox
                checked={settings.enabled}
                onChange={checked => handleSettingChange('enabled', checked)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('voice.settings.language')}
              </label>
              <Select
                value={settings.language}
                onChange={value =>
                  handleSettingChange('language', value as 'en' | 'ar')
                }
                disabled={!settings.enabled}
              >
                <option value="en">English</option>
                <option value="ar" disabled>
                  العربية (Coming Soon)
                </option>
              </Select>
              {settings.language === 'ar' && (
                <p className="text-sm text-amber-600 mt-1">
                  {t('voice.arabicSoon')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('voice.settings.sensitivity')}
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.sensitivity}
                  onChange={e =>
                    handleSettingChange(
                      'sensitivity',
                      parseFloat(e.currentTarget.value)
                    )
                  }
                  className="flex-1"
                  disabled={!settings.enabled}
                />
                <span className="text-sm text-gray-600 w-12">
                  {Math.round(settings.sensitivity * 100)}%
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('voice.settings.sensitivityDesc')}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('voice.settings.autoPopulate')}
                </label>
                <p className="text-sm text-gray-500">
                  {t('voice.settings.autoPopulateDesc')}
                </p>
              </div>
              <Checkbox
                checked={settings.autoPopulate}
                onChange={checked =>
                  handleSettingChange('autoPopulate', checked)
                }
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {t('voice.settings.downloadOnWifi')}
                </label>
                <p className="text-sm text-gray-500">
                  {t('voice.settings.downloadOnWifiDesc')}
                </p>
              </div>
              <Checkbox
                checked={settings.downloadOnWifi}
                onChange={checked =>
                  handleSettingChange('downloadOnWifi', checked)
                }
              />
            </div>
          </div>
        </div>
      </Card>

      {/* AI Model Management */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('voice.settings.aiModel')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {t('voice.settings.modelStatus')}
                </p>
                <p className="text-sm text-gray-500">
                  {getModelStatusText(modelStatus)}
                </p>
              </div>
              <Alert
                variant={getModelStatusColor(modelStatus)}
                className="px-3 py-1"
              >
                {getModelStatusText(modelStatus)}
              </Alert>
            </div>

            {modelInfo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('voice.settings.modelInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">
                      {t('voice.settings.modelName')}:
                    </span>
                    <span className="ml-2 text-gray-900">{modelInfo.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t('voice.settings.modelSize')}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {formatBytes(modelInfo.size)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t('voice.settings.modelVersion')}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {modelInfo.version}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      {t('voice.settings.downloadDate')}:
                    </span>
                    <span className="ml-2 text-gray-900">
                      {new Date(modelInfo.downloadDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isDownloading && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">
                    {t('voice.settings.downloading')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(downloadProgress)}%
                  </span>
                </div>
                <ProgressBar progress={downloadProgress} />
              </div>
            )}

            <div className="flex space-x-3">
              {modelStatus === 'not-downloaded' && (
                <Button
                  onClick={handleDownloadModel}
                  disabled={isDownloading || !settings.enabled}
                  className="flex items-center space-x-2"
                >
                  {isDownloading && <LoadingSpinner size="sm" />}
                  <span>{t('voice.settings.downloadModel')}</span>
                </Button>
              )}

              {modelStatus === 'ready' && (
                <Button
                  variant="outline"
                  onClick={handleDeleteModel}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading && <LoadingSpinner size="sm" />}
                  <span>{t('voice.settings.deleteModel')}</span>
                </Button>
              )}

              {modelStatus === 'error' && (
                <Button
                  onClick={handleDownloadModel}
                  disabled={isDownloading}
                  className="flex items-center space-x-2"
                >
                  {isDownloading && <LoadingSpinner size="sm" />}
                  <span>{t('voice.settings.retryDownload')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Storage Information */}
      {storageUsage && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('voice.settings.storage')}
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('voice.settings.storageUsed')}:
                </span>
                <span className="text-gray-900">
                  {formatBytes(storageUsage.used)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('voice.settings.storageAvailable')}:
                </span>
                <span className="text-gray-900">
                  {formatBytes(storageUsage.available)}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {t('voice.settings.storageUsage')}
                  </span>
                  <span className="text-gray-900">
                    {Math.round(
                      (storageUsage.used /
                        (storageUsage.used + storageUsage.available)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <ProgressBar
                  progress={
                    (storageUsage.used /
                      (storageUsage.used + storageUsage.available)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Reset Settings */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('voice.settings.reset')}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('voice.settings.resetDesc')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetSettings}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              {t('voice.settings.resetSettings')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
