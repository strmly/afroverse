import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Twilio Service
 * 
 * Handles WhatsApp OTP via Twilio Verify API.
 * Abstracts provider-specific logic.
 */

const client = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

const VERIFY_SERVICE_SID = env.TWILIO_VERIFY_SERVICE_SID;

export interface OTPSendResult {
  success: boolean;
  providerRef?: string;
  error?: string;
}

export interface OTPVerifyResult {
  success: boolean;
  status?: 'approved' | 'denied' | 'expired';
  error?: string;
}

/**
 * Send OTP via WhatsApp
 */
export async function sendWhatsAppOTP(phoneE164: string): Promise<OTPSendResult> {
  if (!client || !VERIFY_SERVICE_SID) {
    const missingVars = [];
    if (!env.TWILIO_ACCOUNT_SID) missingVars.push('TWILIO_ACCOUNT_SID');
    if (!env.TWILIO_AUTH_TOKEN) missingVars.push('TWILIO_AUTH_TOKEN');
    if (!VERIFY_SERVICE_SID) missingVars.push('TWILIO_VERIFY_SERVICE_SID');
    
    logger.error('Twilio not configured', {
      missingVars,
      nodeEnv: env.NODE_ENV,
      phoneE164,
    });
    
    // Development mode: simulate success
    if (env.NODE_ENV === 'development') {
      logger.info(`[DEV] OTP code for ${phoneE164}: 123456`);
      return {
        success: true,
        providerRef: `dev-${Date.now()}`,
      };
    }
    
    return {
      success: false,
      error: `Twilio configuration incomplete. Missing: ${missingVars.join(', ')}`,
    };
  }
  
  try {
    const verification = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneE164,
        channel: 'whatsapp',
      });
    
    logger.info(`OTP sent to ${phoneE164}`, {
      sid: verification.sid,
      status: verification.status,
    });
    
    return {
      success: true,
      providerRef: verification.sid,
    };
  } catch (error: any) {
    logger.error('Failed to send OTP', {
      phone: phoneE164,
      error: error.message,
      errorCode: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });
    
    // Handle Twilio authentication errors
    if (error.status === 401 || error.code === 20003 || error.message?.toLowerCase().includes('authenticate')) {
      logger.error('Twilio authentication failed', {
        phone: phoneE164,
        errorCode: error.code,
        message: 'Invalid Twilio credentials. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
      });
      return {
        success: false,
        error: 'SMS service configuration error. Please contact support.',
      };
    }
    
    // Handle invalid phone number errors
    if (error.code === 21211 || error.message?.toLowerCase().includes('invalid') && error.message?.toLowerCase().includes('phone')) {
      logger.error('Invalid phone number format', {
        phone: phoneE164,
        error: error.message,
      });
      return {
        success: false,
        error: 'Invalid phone number format. Please use international format (e.g., +27821234567).',
      };
    }
    
    // Handle rate limiting
    if (error.code === 20429 || error.status === 429) {
      logger.warn('Twilio rate limit exceeded', {
        phone: phoneE164,
      });
      return {
        success: false,
        error: 'Too many requests. Please try again in a few minutes.',
      };
    }
    
    // Check for WhatsApp channel disabled error
    if (error.message && error.message.includes('Delivery channel disabled: WHATSAPP')) {
      logger.warn('WhatsApp channel is disabled in Twilio Verify Service. Falling back to SMS...');
      
      // Try SMS as fallback
      try {
        const verification = await client!.verify.v2
          .services(VERIFY_SERVICE_SID!)
          .verifications.create({
            to: phoneE164,
            channel: 'sms',
          });
        
        logger.info(`OTP sent via SMS to ${phoneE164}`, {
          sid: verification.sid,
          status: verification.status,
        });
        
        return {
          success: true,
          providerRef: verification.sid,
        };
      } catch (smsError: any) {
        logger.error('SMS fallback also failed', {
          phone: phoneE164,
          error: smsError.message,
          errorCode: smsError.code,
          status: smsError.status,
        });
        
        // Handle authentication errors in SMS fallback
        if (smsError.status === 401 || smsError.code === 20003 || smsError.message?.toLowerCase().includes('authenticate')) {
          return {
            success: false,
            error: 'SMS service configuration error. Please contact support.',
          };
        }
        
        // Check for specific Twilio errors
        if (smsError.message && smsError.message.includes('blocked')) {
          return {
            success: false,
            error: 'This phone number has been temporarily blocked. Please try a different number or contact support.',
          };
        }
        
        // Invalid phone number
        if (smsError.code === 21211) {
          return {
            success: false,
            error: 'Invalid phone number format. Please use international format (e.g., +27821234567).',
          };
        }
        
        return {
          success: false,
          error: 'Failed to send verification code. Please try again or use a different phone number.',
        };
      }
    }
    
    // Generic error - don't expose internal Twilio errors to users
    return {
      success: false,
      error: 'Failed to send verification code. Please check your phone number and try again.',
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyWhatsAppOTP(
  phoneE164: string,
  code: string
): Promise<OTPVerifyResult> {
  if (!client || !VERIFY_SERVICE_SID) {
    logger.warn('Twilio not configured, simulating OTP verify');
    
    // Development mode: accept 123456
    if (env.NODE_ENV === 'development') {
      if (code === '123456') {
        logger.info(`[DEV] OTP verified for ${phoneE164}`);
        return {
          success: true,
          status: 'approved',
        };
      } else {
        return {
          success: false,
          status: 'denied',
        };
      }
    }
    
    return {
      success: false,
      error: 'Twilio not configured',
    };
  }
  
  try {
    const verificationCheck = await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneE164,
        code,
      });
    
    logger.info(`OTP verification for ${phoneE164}`, {
      status: verificationCheck.status,
    });
    
    const success = verificationCheck.status === 'approved';
    
    return {
      success,
      status: verificationCheck.status as 'approved' | 'denied' | 'expired',
    };
  } catch (error: any) {
    logger.error('Failed to verify OTP', {
      phone: phoneE164,
      error: error.message,
    });
    
    return {
      success: false,
      error: error.message || 'Failed to verify OTP',
    };
  }
}

/**
 * Cancel pending verification
 */
export async function cancelVerification(providerRef: string): Promise<void> {
  if (!client || !VERIFY_SERVICE_SID) return;
  
  try {
    await client.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications(providerRef)
      .update({ status: 'canceled' });
    
    logger.info(`Verification cancelled: ${providerRef}`);
  } catch (error: any) {
    logger.error('Failed to cancel verification', {
      providerRef,
      error: error.message,
    });
  }
}





