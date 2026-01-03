import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { securityConfig } from '../config/security';
import { logger } from '../utils/logger';

/**
 * Validation Middleware
 * 
 * Validates request input at the edge of the system.
 */

/**
 * Validate ObjectId
 */
export function validateObjectId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const value = req.params[paramName] || req.body[paramName];
    
    if (!value) {
      return res.status(400).json({
        error: 'missing_field',
        message: `${paramName} is required`,
      });
    }
    
    if (!Types.ObjectId.isValid(value)) {
      return res.status(400).json({
        error: 'invalid_id',
        message: `Invalid ${paramName}`,
      });
    }
    
    next();
  };
}

/**
 * Validate string length
 */
export function validateStringLength(
  field: string,
  min: number,
  max: number,
  required: boolean = false
) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const value = req.body[field];
    
    if (required && !value) {
      return res.status(400).json({
        error: 'missing_field',
        message: `${field} is required`,
      });
    }
    
    if (value && typeof value !== 'string') {
      return res.status(400).json({
        error: 'invalid_type',
        message: `${field} must be a string`,
      });
    }
    
    if (value && value.length < min) {
      return res.status(400).json({
        error: 'too_short',
        message: `${field} must be at least ${min} characters`,
      });
    }
    
    if (value && value.length > max) {
      return res.status(400).json({
        error: 'too_long',
        message: `${field} must be at most ${max} characters`,
      });
    }
    
    next();
  };
}

/**
 * Validate array length
 */
export function validateArrayLength(
  field: string,
  min: number,
  max: number,
  required: boolean = false
) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const value = req.body[field];
    
    if (required && !value) {
      return res.status(400).json({
        error: 'missing_field',
        message: `${field} is required`,
      });
    }
    
    if (value && !Array.isArray(value)) {
      return res.status(400).json({
        error: 'invalid_type',
        message: `${field} must be an array`,
      });
    }
    
    if (value && value.length < min) {
      return res.status(400).json({
        error: 'too_few_items',
        message: `${field} must have at least ${min} items`,
      });
    }
    
    if (value && value.length > max) {
      return res.status(400).json({
        error: 'too_many_items',
        message: `${field} must have at most ${max} items`,
      });
    }
    
    next();
  };
}

/**
 * Validate enum value
 */
export function validateEnum(field: string, allowedValues: string[], required: boolean = false) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const value = req.body[field];
    
    if (required && !value) {
      return res.status(400).json({
        error: 'missing_field',
        message: `${field} is required`,
      });
    }
    
    if (value && !allowedValues.includes(value)) {
      return res.status(400).json({
        error: 'invalid_value',
        message: `${field} must be one of: ${allowedValues.join(', ')}`,
      });
    }
    
    next();
  };
}

/**
 * Validate prompt safety
 */
export function validatePromptSafety(field: string = 'prompt') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[field];
    
    if (!value) {
      return next();
    }
    
    // Import here to avoid circular dependency
    const { checkPromptSafety } = require('../services/moderation.service');
    const result = checkPromptSafety(value);
    
    if (!result.safe) {
      logger.warn('Unsafe prompt blocked', {
        userId: req.user?.id,
        reason: result.reason,
      });
      
      return res.status(400).json({
        error: 'unsafe_request',
        message: 'Try a different request',
      });
    }
    
    next();
  };
}

/**
 * Sanitize input (remove potential injection attempts)
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Remove $where and other MongoDB operators from body
  const removeOperators = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      // Prevent prototype pollution
      if (Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
          Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
          Object.prototype.hasOwnProperty.call(obj, 'prototype')) {
        delete obj.__proto__;
        delete obj.constructor;
        delete obj.prototype;
      }
      
      for (const key in obj) {
        // Remove MongoDB operators
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          obj[key] = removeOperators(obj[key]);
        }
      }
    }
    return obj;
  };
  
  req.body = removeOperators(req.body);
  req.query = removeOperators(req.query);
  
  next();
}

/**
 * Validate content type
 */
export function validateContentType(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        error: 'missing_content_type',
        message: 'Content-Type header required',
      });
    }
    
    const matches = allowedTypes.some((type) => contentType.includes(type));
    
    if (!matches) {
      return res.status(415).json({
        error: 'unsupported_media_type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      });
    }
    
    next();
  };
}

/**
 * Check if feature is enabled
 */
export function requireFeature(featureName: keyof typeof securityConfig.features) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const enabled = securityConfig.features[featureName];
    
    if (!enabled) {
      logger.info('Feature disabled', { feature: featureName });
      
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'This feature is temporarily unavailable',
      });
    }
    
    next();
  };
}

