/**
 * Settings Modal Component
 * Modal for accessing various app settings including voice AI configuration
 */

import { useState } from 'preact/hooks';
import { useTranslation } from '../hooks/useTranslation';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { VoiceSettingsComponent } from './VoiceSettingsComponent';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'voice' | 'general';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('voice');

  const tabs = [
    { id: 'voice' as const, label: t('settings.tabs.voice'), icon: '🎤' },
    { id: 'general' as const, label: t('settings.tabs.general'), icon: '⚙️' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.title')}
      size="lg"
      className="max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'voice' && <VoiceSettingsComponent />}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {t('settings.generalComingSoon')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
