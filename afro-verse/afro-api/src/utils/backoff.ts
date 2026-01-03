/**
 * Backoff Utilities for Vercel Async Jobs
 * 
 * Provides predictable, capped retry delays.
 */

/**
 * Calculate retry delay based on attempt number
 * 
 * Delays: 30s, 2m, 10m, 30m, 2h
 */
export function getRetryDelay(attempts: number): number {
  const delays = [
    30 * 1000,        // 30 seconds
    2 * 60 * 1000,    // 2 minutes
    10 * 60 * 1000,   // 10 minutes
    30 * 60 * 1000,   // 30 minutes
    2 * 60 * 60 * 1000, // 2 hours
  ];
  
  // Use last delay for attempts beyond array length
  const index = Math.min(attempts - 1, delays.length - 1);
  return delays[Math.max(0, index)];
}

/**
 * Calculate retryAfter timestamp
 */
export function calculateRetryAfter(attempts: number): Date {
  const delay = getRetryDelay(attempts);
  return new Date(Date.now() + delay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND') {
    return true;
  }
  
  // HTTP 5xx errors
  if (error.response?.status >= 500) {
    return true;
  }
  
  // Specific retryable error codes
  const retryableCodes = [
    'model_timeout',
    'network_error',
    'upload_failed',
    'temporary_error',
  ];
  
  if (retryableCodes.includes(error.code)) {
    return true;
  }
  
  return false;
}

/**
 * Check if error is non-retryable
 */
export function isNonRetryableError(error: any): boolean {
  const nonRetryableCodes = [
    'blocked',
    'unsafe_request',
    'invalid_request',
    'missing_selfies',
    'banned_user',
    'quota_exceeded',
  ];
  
  return nonRetryableCodes.includes(error.code);
}







