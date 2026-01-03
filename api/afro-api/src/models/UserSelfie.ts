import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * UserSelfie Model - Raw Inputs
 * 
 * Purpose:
 * - Store original biometric inputs
 * - Track privacy & lifecycle
 * - Decouple selfies from generations
 * 
 * Invariants:
 * - Selfies are NEVER public
 * - Deleted selfies remain for audit (soft delete)
 * - Generations reference selfies by ID, not by path
 */

export interface IUserSelfie extends Document {
  _id: Types.ObjectId;
  
  userId: Types.ObjectId;
  
  gcsPath: string;
  mimeType: string;
  sizeBytes: number;
  
  width: number;
  height: number;
  
  status: 'initiated' | 'active' | 'deleted' | 'invalid';
  
  createdAt: Date;
  initiatedAt?: Date;
  deletedAt?: Date;
}

const UserSelfieSchema = new Schema<IUserSelfie>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Storage metadata
    gcsPath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp'],
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Image dimensions (optional during initiation, required when active)
    width: {
      type: Number,
      required: false, // Optional during 'initiated' status
      min: 1,
      validate: {
        validator: function(this: IUserSelfie, value: number | undefined) {
          // Required if status is 'active', optional for 'initiated'
          if (this.status === 'active') {
            return value !== undefined && value >= 1;
          }
          return value === undefined || value >= 1;
        },
        message: 'Width must be at least 1 when status is active',
      },
    },
    height: {
      type: Number,
      required: false, // Optional during 'initiated' status
      min: 1,
      validate: {
        validator: function(this: IUserSelfie, value: number | undefined) {
          // Required if status is 'active', optional for 'initiated'
          if (this.status === 'active') {
            return value !== undefined && value >= 1;
          }
          return value === undefined || value >= 1;
        },
        message: 'Height must be at least 1 when status is active',
      },
    },
    
    // Lifecycle
    status: {
      type: String,
      enum: ['initiated', 'active', 'deleted', 'invalid'],
      default: 'initiated',
    },
    
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
UserSelfieSchema.index({ userId: 1, createdAt: -1 });
UserSelfieSchema.index({ status: 1 });

// METHODS
UserSelfieSchema.methods.softDelete = function () {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

UserSelfieSchema.methods.isActive = function () {
  return this.status === 'active';
};

// STATICS
UserSelfieSchema.statics.findActiveByUser = function (userId: Types.ObjectId) {
  return this.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

interface IUserSelfieModel extends mongoose.Model<IUserSelfie> {
  findActiveByUser(userId: Types.ObjectId): Promise<IUserSelfie[]>;
}

export const UserSelfie = mongoose.model<IUserSelfie, IUserSelfieModel>('UserSelfie', UserSelfieSchema);

