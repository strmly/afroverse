import { Types } from 'mongoose';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Tribe } from '../models/Tribe';
import { Respect } from '../models/Respect';
import { logger } from '../utils/logger';
import { generateSignedReadUrl } from './media.service';

/**
 * Feed Service
 * 
 * Tribe-first feed with dual cursor pagination.
 * 
 * Algorithm:
 * 1. Fetch tribe posts (60% of limit)
 * 2. Fetch discovery posts (40% of limit)
 * 3. Interleave 2:1 pattern
 * 4. Return dual cursors for stable pagination
 */

export interface FeedCursor {
  tribe?: string;
  discover?: string;
}

export interface FeedItem {
  postId: string;
  thumbUrl: string;
  imageUrl?: string; // Optional in feed for performance
  aspect: string;
  styleTag?: string;
  caption?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarThumbUrl: string;
  };
  tribe: {
    id: string;
    slug: string;
    name: string;
  };
  counts: {
    respects: number;
    shares: number;
  };
  viewerState: {
    hasRespected: boolean;
  };
  canTryStyle: boolean;
  hasWatermark: boolean; // Indicates if image has visible watermark
  createdAt: Date;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: FeedCursor;
}

/**
 * Parse cursor from base64 encoded string
 */
function parseCursor(cursor: string): { lastCreatedAt: Date; lastId: Types.ObjectId } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, id] = decoded.split('|');
    return {
      lastCreatedAt: new Date(timestamp),
      lastId: new Types.ObjectId(id),
    };
  } catch {
    return null;
  }
}

/**
 * Encode cursor to base64
 */
function encodeCursor(createdAt: Date, id: Types.ObjectId): string {
  const data = `${createdAt.toISOString()}|${id.toString()}`;
  return Buffer.from(data, 'utf-8').toString('base64');
}

/**
 * Fetch tribe posts (same tribe as user)
 */
async function fetchTribePosts(
  tribeId: Types.ObjectId,
  limit: number,
  cursor?: string
): Promise<any[]> {
  // Parse cursor
  let cursorData = cursor ? parseCursor(cursor) : null;
  
  // Build query
  const query: any = {
    tribeId,
    status: 'active',
  };
  
  if (cursorData) {
    query.$or = [
      { createdAt: { $lt: cursorData.lastCreatedAt } },
      {
        createdAt: cursorData.lastCreatedAt,
        _id: { $lt: cursorData.lastId },
      },
    ];
  }
  
  // Fetch posts
  const posts = await Post.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  
  return posts;
}

/**
 * Fetch discovery posts (other tribes, public only)
 */
async function fetchDiscoveryPosts(
  excludeTribeId: Types.ObjectId,
  limit: number,
  cursor?: string
): Promise<any[]> {
  // Parse cursor
  let cursorData = cursor ? parseCursor(cursor) : null;
  
  // Build query
  const query: any = {
    tribeId: { $ne: excludeTribeId },
    visibility: 'public',
    status: 'active',
  };
  
  if (cursorData) {
    query.$or = [
      { createdAt: { $lt: cursorData.lastCreatedAt } },
      {
        createdAt: cursorData.lastCreatedAt,
        _id: { $lt: cursorData.lastId },
      },
    ];
  }
  
  // Fetch posts
  const posts = await Post.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .lean();
  
  return posts;
}

/**
 * Batch hydrate users and tribes
 * Avoids N+1 queries
 */
async function hydratePostData(posts: any[]): Promise<{
  users: Map<string, any>;
  tribes: Map<string, any>;
}> {
  // Extract unique IDs
  const userIds = [...new Set(posts.map((p) => p.userId.toString()))];
  const tribeIds = [...new Set(posts.map((p) => p.tribeId.toString()))];
  
  // Fetch users
  const users = await User.find({
    _id: { $in: userIds.map((id) => new Types.ObjectId(id)) },
  })
    .select('username displayName avatar')
    .lean();
  
  // Fetch tribes
  const tribes = await Tribe.find({
    _id: { $in: tribeIds.map((id) => new Types.ObjectId(id)) },
  })
    .select('name slug')
    .lean();
  
  // Build maps
  const userMap = new Map();
  for (const user of users) {
    userMap.set(user._id.toString(), user);
  }
  
  const tribeMap = new Map();
  for (const tribe of tribes) {
    tribeMap.set(tribe._id.toString(), tribe);
  }
  
  return { users: userMap, tribes: tribeMap };
}

/**
 * Check which posts viewer has respected
 */
async function getViewerRespects(
  viewerUserId: Types.ObjectId,
  postIds: Types.ObjectId[]
): Promise<Set<string>> {
  const respects = await Respect.find({
    userId: viewerUserId,
    postId: { $in: postIds },
  })
    .select('postId')
    .lean();
  
  return new Set(respects.map((r) => r.postId.toString()));
}

/**
 * Enrich posts with user, tribe, signed URLs
 */
