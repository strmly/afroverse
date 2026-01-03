import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Respect Model - Likes
 * 
 * Purpose:
 * - Prevent duplicate likes
 * - Enable undo
 * - Provide analytics later
 * 
 * Invariants:
 * - One respect per user per post (enforced by unique compound index)
 * - Respects are reversible
 * - Counter updates must be transactional
 * 
 * Update Pattern (IMPORTANT):
 * Use MongoDB transactions or careful ordering:
 * 1. Insert respect
 * 2. Increment posts.counts.respects
 * 3. Increment users.counters.respectsReceived
 * 
 * Reverse on delete.
 */

export interface IRespect extends Document {
  _id: Types.ObjectId;
  
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  
  createdAt: Date;
}

const RespectSchema = new Schema<IRespect>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// INDEXES (Enforced uniqueness)
RespectSchema.index({ postId: 1, userId: 1 }, { unique: true });
RespectSchema.index({ userId: 1, createdAt: -1 });

// STATICS
RespectSchema.statics.addRespect = async function (
  postId: Types.ObjectId,
  userId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const { Post } = require('./Post');
  const { User } = require('./User');
  
  // Create respect
  const respect = await this.create([{ postId, userId }], { session });
  
  // Increment post counter
  await Post.findByIdAndUpdate(
    postId,
    { $inc: { 'counts.respects': 1 } },
    { session }
  );
  
  // Get post owner and increment their counter
  const post = await Post.findById(postId, 'userId', { session });
  if (post) {
    await User.findByIdAndUpdate(
      post.userId,
      { $inc: { 'counters.respectsReceived': 1 } },
      { session }
    );
  }
  
  return respect[0];
};

RespectSchema.statics.removeRespect = async function (
  postId: Types.ObjectId,
  userId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  const { Post } = require('./Post');
  const { User } = require('./User');
  
  // Delete respect
  const result = await this.findOneAndDelete({ postId, userId }, { session });
  
  if (result) {
    // Decrement post counter
    await Post.findByIdAndUpdate(
      postId,
      { $inc: { 'counts.respects': -1 } },
      { session }
    );
    
    // Get post owner and decrement their counter
    const post = await Post.findById(postId, 'userId', { session });
    if (post) {
      await User.findByIdAndUpdate(
        post.userId,
        { $inc: { 'counters.respectsReceived': -1 } },
        { session }
      );
    }
  }
  
  return result;
};

RespectSchema.statics.hasRespected = async function (
  postId: Types.ObjectId,
  userId: Types.ObjectId
) {
  const respect = await this.findOne({ postId, userId });
  return !!respect;
};

RespectSchema.statics.getUserRespects = function (
  userId: Types.ObjectId,
  limit: number = 50,
  before?: Date
) {
  const query: any = { userId };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('postId');
};

interface IRespectModel extends mongoose.Model<IRespect> {
  addRespect(postId: Types.ObjectId, userId: Types.ObjectId, session?: mongoose.ClientSession): Promise<IRespect>;
  removeRespect(postId: Types.ObjectId, userId: Types.ObjectId, session?: mongoose.ClientSession): Promise<IRespect | null>;
  hasRespected(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean>;
  getUserRespects(userId: Types.ObjectId, limit?: number, before?: Date): Promise<IRespect[]>;
}

export const Respect = mongoose.model<IRespect, IRespectModel>('Respect', RespectSchema);

