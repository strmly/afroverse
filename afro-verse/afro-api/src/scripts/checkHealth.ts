#!/usr/bin/env ts-node

/**
 * Database Health Check Script
 * 
 * Run this script to check database health and connectivity.
 * 
 * Usage: npm run check:health
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { checkDatabaseHealth, getDatabaseStats } from '../utils/dbInit';
import { logger } from '../utils/logger';

async function checkHealth() {
  try {
    logger.info('=== Database Health Check ===');
    
    // Connect to database
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✓ Connected to MongoDB');
    
    // Check health
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      logger.info('✓ Database is healthy');
      
      const stats = await getDatabaseStats();
      logger.info('\n=== Database Statistics ===');
      logger.info(`Total Collections: 7`);
      logger.info(`Users: ${stats.collections.users}`);
      logger.info(`Tribes: ${stats.collections.tribes}`);
      logger.info(`UserSelfies: ${stats.collections.userSelfies}`);
      logger.info(`Generations: ${stats.collections.generations}`);
      logger.info(`Posts: ${stats.collections.posts}`);
      logger.info(`Respects: ${stats.collections.respects}`);
      logger.info(`OTP Sessions: ${stats.collections.otpSessions}`);
    } else {
      logger.error('✗ Database is unhealthy');
      logger.error(health.details);
    }
    
    await mongoose.connection.close();
    process.exit(health.healthy ? 0 : 1);
  } catch (error) {
    logger.error('Health check failed:', error);
    process.exit(1);
  }
}

checkHealth();







