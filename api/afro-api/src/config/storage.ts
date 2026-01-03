import { Storage } from '@google-cloud/storage';
import { env } from './env';
import { logger } from '../utils/logger';

/**
 * Google Cloud Storage Configuration
 * 
 * Handles GCS client initialization and bucket access.
 */

let storage: Storage | null = null;

/**
 * Initialize GCS client
 */
export function initializeStorage(): Storage {
  if (storage) {
    return storage;
  }
  
  try {
    // Initialize with service account key file
    if (env.GCS_KEY_FILE) {
      storage = new Storage({
        keyFilename: env.GCS_KEY_FILE,
        projectId: env.GCS_PROJECT_ID,
      });
      
      logger.info('GCS initialized with key file');
    } 
    // Initialize with default credentials (for Cloud Run, GKE, etc.)
    else {
      storage = new Storage({
        projectId: env.GCS_PROJECT_ID,
      });
      
      logger.info('GCS initialized with default credentials');
    }
    
    return storage;
  } catch (error) {
    logger.error('Failed to initialize GCS', error);
    throw error;
  }
}

/**
 * Get GCS client instance
 */
export function getStorage(): Storage {
  if (!storage) {
    return initializeStorage();
  }
  return storage;
}

/**
 * Get bucket instance
 */
export function getBucket(bucketName?: string) {
  const storage = getStorage();
  const name = bucketName || env.GCS_BUCKET_NAME;
  
  return storage.bucket(name);
}

/**
 * Check if GCS is configured
 */
export function isStorageConfigured(): boolean {
  return !!(env.GCS_BUCKET_NAME && env.GCS_PROJECT_ID);
}

/**
 * Validate GCS configuration
 */
export async function validateStorageConfig(): Promise<boolean> {
  if (!isStorageConfigured()) {
    logger.warn('GCS not configured');
    return false;
  }
  
  try {
    const bucket = getBucket();
    const [exists] = await bucket.exists();
    
    if (!exists) {
      logger.error(`GCS bucket ${env.GCS_BUCKET_NAME} does not exist`);
      return false;
    }
    
    logger.info(`GCS bucket ${env.GCS_BUCKET_NAME} validated`);
    return true;
  } catch (error) {
    logger.error('Failed to validate GCS config', error);
    return false;
  }
}







