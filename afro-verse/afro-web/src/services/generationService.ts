import { apiClient } from './apiClient';

/**
 * Generation Service (Frontend)
 * 
 * Handles AI image generation API calls.
 */

export interface CreateGenerationRequest {
  prompt: string;
  preset?: string;
  selfieBase64?: string;
  aspectRatio?: '1:1' | '9:16';
  quality?: 'standard' | 'high';
}

export interface Generation {
  generationId: string;
  status: 'preparing' | 'generating' | 'finalizing' | 'complete' | 'failed';
  imageUrl?: string;
  thumbnailUrl?: string;
  placement?: string[];
  message?: string;
  error?: string;
  progress?: number;
  createdAt?: string;
  completedAt?: string;
}

export interface GenerationListResponse {
  generations: Generation[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Create a new AI generation
 */
export async function createGeneration(
  request: CreateGenerationRequest
): Promise<Generation> {
  const response = await apiClient.post('/generate', request);
  return response.data;
}

/**
 * Get generation by ID
 */
export async function getGeneration(generationId: string): Promise<Generation> {
  const response = await apiClient.get(`/generate/${generationId}`);
  return response.data;
}

/**
 * Get user's generations
 */
export async function getUserGenerations(
  page: number = 1,
  limit: number = 20
): Promise<GenerationListResponse> {
  const response = await apiClient.get('/generate', {
    params: { page, limit },
  });
  return response.data;
}

/**
 * Refine an existing generation
 */
export async function refineGeneration(
  generationId: string,
  refinementPrompt: string
): Promise<Generation> {
  const response = await apiClient.post(`/generate/${generationId}/refine`, {
    prompt: refinementPrompt,
  });
  return response.data;
}

/**
 * Poll generation status until complete
 * 
 * @param generationId - The generation ID to poll
 * @param onProgress - Callback for progress updates
 * @param maxAttempts - Maximum polling attempts (default: 60)
 * @param interval - Polling interval in ms (default: 2000)
 */
export async function pollGenerationStatus(
  generationId: string,
  onProgress?: (generation: Generation) => void,
  maxAttempts: number = 60,
  interval: number = 2000
): Promise<Generation> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const generation = await getGeneration(generationId);
    
    if (onProgress) {
      onProgress(generation);
    }
    
    if (generation.status === 'complete') {
      return generation;
    }
    
    if (generation.status === 'failed') {
      throw new Error(generation.error || 'Generation failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  throw new Error('Generation timed out');
}

/**
 * Helper: Convert image file to base64
 */
export async function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
    };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }
  
  return { valid: true };
}



