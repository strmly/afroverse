import { Request, Response, NextFunction } from 'express';
import { securityConfig } from '../config/security';
import { logger } from '../utils/logger';

/**
 * Admin Middleware
 * 
 * Enforces admin role and optional IP allowlist.
 */

/**
 * Require admin role
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    // Check if user has admin role
    if (!user.roles || !user.roles.includes('admin')) {
      logger.warn('Admin access denied', {
        userId: user.id,
        ip: req.ip,
        path: req.path,
      });
      
      return res.status(403).json({
        error: 'forbidden',
        message: 'Admin access required',
      });
    }
    
    // Optional: Check IP allowlist
    if (securityConfig.admin.allowedIPs.length > 0) {
      const clientIP = req.ip || '';
      const allowed = securityConfig.admin.allowedIPs.some(
        (allowedIP) => clientIP.includes(allowedIP)
      );
      
      if (!allowed) {
        logger.warn('Admin access denied - IP not allowed', {
          userId: user.id,
          ip: clientIP,
          path: req.path,
        });
        
        return res.status(403).json({
          error: 'forbidden',
          message: 'Access denied from this location',
        });
      }
    }
    
    next();
  } catch (error: any) {
    logger.error('Error in requireAdmin middleware', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Authorization failed',
    });
  }
}

