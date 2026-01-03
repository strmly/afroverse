import { cleanupOrphanedUploads } from '../services/media.service';
import { logger } from '../utils/logger';

/**
 * Cleanup Orphaned Uploads Job
 * 
 * Runs periodically to clean up initiated uploads that were never completed.
 * Should be run via cron or Cloud Scheduler.
 * 
 * Usage:
 *   ts-node src/jobs/cleanupOrphanedUploads.ts
 */

async function runCleanup() {
  try {
    logger.info('Starting orphaned upload cleanup...');
    
    const result = await cleanupOrphanedUploads();
    
    logger.info('Cleanup completed', result);
    
    process.exit(0);
  } catch (error) {
    logger.error('Cleanup failed', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runCleanup();
}

export { runCleanup };







