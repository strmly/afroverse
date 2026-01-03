import { Types } from 'mongoose';

/**
 * Data Validation Utilities
 * 
 * Enforces data model invariants at the application level.
 * Use these before database operations to catch errors early.
 */

/**
 * Validate E.164 phone number format
 */
export function isValidE164(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validate username format (URL-safe)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexRegex.test(color);
}

/**
 * Validate ObjectId
 */
export function isValidObjectId(id: string | Types.ObjectId): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Sanitize username (convert to URL-safe format)
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 30);
}

/**
 * Validate tribe slug format
 */
export function isValidTribeSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

/**
 * Validate caption length
 */
export function isValidCaption(caption: string): boolean {
  return caption.length <= 500;
}

/**
 * Validate bio length
 */
export function isValidBio(bio: string): boolean {
  return bio.length <= 280;
}

/**
 * Validate display name
 */
export function isValidDisplayName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 50;
}

/**
 * Validate aspect ratio
 */
export function isValidAspectRatio(aspect: string): boolean {
  return aspect === '1:1' || aspect === '9:16';
}

/**
 * Validate generation mode
 */
export function isValidGenerationMode(mode: string): boolean {
  return ['preset', 'prompt', 'try_style'].includes(mode);
}

/**
 * Validate visibility
 */
export function isValidVisibility(visibility: string): boolean {
  return ['tribe', 'public'].includes(visibility);
}

/**
 * Validate quality setting
 */
export function isValidQuality(quality: string): boolean {
  return ['standard', 'high'].includes(quality);
}

/**
 * Validate file mime type for selfies
 */
export function isValidSelfieMimeType(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType);
}

/**
 * Validate OTP code format (6 digits)
 */
export function isValidOTPCode(code: string): boolean {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(code);
}

/**
 * Comprehensive user data validation
 */
export interface UserValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateUserData(data: {
  phoneE164?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  tribeId?: string | Types.ObjectId;
}): UserValidationResult {
  const errors: string[] = [];
  
  if (data.phoneE164 && !isValidE164(data.phoneE164)) {
    errors.push('Invalid phone number format (must be E.164)');
  }
  
  if (data.username && !isValidUsername(data.username)) {
    errors.push('Invalid username (3-30 chars, lowercase letters, numbers, underscore only)');
  }
  
  if (data.displayName && !isValidDisplayName(data.displayName)) {
    errors.push('Invalid display name (1-50 characters)');
  }
  
  if (data.bio && !isValidBio(data.bio)) {
    errors.push('Bio too long (max 280 characters)');
  }
  
  if (data.tribeId && !isValidObjectId(data.tribeId)) {
    errors.push('Invalid tribe ID');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive generation data validation
 */
export function validateGenerationData(data: {
  mode: string;
  prompt: string;
  aspect?: string;
  quality?: string;
}): UserValidationResult {
  const errors: string[] = [];
  
  if (!isValidGenerationMode(data.mode)) {
    errors.push('Invalid generation mode');
  }
  
  if (!data.prompt || data.prompt.trim().length === 0) {
    errors.push('Prompt is required');
  }
  
  if (data.prompt && data.prompt.length > 2000) {
    errors.push('Prompt too long (max 2000 characters)');
  }
  
  if (data.aspect && !isValidAspectRatio(data.aspect)) {
    errors.push('Invalid aspect ratio');
  }
  
  if (data.quality && !isValidQuality(data.quality)) {
    errors.push('Invalid quality setting');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive post data validation
 */
export function validatePostData(data: {
  generationId: string | Types.ObjectId;
  versionId: string;
  caption?: string;
  visibility?: string;
}): UserValidationResult {
  const errors: string[] = [];
  
  if (!isValidObjectId(data.generationId)) {
    errors.push('Invalid generation ID');
  }
  
  if (!data.versionId || data.versionId.trim().length === 0) {
    errors.push('Version ID is required');
  }
  
  if (data.caption && !isValidCaption(data.caption)) {
    errors.push('Caption too long (max 500 characters)');
  }
  
  if (data.visibility && !isValidVisibility(data.visibility)) {
    errors.push('Invalid visibility setting');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}







