import mongoose, { Types, startSession } from 'mongoose';
import { Tribe, ITribe } from '../models/Tribe';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { logger } from '../utils/logger';
import { generateSignedReadUrl } from './media.service';
import { env } from '../config/env';

/**
 * Tribe Service
 * 
 * Handles tribe operations with proper data integrity:
 * - Atomic join operations with counter updates
 * - Visibility enforcement
 * - Member/post listings with pagination
 * - Counter reconciliation
 */

export interface TribeListItem {
  id: string;
  slug: string;
  name: string;
  motto: string;
  accentColor: string;
  iconUrl: string;
  stats: {
    members: number;
    posts: number;
  };
}

export interface TribeDetail extends TribeListItem {
  viewerState: {
    isMember: boolean;
  };
}

export interface JoinTribeResult {
  success: boolean;
  error?: string;
  tribe?: {
    id: string;
    slug: string;
    name: string;
  };
}

/**
 * Get all tribes (for directory/onboarding)
 */
export async function getAllTribes(): Promise<TribeListItem[]> {
  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database not connected');
  }
  try {
    const tribes = await Tribe.find({}).lean();
    
    return tribes.map((tribe) => ({
      id: tribe._id.toString(),
      slug: tribe.slug,
      name: tribe.name,
      motto: tribe.motto || '',
      accentColor: tribe.accentColor || '#000000',
      iconUrl: `/icons/tribe-icons/${tribe.slug}.svg`, // Static asset
      stats: {
        members: tribe.stats?.members || 0,
        posts: tribe.stats?.posts || 0,
      },
    }));
  } catch (error: any) {
    logger.error('Error getting all tribes', error);
    throw error;
  }
}

/**
 * Get tribe by slug with viewer state
 */
export async function getTribeBySlug(
  slug: string,
  viewerUserId?: string
): Promise<TribeDetail | null> {
  try {
    const tribe = await Tribe.findOne({ slug }).lean();
    
    if (!tribe) {
      return null;
    }
    
    // Check if viewer is member
    let isMember = false;
    if (viewerUserId) {
      const user = await User.findById(viewerUserId).select('tribeId').lean();
      isMember = user?.tribeId?.toString() === tribe._id.toString();
    }
    
    return {
      id: tribe._id.toString(),
      slug: tribe.slug,
      name: tribe.name,
      motto: tribe.motto || '',
      accentColor: tribe.accentColor || '#000000',
      iconUrl: `/icons/tribe-icons/${tribe.slug}.svg`,
      stats: {
        members: tribe.stats?.members || 0,
        posts: tribe.stats?.posts || 0,
      },
      viewerState: {
        isMember,
      },
    };
  } catch (error: any) {
    logger.error('Error getting tribe by slug', error);
    return null;
  }
}

/**
 * Join tribe (atomic with counter update)
 * 
 * Rules:
 * - User can only join once
 * - Transaction ensures counter integrity
 * - No switching tribes in MVP
 */
