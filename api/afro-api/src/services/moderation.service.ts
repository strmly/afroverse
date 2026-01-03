import { Types } from 'mongoose';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Generation } from '../models/Generation';
import { securityConfig } from '../config/security';
import { logger } from '../utils/logger';

/**
 * Content Moderation Service
 * 
 * Handles content safety checks and moderation actions.
 */

/**
 * Check if prompt contains unsafe content
 */
export function checkPromptSafety(prompt: string): {
  safe: boolean;
  reason?: string;
} {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check length
  if (prompt.length > securityConfig.contentSafety.maxPromptLength) {
    return {
      safe: false,
      reason: 'Prompt too long',
    };
  }
  
  // Check against denylist
  for (const term of securityConfig.contentSafety.denylist) {
    if (lowerPrompt.includes(term.toLowerCase())) {
      logger.warn('Unsafe prompt detected', {
        reason: 'denylist_match',
        termLength: term.length, // Don't log the actual term
      });
      
      return {
        safe: false,
        reason: 'Content policy violation',
      };
    }
  }
  
  // Check for common unsafe patterns
  const unsafePatterns = [
    /\b(nude|naked|nsfw|xxx|porn|sex)\b/i,
    /\b(child|kid|minor|teen|underage)\s+(nude|naked|sexual)/i,
    /\b(kill|murder|suicide|harm|hurt)\s+(yourself|myself|someone)/i,
    /\b(bomb|weapon|terrorist|extremist)\b/i,
  ];
  
  for (const pattern of unsafePatterns) {
    if (pattern.test(prompt)) {
      logger.warn('Unsafe prompt pattern detected', {
        reason: 'pattern_match',
      });
      
      return {
        safe: false,
        reason: 'Content policy violation',
      };
    }
  }
  
  return { safe: true };
}

/**
 * Check if caption is safe
 */
export function checkCaptionSafety(caption: string): {
  safe: boolean;
  reason?: string;
} {
  // Check length
  if (caption.length > securityConfig.contentSafety.maxCaptionLength) {
    return {
      safe: false,
      reason: 'Caption too long',
    };
  }
  
  // Basic denylist check
  const lowerCaption = caption.toLowerCase();
  for (const term of securityConfig.contentSafety.denylist) {
    if (lowerCaption.includes(term.toLowerCase())) {
      return {
        safe: false,
        reason: 'Content policy violation',
      };
    }
  }
  
  return { safe: true };
}

/**
 * Flag post for review
 */
export async function flagPost(
  postId: string,
  reason: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'invalid_post_id' };
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return { success: false, error: 'post_not_found' };
    }
    
    // Update status
    await Post.findByIdAndUpdate(postId, {
      $set: {
        status: 'flagged',
        'moderation.flaggedAt': new Date(),
        'moderation.reason': reason,
        'moderation.moderatorId': moderatorId,
      },
    });
    
    logger.info('Post flagged', {
      postId,
      reason,
      moderatorId,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Error flagging post', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Remove post from feed
 */
export async function removePost(
  postId: string,
  reason: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Types.ObjectId.isValid(postId)) {
      return { success: false, error: 'invalid_post_id' };
    }
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return { success: false, error: 'post_not_found' };
    }
    
    // Update status
    await Post.findByIdAndUpdate(postId, {
      $set: {
        status: 'removed',
        'moderation.removedAt': new Date(),
        'moderation.reason': reason,
        'moderation.moderatorId': moderatorId,
      },
    });
    
    logger.info('Post removed', {
      postId,
      reason,
      moderatorId,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Error removing post', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Ban user
 */
export async function banUser(
  userId: string,
  reason: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'user_not_found' };
    }
    
    // Update status
    await User.findByIdAndUpdate(userId, {
      $set: {
        'status.isBanned': true,
        'status.bannedAt': new Date(),
        'status.bannedReason': reason,
        'status.bannedBy': moderatorId,
      },
    });
    
    // Also remove all active posts
    await Post.updateMany(
      { userId, status: 'active' },
      {
        $set: {
          status: 'removed',
          'moderation.removedAt': new Date(),
          'moderation.reason': 'User banned',
          'moderation.moderatorId': moderatorId,
        },
      }
    );
    
    logger.info('User banned', {
      userId,
      reason,
      moderatorId,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Error banning user', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Unban user
 */
export async function unbanUser(
  userId: string,
  moderatorId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'user_not_found' };
    }
    
    // Update status
    await User.findByIdAndUpdate(userId, {
      $set: {
        'status.isBanned': false,
        'status.unbannedAt': new Date(),
        'status.unbannedBy': moderatorId,
      },
    });
    
    logger.info('User unbanned', {
      userId,
      moderatorId,
    });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Error unbanning user', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Check if generation should be blocked
 */
export async function checkGenerationAbuse(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check if user is banned
    const user = await User.findById(userId).select('status').lean();
    
    if (user?.status?.banned || user?.status?.shadowbanned) {
      return {
        allowed: false,
        reason: 'Account suspended',
      };
    }
    
    // Check recent failure rate
    const recentGenerations = await Generation.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 3600000) }, // Last hour
    })
      .select('status error')
      .lean();
    
    if (recentGenerations.length > 0) {
      const failedCount = recentGenerations.filter(
        (g) => g.status === 'failed' && g.error?.code === 'blocked'
      ).length;
      
      const failureRate = failedCount / recentGenerations.length;
      
      // If >50% blocked in last hour, throttle
      if (failureRate > 0.5 && recentGenerations.length >= 3) {
        logger.warn('High generation failure rate detected', {
          userId,
          failureRate,
          total: recentGenerations.length,
        });
        
        return {
          allowed: false,
          reason: 'Too many failed attempts. Try again later.',
        };
      }
    }
    
    return { allowed: true };
  } catch (error: any) {
    logger.error('Error checking generation abuse', error);
    return { allowed: true }; // Fail open
  }
}

/**
 * Handle provider blocked response
 */
export async function handleBlockedGeneration(
  generationId: string,
  reason: string
): Promise<void> {
  try {
    await Generation.findByIdAndUpdate(generationId, {
      $set: {
        status: 'failed',
        error: {
          code: 'blocked',
          message: 'Content blocked by safety filters',
          retryable: false,
        },
        'moderation.blockedAt': new Date(),
        'moderation.reason': reason,
      },
    });
    
    logger.warn('Generation blocked by provider', {
      generationId,
      reason,
    });
  } catch (error: any) {
    logger.error('Error handling blocked generation', error);
  }
}

