import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';

/**
 * RefreshToken Model
 * 
 * Purpose:
 * - Store refresh tokens for token rotation
 * - One active refresh token per device
 * - Enable token revocation
 * 
 * Security:
 * - Tokens are hashed before storage
 * - Reuse detection triggers revocation
 * - Auto-expire via TTL
 */

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  
  userId: Types.ObjectId;
  tokenHash: string;
  
  // Device fingerprint (optional but recommended)
  deviceFingerprint?: {
    userAgent: string;
    ip: string;
    os?: string;
    browser?: string;
  };
  
  status: 'active' | 'revoked' | 'used';
  
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    
    deviceFingerprint: {
      userAgent: String,
      ip: String,
      os: String,
      browser: String,
    },
    
    status: {
      type: String,
      enum: ['active', 'revoked', 'used'],
      default: 'active',
    },
    
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    
    lastUsedAt: Date,
    revokedAt: Date,
    revokedReason: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// INDEXES
// Note: tokenHash already has a unique index from schema definition
RefreshTokenSchema.index({ userId: 1, status: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

// STATIC METHODS
RefreshTokenSchema.statics.hashToken = function (token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
};

RefreshTokenSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString('hex');
};

RefreshTokenSchema.statics.createToken = async function (
  userId: Types.ObjectId,
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    os?: string;
    browser?: string;
  }
) {
  const token = (this as any).generateToken();
  const tokenHash = (this as any).hashToken(token);
  
  const refreshToken = await this.create({
    userId,
    tokenHash,
    deviceFingerprint: deviceInfo,
  });
  
  return { token, refreshToken };
};

RefreshTokenSchema.statics.verifyAndRotate = async function (
  token: string,
  deviceInfo?: any
) {
  const tokenHash = (this as any).hashToken(token);
  
  const refreshToken = await this.findOne({
    tokenHash,
    status: 'active',
    expiresAt: { $gt: new Date() },
  });
  
  if (!refreshToken) {
    // Check if token was already used (rotation attack detection)
    const usedToken = await this.findOne({ tokenHash, status: 'used' });
    
    if (usedToken) {
      // Revoke all tokens for this user (security measure)
      await this.updateMany(
        { userId: usedToken.userId, status: 'active' },
        {
          $set: {
            status: 'revoked',
            revokedAt: new Date(),
            revokedReason: 'token_reuse_detected',
          },
        }
      );
      
      throw new Error('token_reuse_detected');
    }
    
    throw new Error('invalid_refresh_token');
  }
  
  // Mark current token as used
  refreshToken.status = 'used';
  refreshToken.lastUsedAt = new Date();
  await refreshToken.save();
  
    // Create new refresh token
    const { token: newToken, refreshToken: newRefreshToken } = await (this as any).createToken(
      refreshToken.userId,
      deviceInfo
    );
  
  return {
    userId: refreshToken.userId,
    newToken,
    newRefreshToken,
  };
};

RefreshTokenSchema.statics.revokeAllForUser = async function (userId: Types.ObjectId) {
  await this.updateMany(
    { userId, status: 'active' },
    {
      $set: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: 'user_initiated',
      },
    }
  );
};

RefreshTokenSchema.statics.revokeToken = async function (token: string) {
  const tokenHash = (this as any).hashToken(token);
  
  await this.updateOne(
    { tokenHash },
    {
      $set: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedReason: 'manual_revocation',
      },
    }
  );
};

interface IRefreshTokenModel extends mongoose.Model<IRefreshToken> {
  hashToken(token: string): string;
  generateToken(): string;
  createToken(userId: Types.ObjectId, deviceInfo?: any): Promise<{ token: string; refreshToken: IRefreshToken }>;
  verifyAndRotate(token: string, deviceInfo?: any): Promise<{ userId: Types.ObjectId; newToken: string; newRefreshToken: IRefreshToken }>;
  revokeToken(token: string): Promise<void>;
  revokeAllForUser(userId: Types.ObjectId): Promise<void>;
}

export const RefreshToken = mongoose.model<IRefreshToken, IRefreshTokenModel>('RefreshToken', RefreshTokenSchema);

