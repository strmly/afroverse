import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * User Model - Identity Root
 * 
 * Core principles:
 * - Authentication identity
 * - Tribe membership (required after onboarding)
 * - Public profile
 * - Denormalized counters for fast reads
 */

export interface IUser extends Document {
  _id: Types.ObjectId;
  
  // AUTH
  phoneE164: string;
  phoneVerified: boolean;
  auth: {
    provider: 'whatsapp';
    lastVerifiedAt: Date;
  };
  
  // PROFILE
  username: string;
  displayName: string;
  bio?: string;
  
  // TRIBE (Set during onboarding, after OTP verification)
  tribeId?: Types.ObjectId;
  tribeJoinedAt?: Date;
  
  // AVATAR (current identity)
  avatar?: {
    generationId: Types.ObjectId;
    versionId: string;
    imagePath: string;
    thumbPath: string;
    updatedAt: Date;
  };
  
  // DENORMALIZED COUNTERS
  counters: {
    posts: number;
    respectsReceived: number;
  };
  
  // SOCIAL COUNTERS
  followersCount: number;
  followingCount: number;
  
  // SYSTEM
  roles: string[];
  status: {
    banned: boolean;
    shadowbanned: boolean;
    reason?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    // AUTH
    phoneE164: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Cannot be changed after creation
      match: /^\+[1-9]\d{1,14}$/, // E.164 format
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    auth: {
      provider: {
        type: String,
        enum: ['whatsapp'],
        default: 'whatsapp',
      },
      lastVerifiedAt: {
        type: Date,
        required: true,
      },
    },
    
    // PROFILE
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]{3,30}$/, // URL-safe: lowercase letters, numbers, underscore
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    
    // TRIBE (Set during onboarding, after OTP verification)
    tribeId: {
      type: Schema.Types.ObjectId,
      ref: 'Tribe',
      required: false, // Optional initially, set after OTP verification
    },
    tribeJoinedAt: {
      type: Date,
    },
    
    // AVATAR
    avatar: {
      generationId: {
        type: Schema.Types.ObjectId,
        ref: 'Generation',
      },
      versionId: {
        type: String,
      },
      imagePath: {
        type: String,
      },
      thumbPath: {
        type: String,
      },
      updatedAt: {
        type: Date,
      },
    },
    
    // DENORMALIZED COUNTERS
    counters: {
      posts: {
        type: Number,
        default: 0,
        min: 0,
      },
      respectsReceived: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    // SOCIAL COUNTERS
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // SYSTEM
    roles: {
      type: [String],
      enum: ['user', 'admin', 'moderator'],
      default: ['user'],
    },
    status: {
      banned: {
        type: Boolean,
        default: false,
      },
      shadowbanned: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES (Critical for performance)
// Note: phoneE164 and username already have unique indexes from schema definition
UserSchema.index({ tribeId: 1 });
UserSchema.index({ 'status.banned': 1 });

// INVARIANT VALIDATION
UserSchema.pre('save', function (next) {
  // Validate avatar reference if present
  const avatar = this.avatar as any;
  
  // Only validate if avatar exists and has at least one property
  if (avatar && typeof avatar === 'object') {
    const keys = Object.keys(avatar);
    
    // If avatar object has any properties, it must have both generationId and versionId
    if (keys.length > 0) {
      // Check if it's an empty object (all values are undefined/null)
      const hasRealData = avatar.generationId || avatar.versionId || avatar.imagePath || avatar.thumbPath;
      
      if (hasRealData) {
        // Avatar has data, so it must be complete
        if (!avatar.generationId || !avatar.versionId) {
          // Debug logging in development
          if (process.env.NODE_ENV === 'development') {
            const logger = require('./utils/logger').logger;
            logger.error('Avatar validation failed', {
              userId: this._id,
              avatarKeys: keys,
              hasGenerationId: !!avatar.generationId,
              hasVersionId: !!avatar.versionId,
              avatarValue: avatar,
            });
          }
          return next(new Error('Avatar must reference a valid generation and version'));
        }
      } else {
        // Avatar object exists but has no real data - clear it
        this.avatar = undefined;
      }
    }
  }
  
  next();
});

// METHODS
UserSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    tribeId: this.tribeId,
    avatar: this.avatar,
    counters: this.counters,
    createdAt: this.createdAt,
  };
};

UserSchema.methods.isBanned = function () {
  return this.status.banned || this.status.shadowbanned;
};

export const User = mongoose.model<IUser>('User', UserSchema);



