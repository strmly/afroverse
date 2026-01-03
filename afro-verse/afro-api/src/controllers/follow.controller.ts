import { Request, Response } from 'express';
import {
  followUser,
  unfollowUser,
  getRelationship,
  getFollowing,
  getFollowers,
} from '../services/follow.service';
import logger from '../utils/logger';

/**
 * POST /follow
 * 
 * Follow a user
 */
export async function handleFollow(req: Request, res: Response) {
  try {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        error: 'missing_target',
        message: 'Target user ID is required',
      });
    }

    const result = await followUser(currentUserId, targetUserId);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        cannot_follow_self: 400,
        user_not_found: 404,
      };

      const status = statusMap[result.error || ''] || 500;

      return res.status(status).json({
        error: result.error,
        message: getErrorMessage(result.error || ''),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error: any) {
    logger.error('Error in follow controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to follow user',
    });
  }
}

/**
 * DELETE /follow/:targetUserId
 * 
 * Unfollow a user
 */
export async function handleUnfollow(req: Request, res: Response) {
  try {
    const currentUserId = req.user?.id;
    const { targetUserId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        error: 'missing_target',
        message: 'Target user ID is required',
      });
    }

    const result = await unfollowUser(currentUserId, targetUserId);

    if (!result.success) {
      return res.status(500).json({
        error: result.error,
        message: 'Failed to unfollow user',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error: any) {
    logger.error('Error in unfollow controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to unfollow user',
    });
  }
}

/**
 * GET /users/:userId/relationship
 * 
 * Get relationship between current user and target user
 */
export async function handleGetRelationship(req: Request, res: Response) {
  try {
    const currentUserId = req.user?.id || null;
    const { userId: targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({
        error: 'missing_target',
        message: 'Target user ID is required',
      });
    }

    const relationship = await getRelationship(currentUserId, targetUserId);

    return res.status(200).json(relationship);
  } catch (error: any) {
    logger.error('Error getting relationship', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get relationship',
    });
  }
}

/**
 * GET /users/:userId/following
 * 
 * Get users that a user is following
 */
export async function handleGetFollowing(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(400).json({
        error: 'missing_user_id',
        message: 'User ID is required',
      });
    }

    const users = await getFollowing(userId, limit);

    return res.status(200).json({ users });
  } catch (error: any) {
    logger.error('Error getting following', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get following',
    });
  }
}

/**
 * GET /users/:userId/followers
 * 
 * Get users that follow a user
 */
export async function handleGetFollowers(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(400).json({
        error: 'missing_user_id',
        message: 'User ID is required',
      });
    }

    const users = await getFollowers(userId, limit);

    return res.status(200).json({ users });
  } catch (error: any) {
    logger.error('Error getting followers', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get followers',
    });
  }
}

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    invalid_user_id: 'Invalid user ID',
    cannot_follow_self: 'Cannot follow yourself',
    user_not_found: 'User not found',
    internal_error: 'An error occurred',
  };

  return messages[errorCode] || 'An error occurred';
}



