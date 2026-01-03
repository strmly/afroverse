import { Types } from 'mongoose';
import { User } from '../models/User';
import { OTPSession } from '../models/OTPSession';
import { RefreshToken } from '../models/RefreshToken';
import { sendWhatsAppOTP, verifyWhatsAppOTP } from './twilio.service';
import { generateAccessToken } from '../utils/jwt';
import { normalizePhoneNumber, validatePhoneNumber } from '../utils/phone';
import { logger } from '../utils/logger';

/**
 * Auth Service
 * 
 * Handles authentication logic:
 * - OTP send/verify
 * - User creation/fetch
 * - Token generation
 * - Token refresh
 */

export interface SendOTPResult {
  success: boolean;
  otpSessionId?: string;
  error?: string;
  errorCode?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
  isNewUser?: boolean;
  error?: string;
  errorCode?: string;
}

export interface RefreshTokenResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(
  phoneInput: string,
  ipAddress?: string
): Promise<SendOTPResult> {
  try {
    // Validate and normalize phone number
    const phoneValidation = validatePhoneNumber(phoneInput, true);
    
    if (!phoneValidation.valid) {
      return {
        success: false,
        error: phoneValidation.error || 'Invalid phone number',
        errorCode: 'invalid_phone',
      };
    }
    
    const phoneE164 = phoneValidation.normalized!;
    
    // Check rate limiting (phone-based)
    const recentAttempts = await OTPSession.getRecentAttempts(phoneE164, 10);
    
    if (recentAttempts >= 3) {
      logger.warn(`Rate limit exceeded for ${phoneE164}`);
      return {
        success: false,
        error: 'Too many attempts. Try again later.',
        errorCode: 'rate_limited',
      };
    }
    
    // Check for active session
    const activeSession = await OTPSession.findActiveSession(phoneE164);
    
    if (activeSession) {
      // Reuse existing session
      logger.info(`Reusing active OTP session for ${phoneE164}`);
      return {
        success: true,
        otpSessionId: activeSession._id.toString(),
      };
    }
    
    // Send OTP via Twilio
    const otpResult = await sendWhatsAppOTP(phoneE164);
    
    if (!otpResult.success) {
      return {
        success: false,
        error: 'Failed to send OTP. Try again.',
        errorCode: 'provider_error',
      };
    }
    
    // Create OTP session
    const otpSession = await OTPSession.createSession(
      phoneE164,
      'twilio',
      undefined, // Let Twilio handle OTP
      otpResult.providerRef
    );
    
    logger.info(`OTP sent to ${phoneE164}`, {
      sessionId: otpSession._id,
    });
    
    return {
      success: true,
      otpSessionId: otpSession._id.toString(),
    };
  } catch (error: any) {
    logger.error('Error sending OTP', error);
    return {
      success: false,
      error: 'Failed to send OTP',
      errorCode: 'internal_error',
    };
  }
}

/**
 * Verify OTP and authenticate user
 */
export async function verifyOTP(
  otpSessionId: string,
  code: string,
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    os?: string;
    browser?: string;
  }
): Promise<VerifyOTPResult> {
  try {
    // Load OTP session
    const otpSession = await OTPSession.findById(otpSessionId);
    
    if (!otpSession) {
      return {
        success: false,
        error: 'Invalid session',
        errorCode: 'invalid_session',
      };
    }
    
    // Check if already verified
    if (otpSession.status === 'verified') {
      return {
        success: false,
        error: 'Session already used',
        errorCode: 'session_used',
      };
    }
    
    // Check expiry
    if ((otpSession as any).isExpired()) {
      return {
        success: false,
        error: 'Code expired. Request a new one.',
        errorCode: 'expired',
      };
    }
    
    // Check attempts
    if (otpSession.attempts >= 5) {
      return {
        success: false,
        error: 'Too many attempts',
        errorCode: 'max_attempts',
      };
    }
    
    // Verify with provider
    const verifyResult = await verifyWhatsAppOTP(otpSession.phoneE164, code);
    
    if (!verifyResult.success) {
      // Increment attempts
      await (otpSession as any).incrementAttempts();
      
      return {
        success: false,
        error: 'Invalid code',
        errorCode: 'invalid_code',
      };
    }
    
    // Mark session as verified
    await (otpSession as any).verify(code);
    
    // Fetch or create user
    let user = await User.findOne({ phoneE164: otpSession.phoneE164 });
    let isNewUser = false;
    
    if (!user) {
      // Create new user (minimal info, complete in onboarding)
      // Note: avatar is omitted - will be set when user creates their first generation
      user = await User.create({
        phoneE164: otpSession.phoneE164,
        phoneVerified: true,
        auth: {
          provider: 'whatsapp',
          lastVerifiedAt: new Date(),
        },
        // These will be set during onboarding
        username: `user_${Date.now()}`, // Temporary
        displayName: 'New User',
        tribeId: null as any, // Will be set in onboarding
      });
      
      isNewUser = true;
      logger.info(`New user created: ${user._id}`);
    } else {
      // Update last verified
      user.auth.lastVerifiedAt = new Date();
      user.phoneVerified = true;
      await user.save();
      
      logger.info(`Existing user authenticated: ${user._id}`);
    }
    
    // Check if user is banned
    if ((user as any).isBanned()) {
      return {
        success: false,
        error: 'Account suspended',
        errorCode: 'banned',
      };
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      phoneE164: user.phoneE164,
      role: user.roles[0],
    });
    
    const { token: refreshToken } = await RefreshToken.createToken(
      user._id,
      deviceInfo
    );
    
    return {
      success: true,
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user._id,
        phoneE164: user.phoneE164,
        username: user.username,
        displayName: user.displayName,
        tribeId: user.tribeId,
        avatar: user.avatar,
      },
    };
  } catch (error: any) {
    logger.error('Error verifying OTP', error);
    return {
      success: false,
      error: 'Verification failed',
      errorCode: 'internal_error',
    };
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshTokenString: string,
  deviceInfo?: any
): Promise<RefreshTokenResult> {
  try {
    // Verify and rotate refresh token
    const result = await RefreshToken.verifyAndRotate(refreshTokenString, deviceInfo);
    
    // Load user
    const user = await User.findById(result.userId);
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        errorCode: 'user_not_found',
      };
    }
    
    // Check if user is banned
    if ((user as any).isBanned()) {
      return {
        success: false,
        error: 'Account suspended',
        errorCode: 'banned',
      };
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id,
      phoneE164: user.phoneE164,
      role: user.roles[0],
    });
    
    return {
      success: true,
      accessToken,
      refreshToken: result.newToken,
    };
  } catch (error: any) {
    logger.error('Error refreshing token', error);
    
    if (error.message === 'token_reuse_detected') {
      return {
        success: false,
        error: 'Security violation detected',
        errorCode: 'token_reuse',
      };
    }
    
    return {
      success: false,
      error: 'Invalid refresh token',
      errorCode: 'invalid_token',
    };
  }
}

/**
 * Logout (revoke refresh token)
 */
export async function logout(refreshTokenString: string): Promise<void> {
  try {
    await RefreshToken.revokeToken(refreshTokenString);
    logger.info('User logged out');
  } catch (error) {
    logger.error('Error logging out', error);
  }
}

/**
 * Revoke all tokens for user
 */
export async function revokeAllTokens(userId: Types.ObjectId): Promise<void> {
  try {
    await RefreshToken.revokeAllForUser(userId);
    logger.info(`All tokens revoked for user ${userId}`);
  } catch (error) {
    logger.error('Error revoking tokens', error);
  }
}

