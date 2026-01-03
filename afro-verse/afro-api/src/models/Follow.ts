import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Follow Model
 * 
 * Represents a follow relationship between two users
 */

export interface IFollow extends Document {
  follower: Types.ObjectId;  // User who is following
  following: Types.ObjectId; // User being followed
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for efficient lookups and uniqueness
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Index for getting followers of a user
followSchema.index({ following: 1, createdAt: -1 });

// Index for getting users someone is following
followSchema.index({ follower: 1, createdAt: -1 });

const Follow = mongoose.model<IFollow>('Follow', followSchema);

export default Follow;



