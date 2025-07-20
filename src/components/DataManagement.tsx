/**
 * Data Management Component
 * Provides bulk operations and data export/import functionality
 */

import { useState, useEffect } from 'preact/hooks';
import { dataService } from '../services/DataService';
import { errorHandlingService } from '../services/ErrorHandlingService';
import { useTranslation } from '../hooks';
import type { PatientData } from '../types';
import {
  Card,
  Button,
  Modal,
  Checkbox,
  Select,
  FileInput,
  ProgressBar,
  Alert,
} from './ui';

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

interface StorageStats {
  totalPatients: number;
  storageUsed: number;
  patientsByStatus: Record<string, number>;
  patientsByPriority: Record<string, number>;
}

export function DataManagement({
  isOpen,
  onClose,
  onDataChanged,
}: DataManagementProps) {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [importProgress, setImportProgress] = useState<{
    show: boolean;
    progress: number;
    message: string;
  }>({ show: false, progress: 0, message: '' });

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patientsData, stats] = await Promise.all([
        dataService.getAllPatients(),
        dataService.getStorageStats(),
      ]);
      setPatients(patientsData);
      setStorageStats(stats);
    } catch (error) {
      errorHandlingService.handleError({
        type: 'data',
        code: 'DATA_LOAD_FAILED',
        message: 'Failed to load data management information',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatients(new Set(patients.map(p => p.id)));
    } else {
      setSelectedPatients(new Set());
    }
  };

  const handleSelectPatient = (patientId: string, checked: boolean) => {
    const newSelected = new Set(selectedPatients);
    if (checked) {
      newSelected.add(patientId);
    } else {
      newSelected.delete(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: PatientData['status']) => {
    if (selectedPatients.size === 0) return;

    setLoading(true);
    try {
      const result = await dataService.bulkUpdatePatientStatus(
        Array.from(selectedPatients),
        newStatus
      );

      if (result.errors.length > 0) {
        errorHandlingService.showToast(
          `Updated ${result.updated} patients. ${result.errors.length} errors occurred.`,
          'warning'
        );
      } else {
        errorHandlingService.showToast(
          `Successfully updated ${result.updated} patients to ${newStatus}`,
          'success'
        );
      }

      setSelectedPatients(new Set());
      await loadData();
      onDataChanged();
    } catch (error) {
      errorHandlingService.handleError({
        type: 'data',
        code: 'BULK_UPDATE_FAILED',
        message: 'Failed to update patient status',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPatients.size === 0) return;

    setLoading(true);
    try {
      const result = await dataService.bulkDeletePatients(
        Array.from(selectedPatients)
      );

      if (result.errors.length > 0) {
        errorHandlingService.showToast(
          `Deleted ${result.deleted} patients. ${result.errors.length} errors occurred.`,
          'warning'
        );
      } else {
        errorHandlingService.showToast(
          `Successfully deleted ${result.deleted} patients`,
          'success'
        );
      }

      setSelectedPatients(new Set());
      await loadData();
      onDataChanged();
    } catch (error) {
      errorHandlingService.handleError({
        type: 'data',
        code: 'BULK_DELETE_FAILED',
        message: 'Failed to delete patients',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    setLoading(true);
    try {
      const exportData = await dataService.exportData();
      downloadFile(
        exportData,
        `triage-backup-${new Date().toISOString().split('T')[0]}.json`
      );
      errorHandlingService.showToast('Data exported successfully', 'success');
    } catch (error) {
      errorHandlingService.handleError({
        type: 'data',
        code: 'EXPORT_FAILED',
        message: 'Failed to export data',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedPatients.size === 0) return;

    setLoading(true);
    try {
      const exportData = await dataService.bulkExportPatients(
        Array.from(selectedPatients)
      );
      downloadFile(
        exportData,
        `triage-selected-${selectedPatients.size}-patients-${new Date().toISOString().split('T')[0]}.json`
      );
      errorHandlingService.showToast(
        `Exported ${selectedPatients.size} patients successfully`,
        'success'
      );
    } catch (error) {
      errorHandlingService.handleError({
        type: 'data',
        code: 'EXPORT_SELECTED_FAILED',
        message: 'Failed to export selected patients',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (file: File) => {
    setImportProgress({ show: true, progress: 0, message: 'Reading file...' });

    try {
      const fileContent = await readFileAsText(file);

      setImportProgress({
        show: true,
        progress: 25,
        message: 'Validating data...',
      });

      // Validate JSON format
      JSON.parse(fileContent);

      setImportProgress({
        show: true,
        progress: 50,
        message: 'Importing patients...',
      });

      const result = await dataService.importData(fileContent);

      setImportProgress({
        show: true,
        progress: 100,
        message: 'Import complete!',
      });

      setTimeout(() => {
        setImportProgress({ show: false, progress: 0, message: '' });

        if (result.errors.length > 0) {
          errorHandlingService.showToast(
            `Imported ${result.imported} patients. ${result.errors.length} errors occurred.`,
            'warning'
          );
        } else {
          errorHandlingService.showToast(
            `Successfully imported ${result.imported} patients`,
            'success'
          );
        }

        loadData();
        onDataChanged();
      }, 1000);
    } catch (error) {
      setImportProgress({ show: false, progress: 0, message: '' });
      errorHandlingService.handleError({
        type: 'data',
        code: 'IMPORT_FAILED',
        message: 'Failed to import data',
        details: error,
        timestamp: new Date(),
        recoverable: true,
      });
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getPriorityColor = (level: string): string => {
    switch (level) {
      case 'red':
        return 'text-red-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'green':
        return 'text-green-600';
      case 'black':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('dataManagement.title')}
      size="xl"
    >
      <div class="space-y-6">
        {/* Storage Statistics */}
        {storageStats && (
          <Card variant="outlined" padding="md">
            <h3 class="text-lg font-semibold text-medical-text-primary mb-4">
              {t('dataManagement.storageStats')}
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-medical-primary">
                  {storageStats.totalPatients}
                </div>
                <div class="text-sm text-medical-text-secondary">
                  {t('dataManagement.totalPatients')}
                </div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-medical-accent">
                  {formatBytes(storageStats.storageUsed)}
                </div>
                <div class="text-sm text-medical-text-secondary">
                  {t('dataManagement.storageUsed')}
                </div>
              </div>
              <div class="text-center">
                <div class="text-lg font-semibold text-medical-success">
                  {storageStats.patientsByStatus.active || 0}
                </div>
                <div class="text-sm text-medical-text-secondary">
                  {t('dataManagement.activePatients')}
                </div>
              </div>
              <div class="text-center">
                <div class="text-lg font-semibold text-medical-warning">
                  {storageStats.patientsByStatus.treated || 0}
                </div>
                <div class="text-sm text-medical-text-secondary">
                  {t('dataManagement.treatedPatients')}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Import Progress */}
        {importProgress.show && (
          <Alert variant="info">
            <div class="space-y-2">
              <div class="text-sm font-medium">{importProgress.message}</div>
              <ProgressBar progress={importProgress.progress} />
            </div>
          </Alert>
        )}

        {/* Data Import/Export */}
        <Card variant="outlined" padding="md">
          <h3 class="text-lg font-semibold text-medical-text-primary mb-4">
            {t('dataManagement.backupRestore')}
          </h3>
          <div class="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={handleExportAll}
              disabled={loading || patients.length === 0}
              className="flex-1"
            >
              {t('dataManagement.exportAll')}
            </Button>
            <FileInput
              accept=".json"
              onChange={file => file && handleImportData(file)}
              disabled={loading}
              className="flex-1"
            >
              {t('dataManagement.importData')}
            </FileInput>
          </div>
          <div class="mt-2 text-xs text-medical-text-secondary">
            {t('dataManagement.backupNote')}
          </div>
        </Card>

        {/* Bulk Operations */}
        {patients.length > 0 && (
          <Card variant="outlined" padding="md">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-medical-text-primary">
                {t('dataManagement.bulkOperations')}
              </h3>
              <div class="flex items-center gap-4">
                <Checkbox
                  checked={selectedPatients.size === patients.length}
                  indeterminate={
                    selectedPatients.size > 0 &&
                    selectedPatients.size < patients.length
                  }
                  onChange={handleSelectAll}
                  label={t('dataManagement.selectAll')}
                />
                <span class="text-sm text-medical-text-secondary">
                  {selectedPatients.size} {t('dataManagement.selected')}
                </span>
              </div>
            </div>

            {/* Bulk Action Buttons */}
            {selectedPatients.size > 0 && (
              <div class="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <Select
                  value=""
                  onChange={value =>
                    value &&
                    handleBulkStatusUpdate(value as PatientData['status'])
                  }
                  disabled={loading}
                  placeholder={t('dataManagement.updateStatus')}
                  className="min-w-40"
                >
                  <option value="treated">{t('status.treated')}</option>
                  <option value="transferred">{t('status.transferred')}</option>
                  <option value="discharged">{t('status.discharged')}</option>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleExportSelected}
                  disabled={loading}
                  size="sm"
                >
                  {t('dataManagement.exportSelected')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  disabled={loading}
                  size="sm"
                >
                  {t('dataManagement.deleteSelected')}
                </Button>
              </div>
            )}

            {/* Patient List */}
            <div class="max-h-96 overflow-y-auto">
              <div class="space-y-2">
                {patients.map(patient => (
                  <div
                    key={patient.id}
                    class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedPatients.has(patient.id)}
                      onChange={checked =>
                        handleSelectPatient(patient.id, checked)
                      }
                    />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-medium">
                          #{patient.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          class={`text-sm font-medium ${getPriorityColor(patient.priority.level)}`}
                        >
                          {patient.priority.level.toUpperCase()}
                        </span>
                        <span class="text-sm text-medical-text-secondary">
                          {t(`status.${patient.status}`)}
                        </span>
                      </div>
                      <div class="text-xs text-medical-text-secondary">
                        {patient.timestamp.toLocaleDateString()} •{' '}
                        {patient.ageGroup}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div class="text-center py-4">
            <div class="text-medical-text-secondary">
              {t('common.loading')}...
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
