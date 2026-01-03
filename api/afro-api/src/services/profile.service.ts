import { Types } from 'mongoose';
import { User, IUser } from '../models/User';
import { Generation } from '../models/Generation';
import { Tribe } from '../models/Tribe';
import { logger } from '../utils/logger';
import { generateSignedReadUrl } from './media.service';

/**
 * Profile Service
 * 
 * Handles user profile operations with strict privacy rules:
 * - Avatar must come from generations only
 * - Never expose private data (phone, selfies)
 * - Self vs public context enforcement
 * - Fast queries with denormalized data
 */

export interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  tribe: {
    id: string;
    slug: string;
    name: string;
  };
  avatar?: {
    imageUrl: string;
    thumbUrl: string;
    generationId?: string;
    versionId?: string;
  };
  counters: {
    posts: number;
    respectsReceived: number;
    followers: number;
    following: number;
  };
  viewerState?: {
    isSelf: boolean;
  };
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
}

export interface SetAvatarInput {
  generationId: string;
  versionId: string;
}

/**
 * Get authenticated user's profile (self)
 */
export async function getMyProfile(userId: string): Promise<ProfileData | null> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }
    
    const user = await User.findById(userId)
      .populate('tribeId', 'name slug')
      .lean();
    
    if (!user) {
      return null;
    }
    
    const tribe = user.tribeId as any;
    
    // Generate signed URLs for avatar
    let avatar: ProfileData['avatar'] | undefined;
    if (user.avatar?.thumbPath) {
      const imageUrl = await generateSignedReadUrl(user.avatar.imagePath);
      const thumbUrl = await generateSignedReadUrl(user.avatar.thumbPath);
      
      avatar = {
        imageUrl,
        thumbUrl,
        generationId: user.avatar.generationId?.toString(),
        versionId: user.avatar.versionId,
      };
    }
    
    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio,
      tribe: {
        id: tribe._id.toString(),
        slug: tribe.slug,
        name: tribe.name,
      },
      avatar,
      counters: {
        posts: user.counters?.posts || 0,
        respectsReceived: user.counters?.respectsReceived || 0,
        followers: (user as any).followersCount || 0,
        following: (user as any).followingCount || 0,
      },
      viewerState: {
        isSelf: true,
      },
    };
  } catch (error: any) {
    logger.error('Error getting my profile', error);
    return null;
  }
}

/**
 * Get public profile by username
 */
export async function getUserProfile(
  username: string,
  viewerUserId?: string
): Promise<ProfileData | null> {
  try {
    // Case-insensitive lookup
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    })
      .populate('tribeId', 'name slug')
      .lean();
    
    if (!user) {
      return null;
    }
    
    // Check if banned
    if (user.status?.banned) {
      return null;
    }
    
    const tribe = user.tribeId as any;
    
    // Generate signed URLs for avatar (public view)
    let avatar: ProfileData['avatar'] | undefined;
    if (user.avatar?.thumbPath) {
      const imageUrl = await generateSignedReadUrl(user.avatar.imagePath);
      const thumbUrl = await generateSignedReadUrl(user.avatar.thumbPath);
      
      avatar = {
        imageUrl,
        thumbUrl,
        // Don't expose generationId/versionId for public profiles
      };
    }
    
    // Determine if viewer is self
    const isSelf = viewerUserId
      ? viewerUserId === user._id.toString()
      : false;
    
    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.username,
      bio: user.bio,
      tribe: {
        id: tribe._id.toString(),
        slug: tribe.slug,
        name: tribe.name,
      },
      avatar,
      counters: {
        posts: user.counters?.posts || 0,
        respectsReceived: user.counters?.respectsReceived || 0,
        followers: (user as any).followersCount || 0,
        following: (user as any).followingCount || 0,
      },
      viewerState: {
        isSelf,
      },
    };
  } catch (error: any) {
    logger.error('Error getting user profile', error);
    return null;
  }
}

