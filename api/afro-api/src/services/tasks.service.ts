import { CloudTasksClient } from '@google-cloud/tasks';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Tasks Service
 * 
 * Manages Cloud Tasks for async generation processing.
 * In development mode, processes tasks immediately (no Cloud Tasks needed).
 */

const tasksClient = env.GCS_PROJECT_ID && env.NODE_ENV === 'production'
  ? new CloudTasksClient()
  : null;

const QUEUE_NAME = 'generation-queue';
const WORKER_URL = env.WORKER_URL || 'http://localhost:3001/worker/process-generation';

export interface GenerationTaskPayload {
  generationId: string;
  type: 'initial' | 'refine';
  requestedVersionId: string;
  refine?: {
    baseVersionId: string;
    instruction: string;
  };
}

/**
 * Enqueue generation task
 */
export async function enqueueGenerationTask(
  payload: GenerationTaskPayload
): Promise<void> {
  // Development mode: process immediately
  if (env.NODE_ENV === 'development' || !tasksClient) {
    logger.info('Development mode: processing task immediately', payload);
    
    // Import here to avoid circular dependency
    const { processGeneration } = require('./generation.service');
    
    // Process async (don't wait)
    setImmediate(async () => {
      try {
        await processGeneration(payload);
      } catch (error) {
        logger.error('Failed to process generation immediately', error);
      }
    });
    
    return;
  }
  
  // Production mode: enqueue to Cloud Tasks
  try {
    const project = env.GCS_PROJECT_ID!;
    const location = env.GCP_REGION || 'us-central1';
    const queue = QUEUE_NAME;
    
    const parent = tasksClient.queuePath(project, location, queue);
    
    const task = {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: WORKER_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    };
    
    const [response] = await tasksClient.createTask({ parent, task });
    
    logger.info('Task enqueued', {
      taskName: response.name,
      generationId: payload.generationId,
    });
  } catch (error: any) {
    logger.error('Failed to enqueue task', {
      error: error.message,
      payload,
    });
    throw error;
  }
}

/**
 * Check if tasks are configured
 */
export function isTasksConfigured(): boolean {
  return !!(tasksClient && env.GCS_PROJECT_ID);
}







