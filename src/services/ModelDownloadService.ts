/**
 * Model Download Service
 * Handles downloading AI models with progress tracking, storage, and error recovery
 */

import type { StoredModel, VoiceLanguage } from '../types/VoiceRecognition';

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface ModelDownloadOptions {
  modelName: string;
  modelUrl: string;
  version: string;
  language: VoiceLanguage;
  expectedSize?: number;
  resumable?: boolean;
}

export interface DownloadState {
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: DownloadProgress;
  error?: string;
  resumeData?: {
    downloadedBytes: number;
    chunks: ArrayBuffer[];
  };
}

class ModelDownloadService {
  private downloads = new Map<string, DownloadState>();
  private abortControllers = new Map<string, AbortController>();
  private progressCallbacks = new Map<
    string,
    (progress: DownloadProgress) => void
  >();
  private readonly DB_NAME = 'TriageAI_Models';
  private readonly DB_VERSION = 1;
  // private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for resumable downloads - reserved for future use

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    try {
      await this.openDB();
    } catch (error) {
      console.error(
        'Failed to initialize ModelDownloadService database:',
        error
      );
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Models store
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }

        // Download cache store for resumable downloads
        if (!db.objectStoreNames.contains('download_cache')) {
          const cacheStore = db.createObjectStore('download_cache', {
            keyPath: 'modelId',
          });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async downloadModel(
    options: ModelDownloadOptions,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<StoredModel> {
    const modelId = `${options.modelName}-${options.version}`;

    // Check if already downloading
    if (
      this.downloads.has(modelId) &&
      this.downloads.get(modelId)?.status === 'downloading'
    ) {
      throw new Error(`Model ${modelId} is already being downloaded`);
    }

    // Check if model already exists
    const existingModel = await this.getStoredModel(modelId);
    if (existingModel) {
      throw new Error(`Model ${modelId} already exists`);
    }

    // Initialize download state
    const downloadState: DownloadState = {
      status: 'downloading',
      progress: {
        loaded: 0,
        total: options.expectedSize || 0,
        percentage: 0,
        speed: 0,
        timeRemaining: 0,
      },
    };

    this.downloads.set(modelId, downloadState);

    if (onProgress) {
      this.progressCallbacks.set(modelId, onProgress);
    }

    try {
      // Check for resumable download data
      const resumeData = await this.getResumeData(modelId);
      let startByte = 0;
      let existingChunks: ArrayBuffer[] = [];

      if (resumeData && options.resumable) {
        startByte = resumeData.downloadedBytes;
        existingChunks = resumeData.chunks;
        downloadState.progress.loaded = startByte;
        console.info(`Resuming download from byte ${startByte}`);
      }

      const modelData = await this.downloadWithResume(
        options.modelUrl,
        modelId,
        startByte,
        existingChunks
      );

      // Compress the model data
      const compressedData = await this.compressData(modelData);

      // Create stored model
      const storedModel: StoredModel = {
        id: modelId,
        name: options.modelName,
        version: options.version,
        language: options.language,
        size: modelData.byteLength,
        downloadDate: new Date(),
        modelData: compressedData,
        metadata: {
          accuracy: 0.85, // Default values - could be provided in options
          speed: 200,
          memoryUsage: modelData.byteLength,
        },
      };

      // Store the model
      await this.storeModel(storedModel);

      // Clean up download state and cache
      await this.cleanupDownload(modelId);

      downloadState.status = 'completed';
      downloadState.progress.percentage = 100;

      if (onProgress) {
        onProgress(downloadState.progress);
      }

      return storedModel;
    } catch (error) {
      downloadState.status = 'error';
      downloadState.error =
        error instanceof Error ? error.message : 'Unknown error';

      // Save resume data for potential retry
      if (options.resumable) {
        await this.saveResumeData(modelId, downloadState);
      }

      throw error;
    } finally {
      this.abortControllers.delete(modelId);
      this.progressCallbacks.delete(modelId);
    }
  }

  private async downloadWithResume(
    url: string,
    modelId: string,
    startByte: number,
    existingChunks: ArrayBuffer[]
  ): Promise<ArrayBuffer> {
    const abortController = new AbortController();
    this.abortControllers.set(modelId, abortController);

    const downloadState = this.downloads.get(modelId)!;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastLoadedBytes = startByte;

    try {
      // Create range request for resumable download
      const headers: Record<string, string> = {};
      if (startByte > 0) {
        headers['Range'] = `bytes=${startByte}-`;
      }

      const response = await fetch(url, {
        headers,
        signal: abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 416 && startByte > 0) {
          // Range not satisfiable - file might be complete
          throw new Error('Download already complete or invalid range');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength
        ? parseInt(contentLength, 10) + startByte
        : 0;

      if (totalSize > 0) {
        downloadState.progress.total = totalSize;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: ArrayBuffer[] = [...existingChunks];
      let downloadedBytes = startByte;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(
          value.buffer.slice(
            value.byteOffset,
            value.byteOffset + value.byteLength
          )
        );
        downloadedBytes += value.length;

        // Update progress
        const now = Date.now();
        const timeDiff = (now - lastProgressTime) / 1000;

        if (timeDiff >= 0.5) {
          // Update every 500ms
          const bytesDiff = downloadedBytes - lastLoadedBytes;
          const speed = bytesDiff / timeDiff;
          const timeRemaining =
            totalSize > 0 ? (totalSize - downloadedBytes) / speed : 0;

          downloadState.progress = {
            loaded: downloadedBytes,
            total: totalSize,
            percentage: totalSize > 0 ? (downloadedBytes / totalSize) * 100 : 0,
            speed,
            timeRemaining,
          };

          const callback = this.progressCallbacks.get(modelId);
          if (callback) {
            callback(downloadState.progress);
          }

          // Save resume data periodically
          await this.saveResumeData(modelId, {
            ...downloadState,
            resumeData: {
              downloadedBytes,
              chunks: chunks.slice(), // Create a copy
            },
          });

          lastProgressTime = now;
          lastLoadedBytes = downloadedBytes;
        }
      }

      // Combine all chunks into a single ArrayBuffer
      const totalLength = chunks.reduce(
        (sum, chunk) => sum + chunk.byteLength,
        0
      );
      const result = new ArrayBuffer(totalLength);
      const resultView = new Uint8Array(result);

      let offset = 0;
      for (const chunk of chunks) {
        resultView.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        downloadState.status = 'paused';
        throw new Error('Download was cancelled');
      }
      throw error;
    }
  }

  private async compressData(data: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Write data to compression stream
        writer.write(new Uint8Array(data));
        writer.close();

        // Read compressed data
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine chunks
        const totalLength = chunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0
        );
        const result = new ArrayBuffer(totalLength);
        const resultView = new Uint8Array(result);

        let offset = 0;
        for (const chunk of chunks) {
          resultView.set(chunk, offset);
          offset += chunk.length;
        }

        return result;
      } else {
        // Fallback: return uncompressed data
        console.warn(
          'CompressionStream not available, storing uncompressed model'
        );
        return data;
      }
    } catch (error) {
      console.warn('Compression failed, storing uncompressed model:', error);
      return data;
    }
  }

  private async decompressData(
    compressedData: ArrayBuffer
  ): Promise<ArrayBuffer> {
    try {
      // Use DecompressionStream if available
      if ('DecompressionStream' in window) {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        // Write compressed data to decompression stream
        writer.write(new Uint8Array(compressedData));
        writer.close();

        // Read decompressed data
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Combine chunks
        const totalLength = chunks.reduce(
          (sum, chunk) => sum + chunk.length,
          0
        );
        const result = new ArrayBuffer(totalLength);
        const resultView = new Uint8Array(result);

        let offset = 0;
        for (const chunk of chunks) {
          resultView.set(chunk, offset);
          offset += chunk.length;
        }

        return result;
      } else {
        // Data was stored uncompressed
        return compressedData;
      }
    } catch (error) {
      console.warn('Decompression failed, assuming uncompressed data:', error);
      return compressedData;
    }
  }

  async pauseDownload(modelId: string): Promise<void> {
    const abortController = this.abortControllers.get(modelId);
    if (abortController) {
      abortController.abort();
    }

    const downloadState = this.downloads.get(modelId);
    if (downloadState) {
      downloadState.status = 'paused';
    }
  }

  async resumeDownload(
    modelId: string,
    _onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    const downloadState = this.downloads.get(modelId);
    if (!downloadState || downloadState.status !== 'paused') {
      throw new Error('No paused download found for this model');
    }

    // This would require storing the original download options
    // For now, throw an error suggesting to restart the download
    throw new Error(
      'Resume functionality requires restarting the download with original options'
    );
  }

  async cancelDownload(modelId: string): Promise<void> {
    const abortController = this.abortControllers.get(modelId);
    if (abortController) {
      abortController.abort();
    }

    await this.cleanupDownload(modelId);
    this.downloads.delete(modelId);
    this.abortControllers.delete(modelId);
    this.progressCallbacks.delete(modelId);
  }

  async retryDownload(
    modelId: string,
    options: ModelDownloadOptions,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<StoredModel> {
    // Clean up any existing download state
    await this.cancelDownload(modelId);

    // Start fresh download
    return this.downloadModel(options, onProgress);
  }

  getDownloadStatus(modelId: string): DownloadState | null {
    return this.downloads.get(modelId) || null;
  }

  async getStoredModel(modelId: string): Promise<StoredModel | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');

      return new Promise((resolve, reject) => {
        const request = store.get(modelId);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Decompress model data when retrieving
            this.decompressData(result.modelData)
              .then(decompressedData => {
                resolve({
                  ...result,
                  modelData: decompressedData,
                });
              })
              .catch(reject);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error retrieving stored model:', error);
      return null;
    }
  }

  async listStoredModels(): Promise<StoredModel[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const models = request.result || [];
          // Note: We don't decompress data for listing, only metadata
          resolve(
            models.map(model => ({
              ...model,
              modelData: new ArrayBuffer(0), // Don't load full data for listing
            }))
          );
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error listing stored models:', error);
      return [];
    }
  }

  async deleteStoredModel(modelId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(modelId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Also clean up any download cache
      await this.cleanupDownload(modelId);
    } catch (error) {
      console.error('Error deleting stored model:', error);
      throw error;
    }
  }

  private async storeModel(model: StoredModel): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['models'], 'readwrite');
    const store = transaction.objectStore('models');

