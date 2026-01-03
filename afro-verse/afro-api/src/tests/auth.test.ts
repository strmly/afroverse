/**
 * Auth Tests
 * 
 * Comprehensive testing for auth flow:
 * - OTP send
 * - OTP verify
 * - Token refresh
 * - Rate limiting
 * - Security measures
 */

import mongoose from 'mongoose';
import { sendOTP, verifyOTP, refreshAccessToken } from '../services/auth.service';
import { User } from '../models/User';
import { OTPSession } from '../models/OTPSession';
import { RefreshToken } from '../models/RefreshToken';
import { Tribe } from '../models/Tribe';

describe('Auth Service', () => {
  let testTribe: any;
  
  beforeAll(async () => {
    // Create test tribe
    testTribe = await Tribe.create({
      slug: 'test-tribe',
      name: 'Test Tribe',
      motto: 'Test motto',
      accentColor: '#FF0000',
      iconKey: 'test.svg',
    });
  });
  
  afterAll(async () => {
    await Tribe.deleteMany({});
    await User.deleteMany({});
    await OTPSession.deleteMany({});
    await RefreshToken.deleteMany({});
  });
  
  describe('sendOTP', () => {
    it('should normalize phone number', async () => {
      const result = await sendOTP('0821234567'); // Missing +27
      
      expect(result.success).toBe(true);
      expect(result.otpSessionId).toBeDefined();
      
      const session = await OTPSession.findById(result.otpSessionId);
      expect(session?.phoneE164).toBe('+27821234567');
    });
    
    it('should reject invalid phone', async () => {
      const result = await sendOTP('invalid');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('invalid_phone');
    });
    
    it('should reuse active session', async () => {
      const result1 = await sendOTP('+27821234567');
      const result2 = await sendOTP('+27821234567');
      
      expect(result1.otpSessionId).toBe(result2.otpSessionId);
    });
    
    it('should enforce rate limiting', async () => {
      const phone = `+27${Date.now().toString().slice(-9)}`;
      
      // Send 3 OTPs
      await sendOTP(phone);
      await sendOTP(phone);
      await sendOTP(phone);
      
      // 4th should be rate limited
      const result = await sendOTP(phone);
      expect(result.errorCode).toBe('rate_limited');
    });
  });
  
  describe('verifyOTP', () => {
    it('should create new user on first verify', async () => {
      const phone = `+27${Date.now().toString().slice(-9)}`;
      
      // Send OTP
      const sendResult = await sendOTP(phone);
      
      // Verify (dev mode accepts 123456)
      const verifyResult = await verifyOTP(
        sendResult.otpSessionId!,
        '123456'
      );
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isNewUser).toBe(true);
      expect(verifyResult.accessToken).toBeDefined();
      expect(verifyResult.refreshToken).toBeDefined();
      expect(verifyResult.user).toBeDefined();
      
      // Check user created
      const user = await User.findById(verifyResult.user?.id);
      expect(user).toBeDefined();
      expect(user?.phoneE164).toBe(phone);
    });
    
    it('should fetch existing user on verify', async () => {
      // Create user
      const user = await User.create({
        phoneE164: '+27999999999',
        phoneVerified: true,
        username: 'existing_user',
        displayName: 'Existing User',
        tribeId: testTribe._id,
        auth: {
          provider: 'whatsapp',
          lastVerifiedAt: new Date(),
        },
      });
      
      // Send OTP
      const sendResult = await sendOTP('+27999999999');
      
      // Verify
      const verifyResult = await verifyOTP(
        sendResult.otpSessionId!,
        '123456'
      );
      
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.isNewUser).toBe(false);
      expect(verifyResult.user?.id).toBe(user._id.toString());
    });
    
    it('should reject invalid code', async () => {
      const sendResult = await sendOTP('+27888888888');
      
      const verifyResult = await verifyOTP(
        sendResult.otpSessionId!,
        '999999'
      );
      
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.errorCode).toBe('invalid_code');
    });
    
    it('should enforce max attempts', async () => {
      const sendResult = await sendOTP('+27777777777');
      
      // Try 5 times with wrong code
      for (let i = 0; i < 5; i++) {
        await verifyOTP(sendResult.otpSessionId!, '999999');
      }
      
      // 6th should fail with max attempts
      const result = await verifyOTP(sendResult.otpSessionId!, '999999');
      expect(result.errorCode).toMatch(/max_attempts|failed/);
    });
    
    it('should invalidate other sessions on verify', async () => {
      const phone = '+27666666666';
      
      // Create multiple sessions
      const session1 = await sendOTP(phone);
      await new Promise(resolve => setTimeout(resolve, 100));
      const session2 = await sendOTP(phone);
      
      // Verify session 2
      await verifyOTP(session2.otpSessionId!, '123456');
      
      // Session 1 should be expired
      const otpSession1 = await OTPSession.findById(session1.otpSessionId);
      expect(otpSession1?.status).not.toBe('sent');
    });
    
    it('should reject banned user', async () => {
      // Create banned user
      const user = await User.create({
        phoneE164: '+27555555555',
        phoneVerified: true,
        username: 'banned_user',
        displayName: 'Banned User',
        tribeId: testTribe._id,
        auth: {
          provider: 'whatsapp',
          lastVerifiedAt: new Date(),
        },
        status: {
          banned: true,
          shadowbanned: false,
        },
      });
      
      // Send OTP
      const sendResult = await sendOTP('+27555555555');
      
      // Verify should fail
      const verifyResult = await verifyOTP(sendResult.otpSessionId!, '123456');
      
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.errorCode).toBe('banned');
    });
  });
  
  describe('refreshAccessToken', () => {
    it('should refresh token', async () => {
      // Create user
      const user = await User.create({
        phoneE164: '+27444444444',
        phoneVerified: true,
        username: 'refresh_user',
        displayName: 'Refresh User',
        tribeId: testTribe._id,
        auth: {
          provider: 'whatsapp',
          lastVerifiedAt: new Date(),
        },
      });
      
      // Create refresh token
      const { token } = await RefreshToken.createToken(user._id);
      
      // Refresh
      const result = await refreshAccessToken(token);
      
      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(token); // Should be rotated
    });
    
    it('should detect token reuse', async () => {
      // Create user
      const user = await User.create({
        phoneE164: '+27333333333',
        phoneVerified: true,
        username: 'reuse_user',
        displayName: 'Reuse User',
        tribeId: testTribe._id,
        auth: {
          provider: 'whatsapp',
          lastVerifiedAt: new Date(),
        },
      });
      
      // Create refresh token
      const { token } = await RefreshToken.createToken(user._id);
      
      // Use token once
      await refreshAccessToken(token);
      
      // Try to use again (should fail)
      const result = await refreshAccessToken(token);
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('token_reuse');
    });
    
    it('should reject invalid token', async () => {
      const result = await refreshAccessToken('invalid-token');
      
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('invalid_token');
    });
  });
});

