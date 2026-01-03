import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env';

/**
 * JWT Utilities
 * 
 * Handles JWT token generation and verification.
 * Uses RS256 for production security.
 */

export interface TokenPayload {
  userId: string;
  phoneE164: string;
  role: string;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: {
  userId: Types.ObjectId;
  phoneE164: string;
  role?: string;
}): string {
  const tokenPayload: AccessTokenPayload = {
    userId: payload.userId.toString(),
    phoneE164: payload.phoneE164,
    role: payload.role || 'user',
    type: 'access',
  };
  
  return jwt.sign(tokenPayload, env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived
    issuer: 'afromoji',
    audience: 'afromoji-app',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'afromoji',
      audience: 'afromoji-app',
    }) as AccessTokenPayload;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return {
      userId: decoded.userId,
      phoneE164: decoded.phoneE164,
      role: decoded.role,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('token_expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('invalid_token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}







