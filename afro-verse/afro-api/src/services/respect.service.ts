import { Types, startSession } from 'mongoose';
import { Respect } from '../models/Respect';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Respect Service
 * 
 * Idempotent like/unlike operations with atomic counter updates.
 * 
 * Key principles:
 * - Duplicate respect returns 200 OK (idempotent)
 * - Unrespect non-existent returns 200 OK (idempotent)
 * - Counters updated atomically in transaction
 * - Counters never go below zero
 */

export interface RespectResult {
  success: boolean;
  error?: string;
}

/**
 * Add respect (like)
 * 
 * Idempotent: duplicate respect returns success without incrementing counters
 */
export async function addRespect(
  postId: string,
  userId: string
): Promise<RespectResult> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'invalid_post_id' };
    }
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);
    
    // Check if post exists and is active
    const post = await Post.findById(postObjectId).select('userId status');
    
    if (!post) {
      return { success: false, error: 'post_not_found' };
    }
    
    if (post.status !== 'active') {
      return { success: false, error: 'post_not_active' };
    }
    
    // Conditionally use transactions (only in production with replica set)
    const useTransaction = env.NODE_ENV === 'production';
    let session: any = null;
    
    if (useTransaction) {
      try {
        session = await startSession();
        session.startTransaction();
      } catch (error: any) {
        logger.warn('Could not start transaction for respect, proceeding without', {
          error: error.message,
        });
        if (session) {
          try {
            session.endSession();
          } catch (e) {
            // Ignore
          }
        }
        session = null;
      }
    }
    
    try {
      const saveOptions = useTransaction && session ? { session } : {};
      
      // Try to insert respect
      const respect = await Respect.create(
        [{ postId: postObjectId, userId: userObjectId }],
        saveOptions
      );
      
      // If we get here, respect was created (not duplicate)
      
      // Increment post counter
      await Post.findByIdAndUpdate(
        postObjectId,
        { $inc: { 'counts.respects': 1 } },
        saveOptions
      );
      
      // Increment post owner's received respects
      await User.findByIdAndUpdate(
        post.userId,
        { $inc: { 'counters.respectsReceived': 1 } },
        saveOptions
      );
      
      // Commit transaction if we started one
      if (useTransaction && session) {
        await session.commitTransaction();
      }
      
      logger.info('Respect added', {
        postId,
        userId,
        postOwnerId: post.userId.toString(),
      });
      
      return { success: true };
    } catch (error: any) {
      // Abort transaction if we started one
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // Ignore
        }
      }
      
      // Check if duplicate key error (code 11000)
      if (error.code === 11000) {
        // Idempotent: already respected, return success
        logger.info('Duplicate respect (idempotent)', { postId, userId });
        return { success: true };
      }
      
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error: any) {
    logger.error('Error adding respect', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Remove respect (unlike)
 * 
 * Idempotent: removing non-existent respect returns success
 */
export async function removeRespect(
  postId: string,
  userId: string
): Promise<RespectResult> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'invalid_post_id' };
    }
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    const postObjectId = new Types.ObjectId(postId);
    const userObjectId = new Types.ObjectId(userId);
    
    // Check if post exists
    const post = await Post.findById(postObjectId).select('userId');
    
    if (!post) {
      return { success: false, error: 'post_not_found' };
    }
    
    // Conditionally use transactions (only in production with replica set)
    const useTransaction = env.NODE_ENV === 'production';
    let session: any = null;
    
    if (useTransaction) {
      try {
        session = await startSession();
        session.startTransaction();
      } catch (error: any) {
        logger.warn('Could not start transaction for unrespect, proceeding without', {
          error: error.message,
        });
        if (session) {
          try {
            session.endSession();
          } catch (e) {
            // Ignore
          }
        }
        session = null;
      }
    }
    
    try {
      const saveOptions = useTransaction && session ? { session } : {};
      
      // Try to delete respect
      const result = await Respect.findOneAndDelete(
        { postId: postObjectId, userId: userObjectId },
        saveOptions
      );
      
      if (result) {
        // Respect was found and deleted
        
        // Decrement post counter (manual clamping at 0)
        const postDoc = await Post.findById(postObjectId);
        if (postDoc && postDoc.counts.respects > 0) {
          await Post.findByIdAndUpdate(
            postObjectId,
            { $inc: { 'counts.respects': -1 } },
            saveOptions
          );
        }
        
        // Decrement post owner's received respects (manual clamping at 0)
        const userDoc = await User.findById(post.userId);
        if (userDoc && userDoc.counters.respectsReceived > 0) {
          await User.findByIdAndUpdate(
            post.userId,
            { $inc: { 'counters.respectsReceived': -1 } },
            saveOptions
          );
        }
        
        logger.info('Respect removed', {
          postId,
          userId,
          postOwnerId: post.userId.toString(),
        });
      } else {
        // Respect didn't exist (idempotent)
        logger.info('Respect not found (idempotent)', { postId, userId });
      }
      
      // Commit transaction if we started one
      if (useTransaction && session) {
        await session.commitTransaction();
      }
      
      return { success: true };
    } catch (error: any) {
      // Abort transaction if we started one
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // Ignore
        }
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  } catch (error: any) {
    logger.error('Error removing respect', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Check if user has respected post
 */
export async function hasRespected(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(userId)) {
      return false;
    }
    
    const respect = await Respect.findOne({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
    });
    
    return !!respect;
  } catch (error: any) {
    logger.error('Error checking respect', error);
    return false;
  }
}

/**
 * Repair counters (nightly job)
 * 
 * Reconciles post.counts.respects with actual respect count
 */
export async function repairCounters(): Promise<{
  repaired: number;
  errors: number;
}> {
  let repaired = 0;
  let errors = 0;
  
  try {
    logger.info('Starting counter repair job');
    
    // Aggregate actual respect counts per post
    const actualCounts = await Respect.aggregate([
      {
        $group: {
          _id: '$postId',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Build map of actual counts
    const countMap = new Map<string, number>();
    for (const item of actualCounts) {
      countMap.set(item._id.toString(), item.count);
    }
    
    // Fetch all active posts
    const posts = await Post.find({ status: 'active' }).select('_id counts.respects');
    
    // Check each post
    for (const post of posts) {
      const actualCount = countMap.get(post._id.toString()) || 0;
      const storedCount = post.counts.respects;
      
      if (actualCount !== storedCount) {
        logger.warn('Counter drift detected', {
          postId: post._id.toString(),
          stored: storedCount,
          actual: actualCount,
          drift: actualCount - storedCount,
        });
        
        try {
          // Update to actual count
          await Post.findByIdAndUpdate(post._id, {
            $set: { 'counts.respects': actualCount },
          });
          repaired++;
        } catch (error: any) {
          logger.error('Error repairing counter', { postId: post._id, error });
          errors++;
        }
      }
    }
    
    logger.info('Counter repair completed', { repaired, errors });
    
    return { repaired, errors };
  } catch (error: any) {
    logger.error('Counter repair failed', error);
    return { repaired, errors };
  }
}