describe('RefreshToken Model', () => {
  it('should hash tokens', () => {
    const token = 'test-token-123';
    const hash = RefreshToken.hashToken(token);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(token);
    expect(hash.length).toBe(64); // SHA-256 hex length
  });
  
  it('should generate random tokens', () => {
    const token1 = RefreshToken.generateToken();
    const token2 = RefreshToken.generateToken();
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes hex
  });
});

describe('OTPSession Model', () => {
  it('should auto-expire', async () => {
    const session = await OTPSession.create({
      phoneE164: '+27111111111',
      provider: 'twilio',
      status: 'sent',
      expiresAt: new Date(Date.now() - 1000), // Already expired
    });
    
    expect(session.isExpired()).toBe(true);
  });
  
  it('should get recent attempts', async () => {
    const phone = '+27222222222';
    
    // Create 3 sessions
    await OTPSession.create({
      phoneE164: phone,
      provider: 'twilio',
      status: 'sent',
    });
    
    await OTPSession.create({
      phoneE164: phone,
      provider: 'twilio',
      status: 'sent',
    });
    
    await OTPSession.create({
      phoneE164: phone,
      provider: 'twilio',
      status: 'sent',
    });
    
    const count = await OTPSession.getRecentAttempts(phone, 60);
    expect(count).toBeGreaterThanOrEqual(3);
  });
});







