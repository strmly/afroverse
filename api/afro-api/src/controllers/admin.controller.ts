import { Request, Response } from 'express';
import {
  flagPost,
  removePost,
  banUser,
  unbanUser,
} from '../services/moderation.service';
import { logger } from '../utils/logger';

/**
 * Admin Controller
 * 
 * Handles admin moderation actions.
 * Protected by admin auth + IP allowlist.
 */

/**
 * POST /admin/posts/:id/flag
 * 
 * Flag post for review
 */
export async function flagPostController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user?.id;
    
    if (!reason) {
      return res.status(400).json({
        error: 'missing_reason',
        message: 'Reason is required',
      });
    }
    
    const result = await flagPost(id, reason, moderatorId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_post_id: 400,
        post_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to flag post',
      });
    }
    
    return res.status(200).json({
      message: 'Post flagged successfully',
    });
  } catch (error: any) {
    logger.error('Error in flagPostController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to flag post',
    });
  }
}

/**
 * POST /admin/posts/:id/remove
 * 
 * Remove post from feed
 */
export async function removePostController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user?.id;
    
    if (!reason) {
      return res.status(400).json({
        error: 'missing_reason',
        message: 'Reason is required',
      });
    }
    
    const result = await removePost(id, reason, moderatorId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_post_id: 400,
        post_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to remove post',
      });
    }
    
    return res.status(200).json({
      message: 'Post removed successfully',
    });
  } catch (error: any) {
    logger.error('Error in removePostController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to remove post',
    });
  }
}

/**
 * POST /admin/users/:id/ban
 * 
 * Ban user
 */
export async function banUserController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const moderatorId = req.user?.id;
    
    if (!reason) {
      return res.status(400).json({
        error: 'missing_reason',
        message: 'Reason is required',
      });
    }
    
    const result = await banUser(id, reason, moderatorId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        user_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to ban user',
      });
    }
    
    return res.status(200).json({
      message: 'User banned successfully',
    });
  } catch (error: any) {
    logger.error('Error in banUserController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to ban user',
    });
  }
}

/**
 * POST /admin/users/:id/unban
 * 
 * Unban user
 */
export async function unbanUserController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const moderatorId = req.user?.id;
    
    const result = await unbanUser(id, moderatorId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        user_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to unban user',
      });
    }
    
    return res.status(200).json({
      message: 'User unbanned successfully',
    });
  } catch (error: any) {
    logger.error('Error in unbanUserController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to unban user',
    });
  }
}