export async function joinTribe(
  userId: string,
  slug: string
): Promise<JoinTribeResult> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    const userObjectId = new Types.ObjectId(userId);
    
    // Load user
    const user = await User.findById(userObjectId);
    
    if (!user) {
      return { success: false, error: 'user_not_found' };
    }
    
    // Check if user already has tribe
    if (user.tribeId) {
      return { success: false, error: 'tribe_already_selected' };
    }
    
    // Load tribe
    const tribe = await Tribe.findOne({ slug });
    
    if (!tribe) {
      return { success: false, error: 'tribe_not_found' };
    }
    
    // In development, skip transactions (requires replica set)
    // In production with replica set, use transactions for atomicity
    const useTransaction = env.NODE_ENV === 'production';
    let session: any = null;
    
    if (useTransaction) {
      try {
        session = await startSession();
        session.startTransaction();
      } catch (error: any) {
        logger.warn('Could not start transaction, proceeding without', {
          error: error.message,
        });
        // Fall back to non-transactional
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
      const updateOptions = useTransaction && session ? { session } : {};
      
      // Update user
      await User.findByIdAndUpdate(
        userObjectId,
        {
          $set: {
            tribeId: tribe._id,
            tribeJoinedAt: new Date(),
          },
        },
        updateOptions
      );
      
      // Increment tribe member count
      await Tribe.findByIdAndUpdate(
        tribe._id,
        { $inc: { 'stats.members': 1 } },
        updateOptions
      );
      
      // Commit transaction if we started one
      if (useTransaction && session) {
        try {
          await session.commitTransaction();
        } catch (commitError: any) {
          // If commit fails, abort and fall back
          logger.warn('Transaction commit failed, aborting', {
            error: commitError.message,
          });
          try {
            await session.abortTransaction();
          } catch (abortError) {
            // Ignore
          }
          // Re-run without transaction
          await User.findByIdAndUpdate(
            userObjectId,
            {
              $set: {
                tribeId: tribe._id,
                tribeJoinedAt: new Date(),
              },
            }
          );
          await Tribe.findByIdAndUpdate(
            tribe._id,
            { $inc: { 'stats.members': 1 } }
          );
        }
      }
      
      logger.info('User joined tribe', {
        userId,
        tribeId: tribe._id.toString(),
        tribeName: tribe.name,
      });
      
      return {
        success: true,
        tribe: {
          id: tribe._id.toString(),
          slug: tribe.slug,
          name: tribe.name,
        },
      };
    } catch (error: any) {
      // If error is transaction-related, try again without transaction
      if (error.code === 20 || error.codeName === 'IllegalOperation') {
        logger.warn('Transaction error detected, retrying without transaction', {
          error: error.message,
        });
        
        // Abort transaction if we started one
        if (session) {
          try {
            await session.abortTransaction();
            session.endSession();
          } catch (abortError) {
            // Ignore
          }
        }
        
        // Retry without transaction
        try {
          await User.findByIdAndUpdate(
            userObjectId,
            {
              $set: {
                tribeId: tribe._id,
                tribeJoinedAt: new Date(),
              },
            }
          );
          
          await Tribe.findByIdAndUpdate(
            tribe._id,
            { $inc: { 'stats.members': 1 } }
          );
          
          logger.info('User joined tribe (retry without transaction)', {
            userId,
            tribeId: tribe._id.toString(),
            tribeName: tribe.name,
          });
          
          return {
            success: true,
            tribe: {
              id: tribe._id.toString(),
              slug: tribe.slug,
              name: tribe.name,
            },
          };
        } catch (retryError: any) {
          logger.error('Error joining tribe (retry failed)', retryError);
          throw retryError;
        }
      }
      
      // Abort transaction if we started one
      if (useTransaction && session) {
        try {
          await session.abortTransaction();
        } catch (abortError) {
          // Ignore abort errors
        }
      }
      
      throw error;
    } finally {
      // End session if we created one
      if (session) {
        try {
          session.endSession();
        } catch (endError) {
          // Ignore end session errors
        }
      }
    }
  } catch (error: any) {
    logger.error('Error joining tribe', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Get tribe posts (grid view)
 * 
 * Visibility rules:
 * - Members see: tribe + public posts
 * - Non-members see: public posts only
 */
export async function getTribePosts(
  slug: string,
  viewerUserId: string,
  limit: number = 12,
  cursor?: string
): Promise<{
  items: Array<{
    postId: string;
    thumbUrl: string;
    aspect: string;
  }>;
  nextCursor?: string;
}> {
  try {
    // Get tribe
    const tribe = await Tribe.findOne({ slug }).lean();
    
    if (!tribe) {
      return { items: [] };
    }
    
    // Check if viewer is member
    let isMember = false;
    if (viewerUserId && Types.ObjectId.isValid(viewerUserId)) {
      const user = await User.findById(viewerUserId).select('tribeId').lean();
      isMember = user?.tribeId?.toString() === tribe._id.toString();
    }
    
    // Determine allowed visibilities
    const allowedVisibilities = isMember
      ? ['tribe', 'public']
      : ['public'];
    
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
      visibility: { $in: allowedVisibilities },
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
      .limit(limit + 1)
      .lean();
    
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
      items: enrichedPosts,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error getting tribe posts', error);
    return { items: [] };
  }
}

/**
 * Get tribe members
 */
export async function getTribeMembers(
  slug: string,
  limit: number = 20,
  cursor?: string
): Promise<{
  items: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarThumbUrl: string;
  }>;
  nextCursor?: string;
}> {
  try {
    // Get tribe
    const tribe = await Tribe.findOne({ slug }).lean();
    
    if (!tribe) {
      return { items: [] };
    }
    
    // Parse cursor
    let lastJoinedAt: Date | undefined;
    let lastId: Types.ObjectId | undefined;
    
    if (cursor) {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const [timestamp, id] = decoded.split('|');
      lastJoinedAt = new Date(timestamp);
      lastId = new Types.ObjectId(id);
    }
    
    // Build query
    const query: any = {
      tribeId: tribe._id,
    };
    
    if (lastJoinedAt && lastId) {
      query.$or = [
        { tribeJoinedAt: { $lt: lastJoinedAt } },
        { tribeJoinedAt: lastJoinedAt, _id: { $lt: lastId } },
      ];
    }
    
    // Fetch members
    const members = await User.find(query)
      .sort({ tribeJoinedAt: -1, _id: -1 })
      .limit(limit + 1)
      .select('username displayName avatar tribeJoinedAt')
      .lean();
    
    const hasMore = members.length > limit;
    const items = hasMore ? members.slice(0, limit) : members;
    
    // Generate signed URLs for avatars
    const enrichedMembers = await Promise.all(
      items.map(async (member) => {
        let avatarThumbUrl = '';
        if (member.avatar?.thumbPath) {
          avatarThumbUrl = await generateSignedReadUrl(member.avatar.thumbPath);
        }
        
        return {
          id: member._id.toString(),
          username: member.username,
          displayName: member.displayName || member.username,
          avatarThumbUrl,
        };
      })
    );
    
    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasMore) {
      const lastMember = items[items.length - 1];
      const cursorData = `${lastMember.tribeJoinedAt?.toISOString()}|${lastMember._id}`;
      nextCursor = Buffer.from(cursorData, 'utf-8').toString('base64');
    }
    
    return {
      items: enrichedMembers,
      nextCursor,
    };
  } catch (error: any) {
    logger.error('Error getting tribe members', error);
    return { items: [] };
  }
}

