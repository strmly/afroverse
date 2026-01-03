import { Request, Response } from 'express';
import {
  getMyProfile,
  getUserProfile,
  updateProfile,
  setAvatar,
  getUserAvatar,
} from '../services/profile.service';
import { logger } from '../utils/logger';

/**
 * Profile Controller
 * 
 * Handles profile-related HTTP requests.
 * Enforces self vs public context server-side.
 */

/**
 * GET /me
 * 
 * Get authenticated user's profile
 */
export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const profile = await getMyProfile(userId);
    
    if (!profile) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User not found',
      });
    }
    
    return res.status(200).json(profile);
  } catch (error: any) {
    logger.error('Error in getMe controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get profile',
    });
  }
}

/**
 * PATCH /me
 * 
 * Update authenticated user's profile
 */
export async function updateMe(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { username, displayName, bio, ...forbidden } = req.body;
    
    // Check for forbidden fields
    const forbiddenFields = Object.keys(forbidden);
    if (forbiddenFields.length > 0) {
      return res.status(400).json({
        error: 'forbidden_fields',
        message: `Cannot update fields: ${forbiddenFields.join(', ')}`,
      });
    }
    
    const result = await updateProfile(userId, { username, displayName, bio });
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        username_too_short: 400,
        username_too_long: 400,
        username_invalid_format: 400,
        username_taken: 409,
        display_name_too_long: 400,
        bio_too_long: 400,
        user_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: getErrorMessage(result.error || ''),
      });
    }
    
    return res.status(200).json(result.profile);
  } catch (error: any) {
    logger.error('Error in updateMe controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to update profile',
    });
  }
}

/**
 * GET /auth/check-username?username=xxx
 * 
 * Check if username is available
 */
export async function checkUsername(req: Request, res: Response) {
  try {
    const { username } = req.query;
    const userId = req.user?.id; // Optional - to allow checking against own username
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        error: 'missing_username',
        message: 'Username is required',
      });
    }
    
    const { validateUsername, isUsernameAvailable } = await import('../services/profile.service');
    
    // Validate format
    const validation = validateUsername(username);
    if (!validation.valid) {
      return res.status(200).json({
        available: false,
        error: 'invalid_format',
        message: validation.error,
      });
    }
    
    // Check availability
    const available = await isUsernameAvailable(username, userId);
    
    if (!available) {
      // Generate suggestions
      const suggestions = [
        `${username}_${Math.floor(Math.random() * 100)}`,
        `${username}_ZA`,
        `${username}_AF`,
      ];
      
      return res.status(200).json({
        available: false,
        suggestions,
      });
    }
    
    return res.status(200).json({
      available: true,
    });
  } catch (error: any) {
    logger.error('Error checking username', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to check username',
    });
  }
}

/**
 * POST /me/avatar
 * 
 * Set avatar from generation version
 */
export async function setMyAvatar(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const { generationId, versionId } = req.body;
    
    if (!generationId || !versionId) {
      return res.status(400).json({
        error: 'missing_fields',
        message: 'generationId and versionId are required',
      });
    }
    
    const result = await setAvatar(userId, { generationId, versionId });
    
    if (!result.success) {
      const statusMap: Record<string, number> = {
        invalid_user_id: 400,
        invalid_generation_id: 400,
        generation_not_found: 404,
        not_your_generation: 403,
        generation_not_ready: 400,
        version_not_found: 404,
      };
      
      const status = statusMap[result.error || ''] || 500;
      
      return res.status(status).json({
        error: result.error,
        message: getErrorMessage(result.error || ''),
      });
    }
    
    return res.status(200).json({
      status: 'ok',
      avatar: result.avatar,
    });
  } catch (error: any) {
    logger.error('Error in setMyAvatar controller', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to set avatar',
    });
  }
}

/**
 * GET /users/:username
 * 
 * Get public user profile
 */
export async function getUserProfileController(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const viewerUserId = req.user?.id;
    
    if (!username) {
      return res.status(400).json({
        error: 'invalid_username',
        message: 'Username is required',
      });
    }
    
    const profile = await getUserProfile(username, viewerUserId);
    
    if (!profile) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User not found',
      });
    }
    
    return res.status(200).json(profile);
  } catch (error: any) {
    logger.error('Error in getUserProfileController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get user profile',
    });
  }
}

/**
 * GET /users/:username/avatar
 * 
 * Get user avatar only (lightweight)
 */
export async function getUserAvatarController(req: Request, res: Response) {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        error: 'invalid_username',
        message: 'Username is required',
      });
    }
    
    const avatar = await getUserAvatar(username);
    
    if (!avatar) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User not found or no avatar set',
      });
    }
    
    return res.status(200).json(avatar);
  } catch (error: any) {
    logger.error('Error in getUserAvatarController', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get avatar',
    });
  }
}

/**
 * Helper: Map error codes to user-friendly messages
 */
function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    invalid_user_id: 'Invalid user',
    invalid_generation_id: 'Invalid generation',
    username_too_short: 'Username too short (min 3 chars)',
    username_too_long: 'Username too long (max 20 chars)',
    username_invalid_format: 'Username can only contain letters, numbers, and underscores',
    username_taken: 'Username is already taken',
    display_name_too_long: 'Display name too long (max 30 chars)',
    bio_too_long: 'Bio too long (max 120 chars)',
    user_not_found: 'User not found',
    generation_not_found: 'Generation not found',
    not_your_generation: 'Not your generation',
    generation_not_ready: 'Generation not ready',
    version_not_found: 'Version not found',
    forbidden_fields: 'Cannot update these fields',
  };
  
  return messages[errorCode] || 'An error occurred';
}





