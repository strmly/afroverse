import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { Respect } from '../models/Respect';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Tribe } from '../models/Tribe';

/**
 * Transaction Utilities
 * 
 * Provides transaction-safe operations for critical data updates.
 * 
 * Use these helpers to ensure atomicity for:
 * - Respect insert + counter increment
 * - Tribe join + member count update
 * - Post creation + user/tribe counters
 */

/**
 * Add a respect with atomic counter updates
 */
export async function addRespectWithCounters(
  postId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<any> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const respect = await Respect.addRespect(postId, userId, session);
    
    await session.commitTransaction();
    return respect;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Remove a respect with atomic counter updates
 */
export async function removeRespectWithCounters(
  postId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<any> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const result = await Respect.removeRespect(postId, userId, session);
    
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Create a post with atomic counter updates
 */
export async function createPostWithCounters(
  postData: {
    userId: Types.ObjectId;
    tribeId: Types.ObjectId;
    generationId: Types.ObjectId;
    versionId: string;
    caption?: string;
    styleTag?: string;
    media: {
      imagePath: string;
      thumbPath: string;
      aspect: '1:1' | '9:16';
    };
    visibility?: 'tribe' | 'public';
  }
): Promise<any> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Create post
    const post = await Post.create([postData], { session });
    
    // Increment user post counter
    await User.findByIdAndUpdate(
      postData.userId,
      { $inc: { 'counters.posts': 1 } },
      { session }
    );
    
    // Increment tribe post counter
    await Tribe.findByIdAndUpdate(
      postData.tribeId,
      { $inc: { 'stats.posts': 1 } },
      { session }
    );
    
    await session.commitTransaction();
    return post[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Delete a post with atomic counter updates
 */
export async function deletePostWithCounters(
  postId: Types.ObjectId
): Promise<void> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Get post to retrieve user and tribe IDs
    const post = await Post.findById(postId, null, { session });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    // Soft delete post
    await (post as any).softDelete();
    
    // Decrement user post counter
    await User.findByIdAndUpdate(
      post.userId,
      { $inc: { 'counters.posts': -1 } },
      { session }
    );
    
    // Decrement tribe post counter
    await Tribe.findByIdAndUpdate(
      post.tribeId,
      { $inc: { 'stats.posts': -1 } },
      { session }
    );
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Join a tribe with atomic member count update
 */
export async function joinTribeWithCounters(
  userId: Types.ObjectId,
  tribeId: Types.ObjectId
): Promise<void> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Update user's tribe
    await User.findByIdAndUpdate(
      userId,
      {
        tribeId,
        tribeJoinedAt: new Date(),
      },
      { session }
    );
    
    // Increment tribe member count
    await Tribe.findByIdAndUpdate(
      tribeId,
      { $inc: { 'stats.members': 1 } },
      { session }
    );
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Change tribe with atomic member count updates
 */
export async function changeTribeWithCounters(
  userId: Types.ObjectId,
  oldTribeId: Types.ObjectId,
  newTribeId: Types.ObjectId
): Promise<void> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Update user's tribe
    await User.findByIdAndUpdate(
      userId,
      {
        tribeId: newTribeId,
        tribeJoinedAt: new Date(),
      },
      { session }
    );
    
    // Decrement old tribe member count
    await Tribe.findByIdAndUpdate(
      oldTribeId,
      { $inc: { 'stats.members': -1 } },
      { session }
    );
    
    // Increment new tribe member count
    await Tribe.findByIdAndUpdate(
      newTribeId,
      { $inc: { 'stats.members': 1 } },
      { session }
    );
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

