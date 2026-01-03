import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';
import { logger } from '../utils/logger';

/**
 * Auth Middleware
 * 
 * JWT validation and user loading.
 */

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

/**
 * Require authentication
 * 
 * Validates JWT and loads user into request context.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'No token provided',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verify token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error: any) {
      const errorCode = error.message;
      
      if (errorCode === 'token_expired') {
        return res.status(401).json({
          error: 'token_expired',
          message: 'Token expired. Refresh your token.',
        });
      }
      
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid token',
      });
    }
    
    // Load user
    const user = await User.findById(payload.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'user_not_found',
        message: 'User not found',
      });
    }
    
    // Check if user is banned
    if ((user as any).isBanned()) {
      return res.status(403).json({
        error: 'banned',
        message: 'Account suspended',
      });
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.error('Error in requireAuth middleware', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication
 * 
 * Loads user if token present, but doesn't require it.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      
      if (user && !(user as any).isBanned()) {
        req.user = user;
        req.userId = user._id.toString();
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
    
    next();
  } catch (error) {
    logger.error('Error in optionalAuth middleware', error);
    next();
  }
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const hasRole = user.roles.some((role: string) => roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Insufficient permissions',
      });
    }
    
    next();
  };
}

/**
 * Require onboarding completion
 * 
 * Ensures user has completed onboarding (username + tribe).
 */
export function requireOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
    });
  }
  
  if (!user.username || user.username.startsWith('user_') || !user.tribeId) {
    return res.status(403).json({
      error: 'onboarding_required',
      message: 'Please complete onboarding',
    });
  }
  
  next();
}

