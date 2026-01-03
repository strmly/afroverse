/**
 * Validation Schemas
 * 
 * Centralized validation schemas for API requests.
 * Using plain validation functions instead of Zod to avoid adding dependencies.
 */

import { Types } from 'mongoose';

export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: {
    field: string;
    message: string;
  };
}

/**
 * Validate ObjectId
 */
export function validateObjectId(value: any, fieldName: string = 'id'): ValidationResult {
  if (!value) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} is required`,
      },
    };
  }

  if (!Types.ObjectId.isValid(value)) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `Invalid ${fieldName}`,
      },
    };
  }

  return { success: true, data: value };
}

/**
 * Validate array of ObjectIds
 */
export function validateObjectIdArray(
  value: any,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 10
): ValidationResult {
  if (!value) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} is required`,
      },
    };
  }

  if (!Array.isArray(value)) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be an array`,
      },
    };
  }

  if (value.length < minLength) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must have at least ${minLength} item(s)`,
      },
    };
  }

  if (value.length > maxLength) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must have at most ${maxLength} item(s)`,
      },
    };
  }

  for (const item of value) {
    if (!Types.ObjectId.isValid(item)) {
      return {
        success: false,
        error: {
          field: fieldName,
          message: `${fieldName} contains invalid ID`,
        },
      };
    }
  }

  return { success: true, data: value };
}

/**
 * Validate string
 */
export function validateString(
  value: any,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = 1000,
  required: boolean = true
): ValidationResult {
  if (!value) {
    if (required) {
      return {
        success: false,
        error: {
          field: fieldName,
          message: `${fieldName} is required`,
        },
      };
    }
    return { success: true, data: undefined };
  }

  if (typeof value !== 'string') {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a string`,
      },
    };
  }

  if (value.length < minLength) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters`,
      },
    };
  }

  if (value.length > maxLength) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at most ${maxLength} characters`,
      },
    };
  }

  return { success: true, data: value };
}

/**
 * Validate enum
 */
export function validateEnum(
  value: any,
  fieldName: string,
  allowedValues: string[],
  required: boolean = true
): ValidationResult {
  if (!value) {
    if (required) {
      return {
        success: false,
        error: {
          field: fieldName,
          message: `${fieldName} is required`,
        },
      };
    }
    return { success: true, data: undefined };
  }

  if (!allowedValues.includes(value)) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      },
    };
  }

  return { success: true, data: value };
}

/**
 * Validate number
 */
export function validateNumber(
  value: any,
  fieldName: string,
  min?: number,
  max?: number,
  required: boolean = true
): ValidationResult {
  if (value === undefined || value === null) {
    if (required) {
      return {
        success: false,
        error: {
          field: fieldName,
          message: `${fieldName} is required`,
        },
      };
    }
    return { success: true, data: undefined };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || typeof num !== 'number') {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be a number`,
      },
    };
  }

  if (min !== undefined && num < min) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
      },
    };
  }

  if (max !== undefined && num > max) {
    return {
      success: false,
      error: {
        field: fieldName,
        message: `${fieldName} must be at most ${max}`,
      },
    };
  }

  return { success: true, data: num };
}

/**
 * Create Generation Schema
 */
export function validateCreateGeneration(body: any): ValidationResult {
  // Validate selfieIds
  const selfieIdsResult = validateObjectIdArray(body.selfieIds, 'selfieIds', 1, 3);
  if (!selfieIdsResult.success) {
    return selfieIdsResult;
  }

  // Validate mode
  const modeResult = validateEnum(body.mode, 'mode', ['preset', 'prompt', 'try_style']);
  if (!modeResult.success) {
    return modeResult;
  }

  // Validate optional fields
  if (body.seedPostId) {
    const seedResult = validateObjectId(body.seedPostId, 'seedPostId');
    if (!seedResult.success) {
      return seedResult;
    }
  }

  if (body.presetId) {
    const presetResult = validateString(body.presetId, 'presetId', 1, 100, false);
    if (!presetResult.success) {
      return presetResult;
    }
  }

  if (body.prompt) {
    const promptResult = validateString(body.prompt, 'prompt', 1, 500, false);
    if (!promptResult.success) {
      return promptResult;
    }
  }

  if (body.negativePrompt) {
    const negPromptResult = validateString(body.negativePrompt, 'negativePrompt', 0, 500, false);
    if (!negPromptResult.success) {
      return negPromptResult;
    }
  }

  if (body.aspect) {
    const aspectResult = validateEnum(body.aspect, 'aspect', ['1:1', '9:16'], false);
    if (!aspectResult.success) {
      return aspectResult;
    }
  }

  if (body.quality) {
    const qualityResult = validateEnum(body.quality, 'quality', ['standard', 'hd'], false);
    if (!qualityResult.success) {
      return qualityResult;
    }
  }

  return { success: true, data: body };
}

/**
 * Create Post Schema
 */
export function validateCreatePost(body: any): ValidationResult {
  // Validate generationId
  const genResult = validateObjectId(body.generationId, 'generationId');
  if (!genResult.success) {
    return genResult;
  }

  // Validate versionId
  const versionResult = validateString(body.versionId, 'versionId', 1, 100);
  if (!versionResult.success) {
    return versionResult;
  }

  // Validate optional caption
  if (body.caption) {
    const captionResult = validateString(body.caption, 'caption', 0, 500, false);
    if (!captionResult.success) {
      return captionResult;
    }
  }

  // Validate optional visibility
  if (body.visibility) {
    const visResult = validateEnum(body.visibility, 'visibility', ['tribe', 'public'], false);
    if (!visResult.success) {
      return visResult;
    }
  }

  return { success: true, data: body };
}

/**
 * Init Selfie Upload Schema
 */
export function validateInitSelfieUpload(body: any): ValidationResult {
  const mimeResult = validateEnum(
    body.mimeType,
    'mimeType',
    ['image/jpeg', 'image/png', 'image/webp']
  );
  
  if (!mimeResult.success) {
    return mimeResult;
  }

  return { success: true, data: body };
}

/**
 * Complete Selfie Upload Schema
 */
export function validateCompleteSelfieUpload(body: any): ValidationResult {
  // Validate selfieId
  const selfieResult = validateObjectId(body.selfieId, 'selfieId');
  if (!selfieResult.success) {
    return selfieResult;
  }

  // Validate width
  const widthResult = validateNumber(body.width, 'width', 1, 10000);
  if (!widthResult.success) {
    return widthResult;
  }

  // Validate height
  const heightResult = validateNumber(body.height, 'height', 1, 10000);
  if (!heightResult.success) {
    return heightResult;
  }

  // Validate sizeBytes
  const sizeResult = validateNumber(body.sizeBytes, 'sizeBytes', 1, 10 * 1024 * 1024); // 10MB max
  if (!sizeResult.success) {
    return sizeResult;
  }

  return { success: true, data: body };
}