async function enrichPosts(
  posts: any[],
  viewerUserId: Types.ObjectId,
  includeFullImage: boolean = false
): Promise<FeedItem[]> {
  if (posts.length === 0) {
    return [];
  }
  
  // Batch hydrate
  const { users, tribes } = await hydratePostData(posts);
  
  // Get viewer respects
  const postIds = posts.map((p) => p._id);
  const respectedSet = await getViewerRespects(viewerUserId, postIds);
  
  // Enrich each post
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      const user = users.get(post.userId.toString());
      const tribe = tribes.get(post.tribeId.toString());
      
      // Generate signed URLs - prefer watermarked versions for feed
      // Use watermarked paths if available, fallback to original
      const thumbPath = post.media.watermarkedThumbPath || post.media.thumbPath;
      const imagePath = post.media.watermarkedImagePath || post.media.imagePath;
      
      const thumbUrl = await generateSignedReadUrl(thumbPath);
      let imageUrl: string | undefined;
      if (includeFullImage) {
        imageUrl = await generateSignedReadUrl(imagePath);
      }
      
      // User avatar
      let avatarThumbUrl = '';
      if (user?.avatar?.thumbPath) {
        avatarThumbUrl = await generateSignedReadUrl(user.avatar.thumbPath);
      }
      
      return {
        postId: post._id.toString(),
        thumbUrl,
        imageUrl,
        aspect: post.media.aspect,
        styleTag: post.styleTag,
        caption: post.caption,
        user: {
          id: user?._id.toString() || '',
          username: user?.username || 'unknown',
          displayName: user?.displayName || 'Unknown',
          avatarThumbUrl,
        },
        tribe: {
          id: tribe?._id.toString() || '',
          slug: tribe?.slug || 'unknown',
          name: tribe?.name || 'Unknown',
        },
        counts: post.counts,
        viewerState: {
          hasRespected: respectedSet.has(post._id.toString()),
        },
        canTryStyle: true, // MVP: always true
        hasWatermark: post.media.hasWatermark !== false, // Default true
        createdAt: post.createdAt,
      };
    })
  );
  
  return enrichedPosts;
}

/**
 * Get feed with tribe-first algorithm
 */
export async function getFeed(
  userId: string,
  limit: number = 10,
  cursors?: FeedCursor
): Promise<FeedResponse> {
  try {
    // Validate
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    
    const userObjectId = new Types.ObjectId(userId);
    
    // Get user's tribe
    const user = await User.findById(userObjectId).select('tribeId').lean();
    
    if (!user || !user.tribeId) {
      throw new Error('User has no tribe');
    }
    
    // Clamp limit (min 1, max 50)
    const effectiveLimit = Math.min(Math.max(limit, 1), 50);
    
    // Split limit: 60% tribe, 40% discover
    const tribeLimit = Math.ceil(effectiveLimit * 0.6);
    const discoverLimit = effectiveLimit - tribeLimit;
    
    // Fetch both streams in parallel
    const [tribePosts, discoverPosts] = await Promise.all([
      fetchTribePosts(user.tribeId, tribeLimit + 1, cursors?.tribe), // +1 to check for more
      fetchDiscoveryPosts(user.tribeId, discoverLimit + 1, cursors?.discover),
    ]);
    
    // Check if there are more posts
    const hasMoreTribe = tribePosts.length > tribeLimit;
    const hasMoreDiscover = discoverPosts.length > discoverLimit;
    
    // Trim to limit
    const tribeItems = hasMoreTribe ? tribePosts.slice(0, tribeLimit) : tribePosts;
    const discoverItems = hasMoreDiscover
      ? discoverPosts.slice(0, discoverLimit)
      : discoverPosts;
    
    // Interleave: 2 tribe, 1 discover pattern
    const interleavedPosts: any[] = [];
    let tribeIdx = 0;
    let discoverIdx = 0;
    
    while (tribeIdx < tribeItems.length || discoverIdx < discoverItems.length) {
      // Add 2 tribe posts
      if (tribeIdx < tribeItems.length) {
        interleavedPosts.push(tribeItems[tribeIdx++]);
      }
      if (tribeIdx < tribeItems.length) {
        interleavedPosts.push(tribeItems[tribeIdx++]);
      }
      
      // Add 1 discover post
      if (discoverIdx < discoverItems.length) {
        interleavedPosts.push(discoverItems[discoverIdx++]);
      }
    }
    
    // Enrich posts (include full image URLs for feed display)
    const enrichedItems = await enrichPosts(interleavedPosts, userObjectId, true);
    
    // Generate next cursors
    const nextCursor: FeedCursor = {};
    
    if (hasMoreTribe && tribeItems.length > 0) {
      const lastTribe = tribeItems[tribeItems.length - 1];
      nextCursor.tribe = encodeCursor(lastTribe.createdAt, lastTribe._id);
    }
    
    if (hasMoreDiscover && discoverItems.length > 0) {
      const lastDiscover = discoverItems[discoverItems.length - 1];
      nextCursor.discover = encodeCursor(lastDiscover.createdAt, lastDiscover._id);
    }
    
    logger.info('Feed fetched', {
      userId,
      tribePostsCount: tribeItems.length,
      discoverPostsCount: discoverItems.length,
      totalItems: enrichedItems.length,
    });
    
    return {
      items: enrichedItems,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error fetching feed', error);
    throw error;
  }
}

/**
 * Get hot feed (experimental - uses hotScore)
 */
export async function getHotFeed(
  userId: string,
  limit: number = 10,
  cursor?: string
): Promise<FeedResponse> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    
    const userObjectId = new Types.ObjectId(userId);
    
    // Parse cursor (for hotScore-based pagination)
    let cursorData = cursor ? parseCursor(cursor) : null;
    
    // Build query
    const query: any = {
      status: 'active',
      visibility: 'public',
    };
    
    if (cursorData) {
      query._id = { $lt: cursorData.lastId };
    }
    
    // Fetch by hot score
    const posts = await Post.find(query)
      .sort({ 'rank.hotScore': -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    
    // Enrich
    const enrichedItems = await enrichPosts(items, userObjectId, false);
    
    // Generate cursor
    const nextCursor: FeedCursor = {};
    if (hasMore && items.length > 0) {
      const lastPost = items[items.length - 1];
      nextCursor.discover = encodeCursor(lastPost.createdAt, lastPost._id);
    }
    
    return {
      items: enrichedItems,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error fetching hot feed', error);
    throw error;
  }
}



