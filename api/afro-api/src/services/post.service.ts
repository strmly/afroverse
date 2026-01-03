import { Types } from 'mongoose';
import { Post, IPost } from '../models/Post';
import { Generation } from '../models/Generation';
import { User } from '../models/User';
import { Tribe } from '../models/Tribe';
import { startSession } from 'mongoose';
import { logger } from '../utils/logger';
import { generateSignedReadUrl } from './media.service';
import { cacheService } from '../config/redis';
import { env } from '../config/env';

/**
 * Post Service
 * 
 * Handles post creation with atomic counter updates,
 * idempotency, and proper validation.
 */

const IDEMPOTENCY_TTL = 5 * 60; // 5 minutes in seconds

export interface CreatePostInput {
  userId: string;
  generationId: string;
  versionId: string;
  caption?: string;
  visibility?: 'tribe' | 'public';
  idempotencyKey?: string;
}

export interface CreatePostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Create post from generation version
 * 
 * Atomic transaction:
 * 1. Insert post
 * 2. Increment user posts counter
 * 3. Increment tribe posts counter
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const {
    userId,
    generationId,
    versionId,
    caption,
    visibility = 'tribe',
    idempotencyKey,
  } = input;
  
  try {
    // Check idempotency using Redis/cache
    if (idempotencyKey) {
      const cacheKey = `idempotency:post:${userId}:${idempotencyKey}`;
      const cachedPostId = await cacheService.get(cacheKey);
      
      if (cachedPostId) {
        logger.info('Idempotent post creation', { postId: cachedPostId });
        return {
          success: true,
          postId: cachedPostId,
        };
      }
    }
    
    // Validate ObjectIds
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    if (!Types.ObjectId.isValid(generationId)) {
      return { success: false, error: 'invalid_generation_id' };
    }
    
    const userObjectId = new Types.ObjectId(userId);
    const generationObjectId = new Types.ObjectId(generationId);
    
    // Load generation
    const generation = await Generation.findById(generationObjectId);
    
    if (!generation) {
      return { success: false, error: 'generation_not_found' };
    }
    
    // Verify ownership
    if (generation.userId.toString() !== userId) {
      return { success: false, error: 'not_your_generation' };
    }
    
    // Verify status
    if (generation.status !== 'succeeded') {
      return { success: false, error: 'generation_not_ready' };
    }
    
    // Find version
    const version = generation.versions.find((v) => v.versionId === versionId);
    
    if (!version) {
      return { success: false, error: 'invalid_version' };
    }
    
    // Validate caption
    if (caption && caption.length > 120) {
      return { success: false, error: 'caption_too_long' };
    }
    
    // Load user to get tribeId
    const user = await User.findById(userObjectId);
    
    if (!user) {
      return { success: false, error: 'user_not_found' };
    }
    
    if (!user.tribeId) {
      return { success: false, error: 'tribe_required' };
    }
    
    // Validate visibility
    if (!['tribe', 'public'].includes(visibility)) {
      return { success: false, error: 'invalid_visibility' };
    }
    
    // Derive style tag (MVP: use preset or truncate prompt)
    let styleTag = '';
    if (generation.style?.presetId) {
      // Capitalize preset
      styleTag = generation.style.presetId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else if (generation.style?.prompt) {
      // Truncate prompt
      styleTag = generation.style.prompt.slice(0, 50);
    }
    
    // Extract media paths from version
    const imagePath = version.imagePath;
    const thumbPath = version.thumbPath;
    const aspect = generation.style?.parameters?.aspect || '1:1';
    
    // Conditionally use transactions (only in production with replica set)
    const useTransaction = env.NODE_ENV === 'production';
    let session: any = null;
    
    if (useTransaction) {
      try {
        session = await startSession();
        session.startTransaction();
      } catch (error: any) {
        logger.warn('Could not start transaction for post creation, proceeding without', {
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
      
      // Create post
      const post = new Post({
        userId: userObjectId,
        tribeId: user.tribeId,
        generationId: generationObjectId,
        versionId,
        caption: caption || '',
        styleTag,
        visibility,
        media: {
          imagePath,
          thumbPath,
          aspect,
        },
        counts: {
          respects: 0,
          shares: 0,
        },
        rank: {
          qualityScore: 0.5, // Default MVP score
          hotScore: 0,
        },
        status: 'active',
      });
      
      await post.save(saveOptions);
      
      // Update user counters
      await User.findByIdAndUpdate(
        userObjectId,
        { $inc: { 'counters.posts': 1 } },
        saveOptions
      );
      
      // Update tribe counters
      await Tribe.findByIdAndUpdate(
        user.tribeId,
        { $inc: { 'stats.posts': 1 } },
        saveOptions
      );
      
      // Commit transaction if we started one
      if (useTransaction && session) {
        try {
          await session.commitTransaction();
        } catch (commitError: any) {
          logger.warn('Transaction commit failed for post creation, aborting', {
            error: commitError.message,
          });
          try {
            await session.abortTransaction();
          } catch (abortError) {
            // Ignore
          }
          // Re-run without transaction
          await post.save();
          await User.findByIdAndUpdate(
            userObjectId,
            { $inc: { 'counters.posts': 1 } }
          );
          await Tribe.findByIdAndUpdate(
            user.tribeId,
            { $inc: { 'stats.posts': 1 } }
          );
        }
      }
      
      const postId = post._id.toString();
      
      // Cache idempotency key using Redis/cache
      if (idempotencyKey) {
        const cacheKey = `idempotency:post:${userId}:${idempotencyKey}`;
        await cacheService.set(cacheKey, postId, IDEMPOTENCY_TTL);
      }
      
      logger.info('Post created', {
        postId,
        userId,
        generationId,
        versionId,
      });
      
      return {
        success: true,
        postId,
      };
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
    logger.error('Error creating post', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Get post by ID with enriched data
 */
export async function getPostById(
  postId: string,
  viewerUserId?: string
): Promise<any> {
  try {
    if (!Types.ObjectId.isValid(postId)) {
      return null;
    }
    
    const post = await Post.findById(postId)
      .populate('userId', 'username displayName avatar')
      .populate('tribeId', 'name slug');
    
    if (!post || post.status !== 'active') {
      return null;
    }
    
    // Check if viewer has respected
    let hasRespected = false;
    if (viewerUserId) {
      const { Respect } = await import('../models/Respect');
      const respect = await Respect.findOne({
        postId: post._id,
        userId: new Types.ObjectId(viewerUserId),
      });
      hasRespected = !!respect;
    }
    
    // Generate signed URLs
    const imageUrl = await generateSignedReadUrl(post.media.imagePath);
    const thumbUrl = await generateSignedReadUrl(post.media.thumbPath);
    
    const user = post.userId as any;
    let avatarThumbUrl = '';
    if (user.avatar?.thumbPath) {
      avatarThumbUrl = await generateSignedReadUrl(user.avatar.thumbPath);
    }
    
    const tribe = post.tribeId as any;
    
    return {
      postId: post._id.toString(),
      imageUrl,
      thumbUrl,
      aspect: post.media.aspect,
      styleTag: post.styleTag,
      caption: post.caption,
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarThumbUrl,
      },
      tribe: {
        id: tribe._id.toString(),
        slug: tribe.slug,
        name: tribe.name,
      },
      counts: post.counts,
      viewerState: {
        hasRespected,
      },
      canTryStyle: true, // MVP: always true
      createdAt: post.createdAt,
    };
  } catch (error: any) {
    logger.error('Error getting post', error);
    return null;
  }
}

/**
 * Get user's posts (profile grid)
 */
export async function getUserPosts(
  username: string,
  limit: number = 20,
  cursor?: string
): Promise<{
  posts: any[];
  nextCursor?: string;
  userNotFound?: boolean;
}> {
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      return { posts: [], userNotFound: true };
    }
    
    // Clamp limit (min 1, max 50)
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    
    // Parse cursor
    let lastCreatedAt: Date | undefined;
    let lastId: Types.ObjectId | undefined;
    
    if (cursor) {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, id] = decoded.split('|');
      lastCreatedAt = new Date(timestamp);
      lastId = new Types.ObjectId(id);
    }
    
    // Build query
    const query: any = {
      userId: user._id,
      status: 'active',
    };
    
    if (lastCreatedAt && lastId) {
      query.$or = [
        { createdAt: { $lt: lastCreatedAt } },
        { createdAt: lastCreatedAt, _id: { $lt: lastId } },
      ];
    }
    
    // Fetch posts
    const posts = await Post.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1);
    
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    
    // Generate signed URLs
    const enrichedPosts = await Promise.all(
      items.map(async (post) => {
        const thumbUrl = await generateSignedReadUrl(post.media.thumbPath);
        return {
          postId: post._id.toString(),
          thumbUrl,
          aspect: post.media.aspect,
          counts: post.counts,
          createdAt: post.createdAt,
        };
      })
    );
    
    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore) {
      const lastPost = items[items.length - 1];
      const cursorData = `${lastPost.createdAt.toISOString()}|${lastPost._id}`;
      nextCursor = Buffer.from(cursorData, 'utf-8').toString('base64');
    }
    
    return {
      posts: enrichedPosts,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error getting user posts', error);
    return { posts: [] };
  }
}

/**
 * Get tribe posts (tribe grid)
 */
export async function getTribePosts(
  slug: string,
  limit: number = 20,
  cursor?: string
): Promise<{
  posts: any[];
  nextCursor?: string;
}> {
  try {
    // Find tribe by slug
    const tribe = await Tribe.findOne({ slug });
    
    if (!tribe) {
      return { posts: [] };
    }
    
    // Clamp limit (min 1, max 50)
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    
    // Parse cursor
    let lastCreatedAt: Date | undefined;
    let lastId: Types.ObjectId | undefined;
    
    if (cursor) {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, id] = decoded.split('|');
      lastCreatedAt = new Date(timestamp);
      lastId = new Types.ObjectId(id);
    }
    
    // Build query
    const query: any = {
      tribeId: tribe._id,
      status: 'active',
    };
    
    if (lastCreatedAt && lastId) {
      query.$or = [
        { createdAt: { $lt: lastCreatedAt } },
        { createdAt: lastCreatedAt, _id: { $lt: lastId } },
      ];
    }
    
    // Fetch posts
    const posts = await Post.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(safeLimit + 1);
    
    const hasMore = posts.length > safeLimit;
    const items = hasMore ? posts.slice(0, safeLimit) : posts;
    
    // Generate signed URLs
    const enrichedPosts = await Promise.all(
      items.map(async (post) => {
        const thumbUrl = await generateSignedReadUrl(post.media.thumbPath);
        return {
          postId: post._id.toString(),
          thumbUrl,
          aspect: post.media.aspect,
          counts: post.counts,
          createdAt: post.createdAt,
        };
      })
    );
    
    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore) {
      const lastPost = items[items.length - 1];
      const cursorData = `${lastPost.createdAt.toISOString()}|${lastPost._id}`;
      nextCursor = Buffer.from(cursorData, 'utf-8').toString('base64');
    }
    
    return {
      posts: enrichedPosts,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error getting tribe posts', error);
    return { posts: [] };
  }
}

/**
 * Track share (increment counter)
 */
export async function trackShare(postId: string): Promise<boolean> {
  try {
    if (!Types.ObjectId.isValid(postId)) {
      return false;
    }
    
    await Post.findByIdAndUpdate(
      postId,
      { $inc: { 'counts.shares': 1 } }
    );
    
    logger.info('Share tracked', { postId });
    return true;
  } catch (error: any) {
    logger.error('Error tracking share', error);
    return false;
  }
}



