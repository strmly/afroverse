import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Reset Database Script
 * 
 * Deletes all user-generated content:
 * - Users
 * - Posts
 * - Generations
 * - Respects
 * - Follows
 * - User Selfies
 * - OTP Sessions
 * - Refresh Tokens
 * 
 * Keeps:
 * - Tribes (core data)
 * 
 * Usage: npm run reset-db
 */

async function resetDatabase() {
  console.log('🗑️  DATABASE RESET SCRIPT\n');
  console.log('⚠️  WARNING: This will delete ALL user data!\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Get all collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Current database state:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    console.log('');

    // Collections to delete
    const collectionsToDelete = [
      'users',
      'posts',
      'generations',
      'respects',
      'follows',
      'userselfies',
      'otpsessions',
      'refreshtokens',
    ];

    console.log('🗑️  Deleting collections...\n');

    for (const collectionName of collectionsToDelete) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ Deleted ${result.deletedCount} documents from ${collectionName}`);
        } else {
          console.log(`⏭️  ${collectionName} already empty`);
        }
      } catch (error: any) {
        if (error.message.includes('ns not found')) {
          console.log(`⏭️  ${collectionName} does not exist`);
        } else {
          console.error(`❌ Error deleting ${collectionName}:`, error.message);
        }
      }
    }

    console.log('\n📊 Final database state:');
    const finalCollections = await db.listCollections().toArray();
    for (const collection of finalCollections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

    console.log('\n✅ Database reset complete!');
    console.log('\n📝 Summary:');
    console.log('   - All users deleted');
    console.log('   - All posts deleted');
    console.log('   - All generations deleted');
    console.log('   - All respects deleted');
    console.log('   - All follows deleted');
    console.log('   - All selfies deleted');
    console.log('   - All OTP sessions deleted');
    console.log('   - Tribes preserved ✓');
    console.log('\n🚀 Ready for fresh start!');

  } catch (error: any) {
    console.error('\n❌ Reset failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Confirm before running
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  resetDatabase();
} else {
  console.log('🗑️  DATABASE RESET SCRIPT\n');
  console.log('⚠️  WARNING: This will delete ALL user data!\n');
  console.log('This will delete:');
  console.log('  - All users');
  console.log('  - All posts');
  console.log('  - All generations');
  console.log('  - All respects');
  console.log('  - All follows');
  console.log('  - All selfies');
  console.log('  - All sessions\n');
  console.log('This will keep:');
  console.log('  - Tribes (core data)\n');
  console.log('To proceed, run:');
  console.log('  npm run reset-db -- --confirm\n');
  process.exit(0);
}

