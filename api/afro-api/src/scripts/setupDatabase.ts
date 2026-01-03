#!/usr/bin/env ts-node

/**
 * Database Setup Script
 * 
 * Run this script to:
 * - Create all indexes
 * - Seed default tribes
 * - Validate schema
 * - Display database stats
 * 
 * Usage: npm run setup:db
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { initializeDatabase, getDatabaseStats } from '../utils/dbInit';
import { logger } from '../utils/logger';

async function setup() {
  try {
    logger.info('=== Database Setup Starting ===');
    
    // Connect to database
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');
    
    // Initialize database
    await initializeDatabase();
    
    // Display stats
    const stats = await getDatabaseStats();
    logger.info('=== Database Statistics ===');
    logger.info(`Users: ${stats.collections.users}`);
    logger.info(`Tribes: ${stats.collections.tribes}`);
    logger.info(`UserSelfies: ${stats.collections.userSelfies}`);
    logger.info(`Generations: ${stats.collections.generations}`);
    logger.info(`Posts: ${stats.collections.posts}`);
    logger.info(`Respects: ${stats.collections.respects}`);
    logger.info(`OTP Sessions: ${stats.collections.otpSessions}`);
    
    logger.info('=== Database Setup Complete ===');
    
    process.exit(0);
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
}

setup();







