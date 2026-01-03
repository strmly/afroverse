/**
 * GCS Bucket Configuration
 * 
 * SOURCE OF AUTHORITY for AfroMoji image lifecycle.
 * 
 * CRITICAL: The mobile app NEVER knows bucket names.
 * All storage actions are owned by the backend Media Service.
 */

import { env } from './env';

/**
 * Bucket Definitions
 * 
 * Each bucket has a specific purpose in the image lifecycle.
 */
export const BUCKETS = {
  /**
   * RAW GENERATIONS
   * Temporary storage for AI-generated images before validation.
   * 
   * - App Visibility: ❌ INVISIBLE
   * - Access: Private
   * - Lifecycle: Auto-delete after 24h
   * - CDN: No
   */
  RAW_GENERATIONS: 'afromoji-raw-generations',
  
  /**
   * TRANSFORMATIONS
   * Final, validated, public transformations.
   * 
   * - App Visibility: ✅ PUBLIC URL
   * - Access: Public
   * - Lifecycle: Permanent (user-controlled deletion)
   * - CDN: Yes (Cloud CDN)
   */
  TRANSFORMATIONS: 'afromoji-transformations',
  
  /**
   * DERIVATIVES
   * Thumbnails and optimized versions.
   * 
   * - App Visibility: ✅ PUBLIC URL
   * - Access: Public
   * - Lifecycle: Tied to parent transformation
   * - CDN: Yes (Cloud CDN)
   */
  DERIVATIVES: 'afromoji-derivatives',
  
  /**
   * PRIVATE GALLERY
   * User drafts and private transformations.
   * 
   * - App Visibility: ✅ SIGNED URL ONLY
   * - Access: Private (signed URLs)
   * - Lifecycle: User-controlled
   * - CDN: No
   */
  PRIVATE_GALLERY: 'afromoji-private-gallery',
  
  /**
   * ARCHIVE
   * Soft-deleted transformations for recovery.
   * 
   * - App Visibility: ❌ INVISIBLE
   * - Access: Private
   * - Lifecycle: Auto-delete after 30 days
   * - CDN: No
   */
  ARCHIVE: 'afromoji-archive',
} as const;

/**
 * CDN Configuration
 */
export const CDN = {
  BASE_URL: env.CDN_BASE_URL || 'https://cdn.afromoji.com',
  ENABLED: env.NODE_ENV === 'production',
} as const;

/**
 * Lifecycle Rules
 */
export const LIFECYCLE = {
  RAW_GENERATION_TTL: 24 * 60 * 60, // 24 hours
  SIGNED_URL_EXPIRY: 30 * 60, // 30 minutes
  ARCHIVE_TTL: 30 * 24 * 60 * 60, // 30 days
} as const;

/**
 * Path Generators
 * 
 * Centralized path generation ensures consistency.
 */
export const PATHS = {
  /**
   * Raw generation path (temporary)
   */
  rawGeneration: (userId: string, uuid: string): string => {
    return `users/${userId}/raw/${uuid}.png`;
  },
  
  /**
   * Public transformation path
   */
  transformation: (userId: string, transformationId: string): string => {
    return `users/${userId}/transformations/${transformationId}.webp`;
  },
  
  /**
   * Thumbnail path
   */
  thumbnail: (userId: string, transformationId: string, size: number = 512): string => {
    return `users/${userId}/thumbnails/${transformationId}_w${size}.webp`;
  },
  
  /**
   * Private draft path
   */
  privateDraft: (userId: string, draftId: string): string => {
    return `users/${userId}/drafts/${draftId}.webp`;
  },
  
  /**
   * Archive path
   */
  archive: (userId: string, transformationId: string, deletedAt: Date): string => {
    const timestamp = deletedAt.getTime();
    return `users/${userId}/archived/${timestamp}_${transformationId}.webp`;
  },
} as const;

/**
 * URL Generators
 * 
 * Backend-controlled URL generation.
 */
export const URLS = {
  /**
   * Public CDN URL
   */
  public: (bucket: string, path: string): string => {
    if (CDN.ENABLED && (bucket === BUCKETS.TRANSFORMATIONS || bucket === BUCKETS.DERIVATIVES)) {
      return `${CDN.BASE_URL}/${path}`;
    }
    return `https://storage.googleapis.com/${bucket}/${path}`;
  },
  
  /**
   * GCS direct URL (for signed URL generation)
   */
  gcs: (bucket: string, path: string): string => {
    return `gs://${bucket}/${path}`;
  },
} as const;

/**
 * Bucket Configuration
 * 
 * Maps bucket names to their properties.
 */
export interface BucketConfig {
  name: string;
  public: boolean;
  cdn: boolean;
  ttl?: number;
}

export const BUCKET_CONFIGS: Record<string, BucketConfig> = {
  [BUCKETS.RAW_GENERATIONS]: {
    name: BUCKETS.RAW_GENERATIONS,
    public: false,
    cdn: false,
    ttl: LIFECYCLE.RAW_GENERATION_TTL,
  },
  [BUCKETS.TRANSFORMATIONS]: {
    name: BUCKETS.TRANSFORMATIONS,
    public: true,
    cdn: true,
  },
  [BUCKETS.DERIVATIVES]: {
    name: BUCKETS.DERIVATIVES,
    public: true,
    cdn: true,
  },
  [BUCKETS.PRIVATE_GALLERY]: {
    name: BUCKETS.PRIVATE_GALLERY,
    public: false,
    cdn: false,
  },
  [BUCKETS.ARCHIVE]: {
    name: BUCKETS.ARCHIVE,
    public: false,
    cdn: false,
    ttl: LIFECYCLE.ARCHIVE_TTL,
  },
};

/**
 * Service Account
 */
export const SERVICE_ACCOUNT = {
  EMAIL: 'afroverse@gen-lang-client-0213839796.iam.gserviceaccount.com',
  PROJECT_ID: 'gen-lang-client-0213839796',
} as const;

/**
 * Validation
 */
export function validateBucketConfig(): void {
  const requiredBuckets = Object.values(BUCKETS);
  
  for (const bucket of requiredBuckets) {
    if (!BUCKET_CONFIGS[bucket]) {
      throw new Error(`Missing configuration for bucket: ${bucket}`);
    }
  }
}

/**
 * Get bucket config
 */
export function getBucketConfig(bucket: string): BucketConfig {
  const config = BUCKET_CONFIGS[bucket];
  
  if (!config) {
    throw new Error(`Unknown bucket: ${bucket}`);
  }
  
  return config;
}