/**
 * Repair tribe counters (nightly job)
 * 
 * Reconciles:
 * - stats.members with actual user count
 * - stats.posts with actual post count
 */
export async function repairTribeCounters(): Promise<{
  repaired: number;
  errors: number;
}> {
  let repaired = 0;
  let errors = 0;
  
  try {
    logger.info('Starting tribe counter repair job');
    
    // Get all tribes
    const tribes = await Tribe.find({}).lean();
    
    for (const tribe of tribes) {
      try {
        // Count actual members
        const actualMembers = await User.countDocuments({
          tribeId: tribe._id,
        });
        
        // Count actual posts
        const actualPosts = await Post.countDocuments({
          tribeId: tribe._id,
          status: 'active',
        });
        
        // Check for drift
        const membersDrift = actualMembers !== (tribe.stats?.members || 0);
        const postsDrift = actualPosts !== (tribe.stats?.posts || 0);
        
        if (membersDrift || postsDrift) {
          logger.warn('Tribe counter drift detected', {
            tribeId: tribe._id.toString(),
            tribeName: tribe.name,
            storedMembers: tribe.stats?.members || 0,
            actualMembers,
            membersDrift: actualMembers - (tribe.stats?.members || 0),
            storedPosts: tribe.stats?.posts || 0,
            actualPosts,
            postsDrift: actualPosts - (tribe.stats?.posts || 0),
          });
          
          // Update to actual counts
          await Tribe.findByIdAndUpdate(tribe._id, {
            $set: {
              'stats.members': actualMembers,
              'stats.posts': actualPosts,
            },
          });
          
          repaired++;
        }
      } catch (error: any) {
        logger.error('Error repairing tribe counters', {
          tribeId: tribe._id,
          error,
        });
        errors++;
      }
    }
    
    logger.info('Tribe counter repair completed', { repaired, errors });
    
    return { repaired, errors };
  } catch (error: any) {
    logger.error('Tribe counter repair failed', error);
    return { repaired, errors };
  }
}

/**
 * Verify user's tribe membership
 * 
 * Used to enforce posting permissions
 */
export async function verifyTribeMembership(
  userId: string,
  expectedTribeId: string
): Promise<boolean> {
  try {
    const user = await User.findById(userId).select('tribeId').lean();
    
    if (!user || !user.tribeId) {
      return false;
    }
    
    return user.tribeId.toString() === expectedTribeId;
  } catch (error: any) {
    logger.error('Error verifying tribe membership', error);
    return false;
  }
}

