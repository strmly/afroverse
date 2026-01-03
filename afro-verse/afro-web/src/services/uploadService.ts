import { apiClient } from './apiClient';
import axios from 'axios';

/**
 * Upload Service (Frontend)
 * 
 * Handles selfie upload pipeline with GCS signed URLs.
 */

export interface SelfieMetadata {
  id: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  status: string;
  createdAt: string;
}

export interface InitUploadResponse {
  selfieId: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface CompleteUploadResponse {
  status: string;
  selfie: SelfieMetadata;
}

/**
 * Get image dimensions and size from file
 */
export function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        sizeBytes: file.size,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Initialize selfie upload
 */
export async function initSelfieUpload(mimeType: string): Promise<InitUploadResponse> {
  try {
    const response = await apiClient.post('/media/selfies/init', {
      mimeType,
    });
    
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    console.error('Init upload error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      mimeType,
      fullError: error,
    });
    
    // Throw a more descriptive error with backend message
    const backendMessage = error.response?.data?.message;
    const backendError = error.response?.data?.error;
    const errorMessage = backendMessage || error.message || 'Failed to initialize upload';
    
    // Include backend error code if available
    const fullErrorMessage = backendError 
      ? `${errorMessage} (${backendError})`
      : errorMessage;
    
    throw new Error(fullErrorMessage);
  }
}

/**
 * Upload file to GCS using signed URL
 */
export async function uploadToGCS(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Use axios directly (not apiClient) for GCS upload
  await axios.put(uploadUrl, file, {
    headers,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    },
  });
}

/**
 * Complete selfie upload
 */
export async function completeSelfieUpload(
  selfieId: string,
  metadata: {
    width: number;
    height: number;
    sizeBytes: number;
  }
): Promise<CompleteUploadResponse> {
  const response = await apiClient.post('/media/selfies/complete', {
    selfieId,
    ...metadata,
  });
  
  return response.data;
}

/**
 * Upload selfie via proxy (server-side upload to avoid CORS)
 */
export async function uploadSelfieProxy(
  file: File,
  onProgress?: (progress: number) => void
): Promise<SelfieMetadata> {
  try {
    // Validate file size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 8MB.');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    onProgress?.(10);

    // Upload via proxy endpoint
    const response = await apiClient.post('/media/selfies/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    onProgress?.(100);

    return response.data.selfie;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to upload selfie';
    throw new Error(errorMessage);
  }
}

/**
 * Upload selfie (full flow - uses proxy to avoid CORS)
 */
export async function uploadSelfie(
  file: File,
  onProgress?: (progress: number) => void
): Promise<SelfieMetadata> {
  // Use proxy upload to avoid CORS issues
  return uploadSelfieProxy(file, onProgress);
}

/**
 * Get user selfies
 */
export async function getSelfies(): Promise<SelfieMetadata[]> {
  const response = await apiClient.get('/media/selfies');
  return response.data.selfies;
}

/**
 * Delete selfie
 */
export async function deleteSelfie(selfieId: string): Promise<void> {
  await apiClient.delete(`/media/selfies/${selfieId}`);
}





