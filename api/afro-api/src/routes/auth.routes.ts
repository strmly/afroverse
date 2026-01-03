import { Router } from 'express';
import {
  handleSendOTP,
  handleVerifyOTP,
  handleRefreshToken,
  handleLogout,
  handleGetMe,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.middleware';

/**
 * Auth Routes
 * 
 * /auth/*
 */

const router = Router();

// Public routes with rate limiting
router.post('/otp/send', 
  otpSendLimiter.ip,
  (req, res, next) => {
    const phoneE164 = req.body.phoneE164;
    if (phoneE164) {
      return otpSendLimiter.phone(phoneE164)(req, res, next);
    }
    return next();
  },
  handleSendOTP
);
router.post('/otp/verify',
  otpVerifyLimiter.ip,
  (req, res, next) => {
    const sessionId = req.body.otpSessionId;
    if (sessionId) {
      return otpVerifyLimiter.session(sessionId)(req, res, next);
    }
    return next();
  },
  handleVerifyOTP
);
router.post('/refresh', handleRefreshToken);
router.post('/logout', handleLogout);

// Protected routes
router.get('/me', requireAuth, handleGetMe);

export default router;
