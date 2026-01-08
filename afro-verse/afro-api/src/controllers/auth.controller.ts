import { Request, Response } from 'express';
import {
  sendOTP,
  verifyOTP,
  refreshAccessToken,
  logout,
} from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Auth Controller
 * 
 * HTTP handlers for authentication endpoints.
 */

/**
 * POST /auth/otp/send
 * 
 * Send OTP to phone number via WhatsApp
 */
export async function handleSendOTP(req: Request, res: Response) {
  try {
    // Accept both phoneE164 and phoneNumber for compatibility
    const { phoneE164, phoneNumber } = req.body;
    const phone = phoneE164 || phoneNumber;
    
    if (!phone) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Phone number is required',
      });
    }
    
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    const result = await sendOTP(phone, ipAddress);
    
    if (!result.success) {
      const statusCode = result.errorCode === 'rate_limited' ? 429 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    // Always return success (don't reveal if number exists)
    return res.status(200).json({
      otpSessionId: result.otpSessionId,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    logger.error('Error in handleSendOTP', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to send OTP',
    });
  }
}

/**
 * POST /auth/otp/verify
 * 
 * Verify OTP code and authenticate user
 */
export async function handleVerifyOTP(req: Request, res: Response) {
  try {
    const { otpSessionId, code } = req.body;
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('OTP verify request', {
        hasOtpSessionId: !!otpSessionId,
        hasCode: !!code,
        otpSessionIdLength: otpSessionId?.length || 0,
        codeLength: code?.length || 0,
        bodyKeys: Object.keys(req.body),
      });
    }
    
    // More specific validation
    if (!otpSessionId && !code) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Session ID and code are required',
      });
    }
    
    if (!otpSessionId) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Session ID is required',
      });
    }
    
    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Verification code is required',
      });
    }
    
    // Validate code format
    if (typeof code !== 'string' || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Code must be a 6-digit number',
      });
    }
    
    // Extract device info
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
      // Parse user-agent for OS/browser (optional enhancement)
    };
    
    const result = await verifyOTP(otpSessionId, code, deviceInfo);
    
    if (!result.success) {
      const statusCode = result.errorCode === 'banned' ? 403 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser,
      user: result.user,
    });
  } catch (error) {
    logger.error('Error in handleVerifyOTP', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to verify OTP',
    });
  }
}

/**
 * POST /auth/refresh
 * 
 * Refresh access token using refresh token
 */
export async function handleRefreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Refresh token is required',
      });
    }
    
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.socket.remoteAddress,
    };
    
    const result = await refreshAccessToken(refreshToken, deviceInfo);
    
    if (!result.success) {
      const statusCode = result.errorCode === 'token_reuse' ? 403 : 401;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    logger.error('Error in handleRefreshToken', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to refresh token',
    });
  }
}

/**
 * POST /auth/logout
 * 
 * Logout (revoke refresh token)
 */
export async function handleLogout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await logout(refreshToken);
    }
    
    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Error in handleLogout', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to logout',
    });
  }
}

/**
 * GET /auth/me
 * 
 * Get current user info (requires auth)
 */
export async function handleGetMe(req: Request, res: Response) {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Not authenticated',
      });
    }
    
    return res.status(200).json({
      user: user.toPublicProfile(),
    });
  } catch (error) {
    logger.error('Error in handleGetMe', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get user info',
    });
  }
}



