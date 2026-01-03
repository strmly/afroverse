import mongoose from 'mongoose';
import { User } from '../models/User';
import { Tribe } from '../models/Tribe';
import { UserSelfie } from '../models/UserSelfie';
import { Generation } from '../models/Generation';
import { Post } from '../models/Post';
import { Respect } from '../models/Respect';
import { OTPSession } from '../models/OTPSession';
import { logger } from './logger';

/**
 * Database Initialization Utilities
 * 
 * Ensures all indexes are created and validates schema constraints.
 * Run this on application startup to ensure database is properly configured.
 */

/**
 * Create all indexes for all models
 */
export async function createIndexes(): Promise<void> {
  logger.info('Creating database indexes...');
  
  try {
    await Promise.all([
      User.createIndexes(),
      Tribe.createIndexes(),
      UserSelfie.createIndexes(),
      Generation.createIndexes(),
      Post.createIndexes(),
      Respect.createIndexes(),
      OTPSession.createIndexes(),
    ]);
    
    logger.info('All indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
}

/**
 * Validate database connection and schema
 */
export async function validateDatabase(): Promise<void> {
  logger.info('Validating database connection...');
  
  try {
    // Check connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    // List all collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collections = await db.listCollections().toArray();
    logger.info(`Found ${collections.length} collections`);
    
    // Check if required collections exist
    const collectionNames = collections.map(c => c.name);
    const requiredCollections = [
      'users',
      'tribes',
      'userselfies',
      'generations',
      'posts',
      'respects',
      'otpsessions',
    ];
    
    for (const required of requiredCollections) {
      if (!collectionNames.includes(required)) {
        logger.warn(`Collection ${required} does not exist yet (will be created on first insert)`);
      }
    }
    
    logger.info('Database validation complete');
  } catch (error) {
    logger.error('Database validation failed:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<any> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const stats = await db.stats();
    
    const collectionStats = await Promise.all([
      User.countDocuments(),
      Tribe.countDocuments(),
      UserSelfie.countDocuments(),
      Generation.countDocuments(),
      Post.countDocuments(),
      Respect.countDocuments(),
      OTPSession.countDocuments(),
    ]);
    
    return {
      database: stats,
      collections: {
        users: collectionStats[0],
        tribes: collectionStats[1],
        userSelfies: collectionStats[2],
        generations: collectionStats[3],
        posts: collectionStats[4],
        respects: collectionStats[5],
        otpSessions: collectionStats[6],
      },
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    throw error;
  }
}

/**
 * Initialize database with default data (for development)
 */
export async function seedDefaultTribes(): Promise<void> {
  logger.info('Seeding default tribes...');
  
  const defaultTribes = [
    {
      slug: 'wakandan-lineage',
      name: 'Wakandan Lineage',
      motto: 'Forever sovereign, forever innovation',
      accentColor: '#9333EA',
      iconKey: 'wakandan-lineage.svg',
    },
    {
      slug: 'lagos-lions',
      name: 'Lagos Lions',
      motto: 'Hustle hard, no dulling',
      accentColor: '#F59E0B',
      iconKey: 'lagos-lions.svg',
    },
    {
      slug: 'nile-royals',
      name: 'Nile Royals',
      motto: 'Ancient wisdom, modern empire',
      accentColor: '#3B82F6',
      iconKey: 'nile-royals.svg',
    },
    {
      slug: 'zulu-nation',
      name: 'Zulu Nation',
      motto: 'Strength in unity, power in heritage',
      accentColor: '#EF4444',
      iconKey: 'zulu-nation.svg',
    },
    {
      slug: 'diaspora-rising',
      name: 'Diaspora Rising',
      motto: 'Global roots, infinite futures',
      accentColor: '#10B981',
      iconKey: 'diaspora-rising.svg',
    },
  ];
  
  try {
    for (const tribeData of defaultTribes) {
      const existing = await Tribe.findOne({ slug: tribeData.slug });
      
      if (!existing) {
        await Tribe.create(tribeData);
        logger.info(`Created tribe: ${tribeData.name}`);
      } else {
        logger.info(`Tribe already exists: ${tribeData.name}`);
      }
    }
    
    logger.info('Default tribes seeded successfully');
  } catch (error) {
    logger.error('Error seeding tribes:', error);
    throw error;
  }
}

/**
 * Complete database initialization
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('Initializing database...');
  
  try {
    await createIndexes();
    await validateDatabase();
    await seedDefaultTribes();
    
    const stats = await getDatabaseStats();
    logger.info('Database initialized successfully', stats);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  details: any;
}> {
  try {
    // Check connection
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      return {
        healthy: false,
        details: { error: 'Database not connected' },
      };
    }
    
    // Ping database
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    await db.admin().ping();
    
    // Get basic stats
    const stats = await getDatabaseStats();
    
    return {
      healthy: true,
      details: stats,
    };
  } catch (error) {
    return {
      healthy: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

