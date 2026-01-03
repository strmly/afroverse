import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Generation } from '../models/Generation';
import { Respect } from '../models/Respect';
import { Tribe } from '../models/Tribe';

/**
 * Setup Database Indexes
 * 
 * Creates optimized indexes for query performance.
 * Run this script after deployment or schema changes.
 */

async function setupIndexes() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    logger.info('Creating indexes...');

    // Post indexes (critical for feed performance)
    logger.info('Creating Post indexes...');
    await Post.collection.createIndex({ tribeId: 1, createdAt: -1 });
    await Post.collection.createIndex({ tribeId: 1, status: 1, createdAt: -1 });
    await Post.collection.createIndex({ visibility: 1, status: 1, createdAt: -1 });
    await Post.collection.createIndex({ userId: 1, createdAt: -1 });
    await Post.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
    await Post.collection.createIndex({ status: 1 });
    await Post.collection.createIndex({ 'rank.hotScore': -1, status: 1 });
    await Post.collection.createIndex({ generationId: 1 });
    logger.info('Post indexes created');

    // User indexes
    logger.info('Creating User indexes...');
    await User.collection.createIndex({ phoneE164: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ tribeId: 1 });
    await User.collection.createIndex({ 'status.isBanned': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    logger.info('User indexes created');

    // Generation indexes
    logger.info('Creating Generation indexes...');
    await Generation.collection.createIndex({ userId: 1, createdAt: -1 });
    await Generation.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
    await Generation.collection.createIndex({ status: 1, createdAt: -1 });
    await Generation.collection.createIndex({ 'source.seedPostId': 1 });
    logger.info('Generation indexes created');

    // Respect indexes (for checking if user respected a post)
    logger.info('Creating Respect indexes...');
    await Respect.collection.createIndex({ postId: 1, userId: 1 }, { unique: true });
    await Respect.collection.createIndex({ userId: 1, createdAt: -1 });
    await Respect.collection.createIndex({ postId: 1, createdAt: -1 });
    logger.info('Respect indexes created');

    // Tribe indexes
    logger.info('Creating Tribe indexes...');
    await Tribe.collection.createIndex({ slug: 1 }, { unique: true });
    await Tribe.collection.createIndex({ 'stats.members': -1 });
    logger.info('Tribe indexes created');

    logger.info('All indexes created successfully!');

    // List all indexes for verification
    logger.info('Verifying indexes...');
    const postIndexes = await Post.collection.indexes();
    logger.info('Post indexes:', postIndexes.map(i => i.name));

    const userIndexes = await User.collection.indexes();
    logger.info('User indexes:', userIndexes.map(i => i.name));

    const generationIndexes = await Generation.collection.indexes();
    logger.info('Generation indexes:', generationIndexes.map(i => i.name));

    const respectIndexes = await Respect.collection.indexes();
    logger.info('Respect indexes:', respectIndexes.map(i => i.name));

    const tribeIndexes = await Tribe.collection.indexes();
    logger.info('Tribe indexes:', tribeIndexes.map(i => i.name));

  } catch (error) {
    logger.error('Error setting up indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  setupIndexes()
    .then(() => {
      logger.info('Index setup complete');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Index setup failed:', error);
      process.exit(1);
    });
}

export default setupIndexes;
