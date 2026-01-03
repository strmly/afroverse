import { Request, Response } from 'express';
import {
  getAllTribes,
  getTribeBySlug,
  joinTribe,
  getTribePosts as getTribePostsService,
  getTribeMembers as getTribeMembersService,
} from '../services/tribe.service';
import { logger } from '../utils/logger';

/**
 * Tribe Controller
 * 
 * Handles tribe-related HTTP requests.
 */

/**
 * GET /tribes
 * 
 * Get all tribes (directory/onboarding)
 */
export async function getTribes(req: Request, res: Response) {
  try {
    const tribes = await getAllTribes();
    
    return res.status(200).json({
      items: tribes,
    });
  } catch (error: any) {
    logger.error('Error in getTribes controller', error);
    
    // Check if it's a database connection error
    if (error.message?.includes('Database not connected') || 
        error.message?.includes('buffering timed out') ||
        error.name === 'MongooseError') {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'Database not available. Please start MongoDB.',
      });
    }
    
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribes',
    });
  }
}

/**
 * GET /tribes/:slug
 * 
 * Get tribe header data
 */
export async function getTribe(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const viewerUserId = req.user?.id;
    
    const tribe = await getTribeBySlug(slug, viewerUserId);
    
    if (!tribe) {
      return res.status(404).json({
        error: 'tribe_not_found',
        message: 'Tribe not found',
      });
    }
    
    return res.status(200).json(tribe);
  } catch (error: any) {
    logger.error('Error in getTribe controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribe',
    });
  }
}

/**
 * POST /tribes/:slug/join
 * 
 * Join tribe (onboarding only)
 */
export async function joinTribeController(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const result = await joinTribe(userId, slug);
    
    if (!result.success) {
      // Map errors to HTTP status codes
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        user_not_found: 404,
        tribe_already_selected: 400,
        tribe_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: getErrorMessage(result.error || ''),
      });
    }
    
    return res.status(200).json({
      status: 'joined',
      tribe: result.tribe,
    });
  } catch (error: any) {
    logger.error('Error in joinTribeController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to join tribe',
    });
  }
}

/**
 * GET /tribes/:slug/posts
 * 
 * Get tribe posts (grid)
 */
export async function getTribePosts(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 20);
    const cursor = req.query.cursor as string;
    
    const result = await getTribePostsService(slug, userId, limit, cursor);
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getTribePosts controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribe posts',
    });
  }
}

/**
 * GET /tribes/:slug/members
 * 
 * Get tribe members
 */
export async function getTribeMembers(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const cursor = req.query.cursor as string;
    
    const result = await getTribeMembersService(slug, limit, cursor);
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getTribeMembers controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribe members',
    });
  }
}

/**
 * GET /tribes/:slug/preview
 * 
 * Get tribe preview (limited, for non-members)
 */
export async function getTribePreview(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    
    // Get tribe info
    const tribe = await getTribeBySlug(slug, userId);
    
    if (!tribe) {
      return res.status(404).json({
        error: 'tribe_not_found',
        message: 'Tribe not found',
      });
    }
    
    // Get limited posts (public only) - use a dummy user ID for non-authenticated requests
    const posts = await getTribePostsService(slug, userId || 'guest', 6);
    
    return res.status(200).json({
      tribe,
      posts: posts.items,
      viewerState: {
        canPost: tribe.viewerState.isMember,
      },
    });
  } catch (error: any) {
    logger.error('Error in getTribePreview controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribe preview',
    });
  }
}

/**
 * Helper: Map error codes to user-friendly messages
 */
function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    invalid_user_id: 'Invalid user',
    user_not_found: 'User not found',
    tribe_already_selected: 'Tribe already chosen',
    tribe_not_found: 'Tribe not found',
    forbidden: 'Action not allowed',
    unauthorized: 'Authentication required',
  };
  
  return messages[errorCode] || 'An error occurred';
}

