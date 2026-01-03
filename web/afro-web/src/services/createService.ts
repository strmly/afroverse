import { apiClient } from './apiClient';

/**
 * Create Service (Frontend)
 * 
 * Handles AI generation API calls.
 */

export interface Generation {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  mode: 'preset' | 'prompt' | 'try_style';
  versions: GenerationVersion[];
  timing?: {
    estimatedTotalMs: number;
    elapsedMs: number;
    remainingMs: number;
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerationVersion {
  versionId: string;
  imageUrl: string;
  thumbUrl: string;
  createdAt: string;
}

export interface CreateGenerationInput {
  selfieIds: string[];
  mode: 'preset' | 'prompt' | 'try_style';
  seedPostId?: string;
  presetId?: string;
  prompt?: string;
  negativePrompt?: string;
  aspect?: '1:1' | '9:16';
  quality?: 'standard' | 'high';
}

export interface CreateGenerationResponse {
  generationId: string;
  status: string;
  estimatedTimeMs?: number;
  message: string;
}

/**
 * Create new generation
 */
export async function createGeneration(
  input: CreateGenerationInput
): Promise<CreateGenerationResponse> {
  const response = await apiClient.post('/generate', input);
  return response.data;
}

/**
 * Refine existing generation
 */
export async function refineGeneration(
  generationId: string,
  instruction: string
): Promise<CreateGenerationResponse> {
  const response = await apiClient.post(`/generate/${generationId}/refine`, {
    instruction,
  });
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
  limit: number = 20,
  before?: Date
): Promise<{ generations: Generation[] }> {
  const params: any = { limit };
  if (before) {
    params.before = before.toISOString();
  }
  
  const response = await apiClient.get('/generate', { params });
  return response.data;
}

/**
 * Poll generation until complete
 * 
 * Returns promise that resolves when generation succeeds or fails.
 */
export async function pollGeneration(
  generationId: string,
  onProgress?: (generation: Generation) => void,
  maxAttempts: number = 60,
  interval: number = 2000
): Promise<Generation> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const generation = await getGeneration(generationId);
    
    // Notify progress
    if (onProgress) {
      onProgress(generation);
    }
    
    // Check if complete
    if (generation.status === 'succeeded' || generation.status === 'failed') {
      return generation;
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  throw new Error('Generation timeout');
}



