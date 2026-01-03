import { Request, Response } from 'express';
import {
  createPost as createPostService,
  getPostById,
  getUserPosts as getUserPostsService,
  getTribePosts,
  trackShare,
} from '../services/post.service';
import {
  addRespect,
  removeRespect,
} from '../services/respect.service';
import { logger } from '../utils/logger';

/**
 * Post Controller
 * 
 * Handles post creation, retrieval, and actions.
 */

/**
 * POST /posts
 * 
 * Create post from generation version
 */
export async function createPost(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const {
      generationId,
      versionId,
      caption,
      visibility,
    } = req.body;
    
    // Validate required fields
    if (!generationId || !versionId) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'generationId and versionId are required',
      });
    }
    
    // Get idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    // Create post
    const result = await createPostService({
      userId,
      generationId,
      versionId,
      caption,
      visibility,
      idempotencyKey,
    });
    
    if (!result.success) {
      // Map errors to HTTP status codes
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        invalid_generation_id: 400,
        generation_not_found: 404,
        not_your_generation: 403,
        generation_not_ready: 400,
        invalid_version: 400,
        caption_too_long: 400,
        user_not_found: 404,
        tribe_required: 400,
        invalid_visibility: 400,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to create post',
      });
    }
    
    return res.status(201).json({
      postId: result.postId,
    });
  } catch (error: any) {
    logger.error('Error in createPost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to create post',
    });
  }
}

/**
 * GET /posts/:id
 * 
 * Get post by ID with enriched data
 */
export async function getPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const viewerUserId = req.user?.id;
    
    const post = await getPostById(id, viewerUserId);
    
    if (!post) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Post not found',
      });
    }
    
    return res.status(200).json(post);
  } catch (error: any) {
    logger.error('Error in getPost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get post',
    });
  }
}

/**
 * GET /users/:username/posts
 * 
 * Get user's posts (profile grid)
 */
export async function getUserPosts(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    
    const result = await getUserPostsService(username, limit, cursor);
    
    // Check if user was not found
    if (result.userNotFound) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'User not found',
      });
    }
    
    return res.status(200).json({ posts: result.posts, nextCursor: result.nextCursor });
  } catch (error: any) {
    logger.error('Error in getUserPosts controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get user posts',
    });
  }
}

/**
 * GET /tribes/:slug/posts
 * 
 * Get tribe posts (tribe grid)
 */
export async function getTribePostsController(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;
    
    const result = await getTribePosts(slug, limit, cursor);
    
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in getTribePostsController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get tribe posts',
    });
  }
}

/**
 * DELETE /posts/:id
 * 
 * Soft delete post (mark as removed)
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { Post } = await import('../models/Post');
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Post not found',
      });
    }
    
    // Verify ownership
    if (post.userId.toString() !== userId) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Not your post',
      });
    }
    
    // Soft delete
    await (post as any).softDelete();
    
    logger.info('Post deleted', { postId: id, userId });
    
    return res.status(200).json({
      message: 'Post deleted',
    });
  } catch (error: any) {
    logger.error('Error in deletePost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete post',
    });
  }
}

/**
 * POST /posts/:id/respect
 * 
 * Add respect (like)
 */
export async function respectPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const result = await addRespect(id, userId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_post_id: 400,
        invalid_user_id: 400,
        post_not_found: 404,
        post_not_active: 403,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to add respect',
      });
    }
    
    return res.status(200).json({
      message: 'Respect added',
    });
  } catch (error: any) {
    logger.error('Error in respectPost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to add respect',
    });
  }
}

/**
 * DELETE /posts/:id/respect
 * 
 * Remove respect (unlike)
 */
export async function unrespectPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const result = await removeRespect(id, userId);
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_post_id: 400,
        invalid_user_id: 400,
        post_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: 'Failed to remove respect',
      });
    }
    
    return res.status(200).json({
      message: 'Respect removed',
    });
  } catch (error: any) {
    logger.error('Error in unrespectPost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to remove respect',
    });
  }
}

/**
 * POST /posts/:id/share
 * 
 * Track share intent
 */
export async function sharePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const success = await trackShare(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Post not found',
      });
    }
    
    return res.status(200).json({
      message: 'Share tracked',
    });
  } catch (error: any) {
    logger.error('Error in sharePost controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to track share',
    });
  }
}

