import { Types } from 'mongoose';
import Follow from '../models/Follow';
import { User } from '../models/User';
import logger from '../utils/logger';

/**
 * Follow Service
 * 
 * Handles follow/unfollow relationships and queries
 */

/**
 * Follow a user
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(followingId)) {
      return { success: false, error: 'invalid_user_id' };
    }

    // Prevent self-follow
    if (followerId === followingId) {
      return { success: false, error: 'cannot_follow_self' };
    }

    // Check if target user exists
    const targetUser = await User.findById(followingId).select('_id').lean();
    if (!targetUser) {
      return { success: false, error: 'user_not_found' };
    }

    // Create follow relationship (idempotent)
    await Follow.findOneAndUpdate(
      {
        follower: new Types.ObjectId(followerId),
        following: new Types.ObjectId(followingId),
      },
      {
        $setOnInsert: {
          follower: new Types.ObjectId(followerId),
          following: new Types.ObjectId(followingId),
        },
      },
      { upsert: true, new: true }
    );

    // Update follower/following counts
    await Promise.all([
      User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }),
    ]);

    logger.info('User followed', { followerId, followingId });

    return { success: true };
  } catch (error: any) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return { success: true }; // Already following, treat as success
    }

    logger.error('Error following user', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(followingId)) {
      return { success: false, error: 'invalid_user_id' };
    }

    // Delete follow relationship
    const result = await Follow.findOneAndDelete({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    });

    if (result) {
      // Update follower/following counts (only if relationship existed)
      await Promise.all([
        User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }),
        User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }),
      ]);
    }

    logger.info('User unfollowed', { followerId, followingId });

    return { success: true };
  } catch (error: any) {
    logger.error('Error unfollowing user', error);
    return { success: false, error: 'internal_error' };
  }
}

/**
 * Check if user A is following user B
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  try {
    if (!Types.ObjectId.isValid(followerId) || !Types.ObjectId.isValid(followingId)) {
      return false;
    }

    const follow = await Follow.findOne({
      follower: new Types.ObjectId(followerId),
      following: new Types.ObjectId(followingId),
    })
      .select('_id')
      .lean();

    return !!follow;
  } catch (error: any) {
    logger.error('Error checking follow status', error);
    return false;
  }
}

/**
 * Get relationship status between current user and target user
 */
export async function getRelationship(
  currentUserId: string | null,
  targetUserId: string
): Promise<{
  isFollowing: boolean;
  isFollower: boolean;
  isSelf: boolean;
}> {
  try {
    if (!currentUserId) {
      return { isFollowing: false, isFollower: false, isSelf: false };
    }

    if (currentUserId === targetUserId) {
      return { isFollowing: false, isFollower: false, isSelf: true };
    }

    const [following, follower] = await Promise.all([
      isFollowing(currentUserId, targetUserId),
      isFollowing(targetUserId, currentUserId),
    ]);

    return {
      isFollowing: following,
      isFollower: follower,
      isSelf: false,
    };
  } catch (error: any) {
    logger.error('Error getting relationship', error);
    return { isFollowing: false, isFollower: false, isSelf: false };
  }
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const follows = await Follow.find({ follower: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('following', 'username displayName avatar')
      .lean();

    return follows.map((f: any) => f.following);
  } catch (error: any) {
    logger.error('Error getting following', error);
    return [];
  }
}

/**
 * Get users that follow a user
 */
export async function getFollowers(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const follows = await Follow.find({ following: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('follower', 'username displayName avatar')
      .lean();

    return follows.map((f: any) => f.follower);
  } catch (error: any) {
    logger.error('Error getting followers', error);
    return [];
  }
}

