import { Request, Response } from 'express';
import { getFeed, getHotFeed, type FeedCursor } from '../services/feed.service';
import { logger } from '../utils/logger';

/**
 * Feed Controller
 * 
 * Handles feed requests with tribe-first algorithm.
 */

/**
 * GET /feed
 * 
 * Get personalized feed (tribe-first + discovery)
 */
export async function getFeedController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    // Parse query params
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    
    // Parse cursors
    const cursors: FeedCursor = {};
    if (req.query.tribeCursor) {
      cursors.tribe = req.query.tribeCursor as string;
    }
    if (req.query.discoverCursor) {
      cursors.discover = req.query.discoverCursor as string;
    }
    
    // Get feed
    const feed = await getFeed(userId, limit, cursors);
    
    return res.status(200).json(feed);
  } catch (error: any) {
    logger.error('Error in getFeedController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: error.message || 'Failed to get feed',
    });
  }
}

/**
 * GET /feed/hot
 * 
 * Get hot/trending feed (experimental)
 */
export async function getHotFeedController(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
    const cursor = req.query.cursor as string;
    
    const feed = await getHotFeed(userId, limit, cursor);
    
    return res.status(200).json(feed);
  } catch (error: any) {
    logger.error('Error in getHotFeedController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get hot feed',
    });
  }
}







