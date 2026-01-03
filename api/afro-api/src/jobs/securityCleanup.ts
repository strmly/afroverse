import { UserSelfie } from '../models/UserSelfie';
import { Generation } from '../models/Generation';
import { securityConfig } from '../config/security';
import { logger } from '../utils/logger';
import { getBucket } from '../config/storage';

/**
 * Security Cleanup Jobs
 * 
 * Background jobs for security maintenance:
 * - Cleanup orphaned selfies
 * - Cleanup failed generations
 * - Rotate logs
 */

/**
 * Cleanup orphaned selfies (uploaded but not completed)
 * 
 * Run hourly
 */
export async function cleanupOrphanedSelfies(): Promise<{
  cleaned: number;
  errors: number;
}> {
  let cleaned = 0;
  let errors = 0;
  
  try {
    logger.info('Starting orphaned selfies cleanup');
    
    const cutoffTime = new Date(
      Date.now() - securityConfig.upload.orphanCleanupAfter * 1000
    );
    
    // Find orphaned selfies
    const orphanedSelfies = await UserSelfie.find({
      status: 'initiated',
      initiatedAt: { $lt: cutoffTime },
    }).lean();
    
    for (const selfie of orphanedSelfies) {
      try {
        // Delete from GCS if uploaded
        if (selfie.gcsPath) {
          const bucket = getBucket();
          const file = bucket.file(selfie.gcsPath);
          
          try {
            await file.delete();
          } catch (error: any) {
            // File might not exist, that's OK
            if (error.code !== 404) {
              throw error;
            }
          }
        }
        
        // Delete from DB
        await UserSelfie.findByIdAndDelete(selfie._id);
        
        cleaned++;
      } catch (error: any) {
        logger.error('Error cleaning orphaned selfie', {
          selfieId: selfie._id,
          error,
        });
        errors++;
      }
    }
    
    logger.info('Orphaned selfies cleanup completed', { cleaned, errors });
    
    return { cleaned, errors };
  } catch (error: any) {
    logger.error('Orphaned selfies cleanup failed', error);
    return { cleaned, errors };
  }
}

/**
 * Cleanup old failed generations
 * 
 * Run daily
 */
export async function cleanupFailedGenerations(): Promise<{
  cleaned: number;
  errors: number;
}> {
  let cleaned = 0;
  let errors = 0;
  
  try {
    logger.info('Starting failed generations cleanup');
    
    // Delete failed generations older than 7 days
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await Generation.deleteMany({
      status: 'failed',
      createdAt: { $lt: cutoffTime },
    });
    
    cleaned = result.deletedCount || 0;
    
    logger.info('Failed generations cleanup completed', { cleaned });
    
    return { cleaned, errors };
  } catch (error: any) {
    logger.error('Failed generations cleanup failed', error);
    return { cleaned, errors };
  }
}

/**
 * Cleanup expired refresh tokens
 * 
 * Run daily
 */
export async function cleanupExpiredTokens(): Promise<{
  cleaned: number;
  errors: number;
}> {
  let cleaned = 0;
  let errors = 0;
  
  try {
    logger.info('Starting expired tokens cleanup');
    
    const { RefreshToken } = await import('../models/RefreshToken');
    
    // Delete expired tokens
    const result = await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    
    cleaned = result.deletedCount || 0;
    
    logger.info('Expired tokens cleanup completed', { cleaned });
    
    return { cleaned, errors };
  } catch (error: any) {
    logger.error('Expired tokens cleanup failed', error);
    return { cleaned, errors };
  }
}

/**
 * Detect and handle suspicious patterns
 * 
 * Run every 6 hours
 */
export async function detectSuspiciousActivity(): Promise<void> {
  try {
    logger.info('Starting suspicious activity detection');
    
    // Check for users with high block rate
    const suspiciousUsers = await Generation.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          blocked: {
            $sum: {
              $cond: [{ $eq: ['$error.code', 'blocked'] }, 1, 0],
            },
          },
        },
      },
      {
        $match: {
          total: { $gte: 5 },
          blocked: { $gte: 3 },
        },
      },
      {
        $project: {
          userId: '$_id',
          total: 1,
          blocked: 1,
          blockRate: { $divide: ['$blocked', '$total'] },
        },
      },
      {
        $match: {
          blockRate: { $gte: 0.5 },
        },
      },
    ]);
    
    if (suspiciousUsers.length > 0) {
      logger.warn('Suspicious users detected', {
        count: suspiciousUsers.length,
        users: suspiciousUsers.map((u) => ({
          userId: u.userId,
          blockRate: u.blockRate,
        })),
      });
      
      // In production, could trigger alerts or automatic actions
    }
    
    logger.info('Suspicious activity detection completed');
  } catch (error: any) {
    logger.error('Suspicious activity detection failed', error);
  }
}

/**
 * Schedule all security jobs
 */
export function scheduleSecurityJobs(): void {
  // Run every hour
  setInterval(() => {
    cleanupOrphanedSelfies();
  }, 60 * 60 * 1000);
  
  // Run daily at 3am
  const scheduleDailyJob = (job: () => Promise<any>, hour: number = 3) => {
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      0,
      0
    );
    
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const delay = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
      job();
      // Run daily
      setInterval(job, 24 * 60 * 60 * 1000);
    }, delay);
  };
  
  scheduleDailyJob(cleanupFailedGenerations, 3);
  scheduleDailyJob(cleanupExpiredTokens, 4);
  
  // Run every 6 hours
  setInterval(() => {
    detectSuspiciousActivity();
  }, 6 * 60 * 60 * 1000);
  
  logger.info('Security jobs scheduled');
}