/**
 * Update profile (username, display name, and bio)
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string; profile?: ProfileData }> {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    
    // Validate input
    const updates: any = {};
    
    // Username validation
    if (input.username !== undefined) {
      const username = input.username.trim().toLowerCase();
      
      // Validate format
      const validation = validateUsername(username);
      if (!validation.valid) {
        return { success: false, error: 'username_invalid_format' };
      }
      
      // Check availability (excluding current user)
      const available = await isUsernameAvailable(username, userId);
      if (!available) {
        return { success: false, error: 'username_taken' };
      }
      
      updates.username = username;
    }
    
    if (input.displayName !== undefined) {
      // Normalize empty string to null
      const displayName = input.displayName.trim();
      
      if (displayName.length === 0) {
        updates.displayName = null;
      } else if (displayName.length > 30) {
        return { success: false, error: 'display_name_too_long' };
      } else {
        updates.displayName = displayName;
      }
    }
    
    if (input.bio !== undefined) {
      // Normalize empty string to null
      const bio = input.bio.trim();
      
      if (bio.length === 0) {
        updates.bio = null;
      } else if (bio.length > 120) {
        return { success: false, error: 'bio_too_long' };
      } else {
        updates.bio = bio;
      }
    }
    
    // Update user
    await User.findByIdAndUpdate(userId, {
      $set: updates,
    });
    
    // Return updated profile
    const profile = await getMyProfile(userId);
    
    if (!profile) {
      return { success: false, error: 'user_not_found' };
    }
    
    logger.info('Profile updated', { userId, updates });
    
    return {
      success: true,
      profile,
    };
  } catch (error: any) {
    logger.error('Error updating profile', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Set avatar from generation version
 * 
 * Avatar MUST come from a generation, never arbitrary upload.
 * This enforces identity continuity and cultural context.
 */
export async function setAvatar(
  userId: string,
  input: SetAvatarInput
): Promise<{
  success: boolean;
  error?: string;
  avatar?: {
    imageUrl: string;
    thumbUrl: string;
  };
}> {
  try {
    // Validate IDs
    if (!Types.ObjectId.isValid(userId)) {
      return { success: false, error: 'invalid_user_id' };
    }
    if (!Types.ObjectId.isValid(input.generationId)) {
      return { success: false, error: 'invalid_generation_id' };
    }
    
    const userObjectId = new Types.ObjectId(userId);
    const generationObjectId = new Types.ObjectId(input.generationId);
    
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
    const version = generation.versions.find((v) => v.versionId === input.versionId);
    
    if (!version) {
      return { success: false, error: 'version_not_found' };
    }
    
    // Update user avatar
    await User.findByIdAndUpdate(userObjectId, {
      $set: {
        avatar: {
          generationId: generationObjectId,
          versionId: input.versionId,
          imagePath: version.imagePath,
          thumbPath: version.thumbPath,
          updatedAt: new Date(),
        },
      },
    });
    
    // Generate signed URLs for response
    const imageUrl = await generateSignedReadUrl(version.imagePath);
    const thumbUrl = await generateSignedReadUrl(version.thumbPath);
    
    logger.info('Avatar updated', {
      userId,
      generationId: input.generationId,
      versionId: input.versionId,
    });
    
    return {
      success: true,
      avatar: {
        imageUrl,
        thumbUrl,
      },
    };
  } catch (error: any) {
    logger.error('Error setting avatar', error);
    return {
      success: false,
      error: error.message || 'internal_error',
    };
  }
}

/**
 * Get user avatar only (lightweight)
 */
export async function getUserAvatar(username: string): Promise<{
  thumbUrl?: string;
} | null> {
  try {
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    })
      .select('avatar')
      .lean();
    
    if (!user || !user.avatar?.thumbPath) {
      return null;
    }
    
    const thumbUrl = await generateSignedReadUrl(user.avatar.thumbPath);
    
    return { thumbUrl };
  } catch (error: any) {
    logger.error('Error getting user avatar', error);
    return null;
  }
}

/**
 * Validate username format
 * 
 * Rules:
 * - 3-20 characters
 * - Alphanumeric + underscore only
 * - No consecutive underscores
 * - Cannot start/end with underscore
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return { valid: false, error: 'Username too short (min 3 chars)' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Username too long (max 20 chars)' };
  }
  
  // Alphanumeric + underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  // Cannot start or end with underscore
  if (username.startsWith('_') || username.endsWith('_')) {
    return { valid: false, error: 'Username cannot start or end with underscore' };
  }
  
  // No consecutive underscores
  if (username.includes('__')) {
    return { valid: false, error: 'Username cannot have consecutive underscores' };
  }
  
  return { valid: true };
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  try {
    const query: any = {
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    };
    
    // Exclude current user when checking (for updates)
    if (excludeUserId && Types.ObjectId.isValid(excludeUserId)) {
      query._id = { $ne: new Types.ObjectId(excludeUserId) };
    }
    
    const existing = await User.findOne(query)
      .select('_id')
      .lean();
    
    return !existing;
  } catch (error: any) {
    logger.error('Error checking username availability', error);
    return false;
  }
}

