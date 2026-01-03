import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

/**
 * OTPSession Model - Auth
 * 
 * Purpose:
 * - Track WhatsApp OTP lifecycle
 * - Rate-limit verification attempts
 * - Support audit/debugging
 * 
 * Invariants:
 * - OTP sessions auto-expire (TTL index)
 * - Verification invalidates all other active sessions
 * - Attempts are capped (e.g. 5)
 */

export interface IOTPSession extends Document {
  _id: Types.ObjectId;
  
  phoneE164: string;
  provider: 'twilio' | 'meta';
  
  providerRef?: string;
  
  codeHash?: string; // bcrypt hash if self-managed
  attempts: number;
  
  status: 'sent' | 'verified' | 'expired' | 'failed';
  
  createdAt: Date;
  expiresAt: Date;
}

const OTPSessionSchema = new Schema<IOTPSession>(
  {
    phoneE164: {
      type: String,
      required: true,
      match: /^\+[1-9]\d{1,14}$/, // E.164 format
    },
    provider: {
      type: String,
      enum: ['twilio', 'meta'],
      required: true,
    },
    
    providerRef: {
      type: String,
    },
    
    codeHash: {
      type: String,
    },
    
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    
    status: {
      type: String,
      enum: ['sent', 'verified', 'expired', 'failed'],
      default: 'sent',
    },
    
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// INDEXES
OTPSessionSchema.index({ phoneE164: 1, createdAt: -1 });
OTPSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// METHODS
OTPSessionSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  
  if (this.attempts >= 5) {
    this.status = 'failed';
  }
  
  return this.save();
};

OTPSessionSchema.methods.verify = async function (code: string): Promise<boolean> {
  if (this.status !== 'sent') {
    return false;
  }
  
  if (this.expiresAt < new Date()) {
    this.status = 'expired';
    await this.save();
    return false;
  }
  
  if (this.attempts >= 5) {
    this.status = 'failed';
    await this.save();
    return false;
  }
  
  // If self-managed (codeHash exists)
  if (this.codeHash) {
    const hash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    
    if (hash !== this.codeHash) {
      await this.incrementAttempts();
      return false;
    }
  }
  
  // Mark as verified
  this.status = 'verified';
  await this.save();
  
  // Invalidate other active sessions for this phone
  await mongoose.model('OTPSession').updateMany(
    {
      phoneE164: this.phoneE164,
      _id: { $ne: this._id },
      status: 'sent',
    },
    {
      $set: { status: 'expired' },
    }
  );
  
  return true;
};

OTPSessionSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date() || this.status !== 'sent';
};

// STATICS
OTPSessionSchema.statics.createSession = async function (
  phoneE164: string,
  provider: 'twilio' | 'meta',
  code?: string,
  providerRef?: string
) {
  const sessionData: any = {
    phoneE164,
    provider,
    providerRef,
  };
  
  // If code provided, hash it
  if (code) {
    sessionData.codeHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }
  
  return this.create(sessionData);
};

OTPSessionSchema.statics.findActiveSession = function (phoneE164: string) {
  return this.findOne({
    phoneE164,
    status: 'sent',
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

OTPSessionSchema.statics.getRecentAttempts = async function (
  phoneE164: string,
  minutes: number = 60
) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return this.countDocuments({
    phoneE164,
    createdAt: { $gte: since },
  });
};

interface IOTPSessionModel extends mongoose.Model<IOTPSession> {
  createSession(phoneE164: string, provider: 'twilio' | 'meta', code?: string, providerRef?: string): Promise<IOTPSession>;
  findActiveSession(phoneE164: string): Promise<IOTPSession | null>;
  getRecentAttempts(phoneE164: string, minutes?: number): Promise<number>;
}

export const OTPSession = mongoose.model<IOTPSession, IOTPSessionModel>('OTPSession', OTPSessionSchema);