    return new Promise((resolve, reject) => {
      const request = store.put(model);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveResumeData(
    modelId: string,
    downloadState: DownloadState
  ): Promise<void> {
    if (!downloadState.resumeData) return;

    try {
      const db = await this.openDB();
      const transaction = db.transaction(['download_cache'], 'readwrite');
      const store = transaction.objectStore('download_cache');

      const cacheData = {
        modelId,
        downloadedBytes: downloadState.resumeData.downloadedBytes,
        chunks: downloadState.resumeData.chunks,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cacheData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to save resume data:', error);
    }
  }

  private async getResumeData(
    modelId: string
  ): Promise<{ downloadedBytes: number; chunks: ArrayBuffer[] } | null> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['download_cache'], 'readonly');
      const store = transaction.objectStore('download_cache');

      return new Promise((resolve, reject) => {
        const request = store.get(modelId);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            resolve({
              downloadedBytes: result.downloadedBytes,
              chunks: result.chunks,
            });
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get resume data:', error);
      return null;
    }
  }

  private async cleanupDownload(modelId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['download_cache'], 'readwrite');
      const store = transaction.objectStore('download_cache');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(modelId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to cleanup download cache:', error);
    }
  }

  async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        };
      }
    } catch (error) {
      console.warn('Storage estimation not available:', error);
    }

    return { used: 0, available: 0 };
  }

  async cleanupOldCache(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['download_cache'], 'readwrite');
      const store = transaction.objectStore('download_cache');
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - maxAge;
      const range = IDBKeyRange.upperBound(cutoffTime);

      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = event => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to cleanup old cache:', error);
    }
  }
}

// Export singleton instance
export const modelDownloadService = new ModelDownloadService();
export default modelDownloadService;
