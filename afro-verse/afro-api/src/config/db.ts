import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';
import { initializeDatabase } from '../utils/dbInit';

/**
 * Database Configuration
 * 
 * Handles MongoDB connection with retry logic and initialization.
 */

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...');

    const options = {
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
    };

    await mongoose.connect(env.MONGODB_URI, options);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Initialize database (create indexes, seed tribes)
    await initializeDatabase();

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await disconnectDatabase();
      process.exit(0);
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    
    // In development, allow server to start without MongoDB (for testing)
    if (env.NODE_ENV === 'development') {
      logger.warn('⚠️  Server starting without MongoDB connection (development mode)');
      logger.warn('⚠️  Start MongoDB with: brew services start mongodb-community');
      return;
    }
    
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

export function getDatabaseConnection() {
  return mongoose.connection;
}

export function isConnectionReady(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

