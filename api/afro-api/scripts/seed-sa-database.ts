/**
 * AfroMoji South Africa Database Seeding Script
 * Seeds 1000 users and 1000 culturally diverse transformations
 * 
 * Usage: npx ts-node scripts/seed-sa-database.ts [--confirm]
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose, { Types } from 'mongoose';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDatabase } from '../src/config/db';
import { User } from '../src/models/User';
import { Post } from '../src/models/Post';
import { Generation } from '../src/models/Generation';
import { Tribe } from '../src/models/Tribe';
import { logger } from '../src/utils/logger';

import { generateSeedUsers } from './seed-data/user-generator';
import { allClusters } from './seed-data/clusters';
import { buildAllPrompts, GenerationPrompt } from './seed-data/prompt-builder';

// Configuration
const TARGET_USERS = 1000;
const TARGET_POSTS = 1000;
const BATCH_SIZE = 50;

interface SeedStats {
  usersCreated: number;
  generationsCreated: number;
  postsCreated: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

async function main() {
  const stats: SeedStats = {
    usersCreated: 0,
    generationsCreated: 0,
    postsCreated: 0,
    errors: 0,
    startTime: new Date(),
  };

  try {
    // Check for --confirm flag
    const hasConfirm = process.argv.includes('--confirm');
    if (!hasConfirm) {
      console.log('\n⚠️  WARNING: This will create 1000 users and 1000 posts in your database.');
      console.log('   This is a significant operation and cannot be easily undone.');
      console.log('\n   Run with --confirm to proceed: npx ts-node scripts/seed-sa-database.ts --confirm\n');
      process.exit(0);
    }

    console.log('\n🌍 AfroMoji South Africa Database Seeding');
    console.log('=' .repeat(60));
    console.log(`Target: ${TARGET_USERS} users, ${TARGET_POSTS} posts\n`);

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Get all tribes
    const tribes = await Tribe.find();
    if (tribes.length === 0) {
      console.error('❌ No tribes found. Please run database initialization first.');
      process.exit(1);
    }
    console.log(`✅ Found ${tribes.length} tribes\n`);
    
    const tribeIds = tribes.map(t => t._id);

    // STEP 1: Generate and create users
    console.log('👥 Step 1: Generating users...');
    const seedUsers = generateSeedUsers(TARGET_USERS, tribeIds);
    console.log(`   Generated ${seedUsers.length} user profiles`);

    console.log('   Creating users in database...');
    const createdUsers = [];
    for (let i = 0; i < seedUsers.length; i += BATCH_SIZE) {
      const batch = seedUsers.slice(i, i + BATCH_SIZE);
      try {
        const users = await User.insertMany(
          batch.map(su => ({
            username: su.username,
            displayName: su.displayName,
            phoneNumber: su.phoneNumber,
            phoneCountryCode: '+27',
            tribeId: su.tribeId,
            bio: su.bio,
            counters: {
              posts: 0,
              respectsReceived: 0,
              respectsGiven: 0,
              followers: 0,
              following: 0,
            },
            createdAt: su.createdAt,
            updatedAt: su.createdAt,
          })),
          { ordered: false }
        );
        createdUsers.push(...users);
        stats.usersCreated += users.length;
        process.stdout.write(`\r   Progress: ${stats.usersCreated}/${TARGET_USERS} users`);
      } catch (error: any) {
        // Handle duplicate key errors
        if (error.code === 11000) {
          console.log(`\n   ⚠️  Skipping ${batch.length} users (duplicates)`);
        } else {
          console.error('\n   Error creating user batch:', error.message);
          stats.errors++;
        }
      }
    }
    console.log('\n✅ Users created\n');

    if (createdUsers.length === 0) {
      console.error('❌ No users were created. Exiting.');
      process.exit(1);
    }

    // STEP 2: Build prompts for all clusters
    console.log('🎨 Step 2: Building generation prompts...');
    const prompts = buildAllPrompts(allClusters);
    console.log(`   Generated ${prompts.length} prompts across ${allClusters.length} clusters`);
    
    // Distribution check
    const distribution: Record<string, number> = {};
    prompts.forEach(p => {
      distribution[p.clusterId] = (distribution[p.clusterId] || 0) + 1;
    });
    console.log('\n   Distribution by cluster:');
    Object.entries(distribution).forEach(([cluster, count]) => {
      console.log(`   - ${cluster}: ${count}`);
    });
    console.log('');

    // STEP 3: Create generations and posts
    console.log('🖼️  Step 3: Creating generations and posts...');
    
    for (let i = 0; i < prompts.length && i < TARGET_POSTS; i++) {
      const prompt = prompts[i];
      const user = createdUsers[i % createdUsers.length]; // Cycle through users
      
      try {
        // Create generation record
        // Note: In production, this would be created by your AI generation service
        // For seeding, we create complete records with placeholder paths
        
        const generationId = new Types.ObjectId();
        const versionId = new Types.ObjectId();
        
        // Create realistic GCS paths
        const basePath = `generations/${user._id}/${generationId}`;
        const timestamp = Date.now();
        
        const generation = await Generation.create({
          _id: generationId,
          userId: user._id,
          prompt: prompt.prompt,
          negativePrompt: prompt.negativePrompt,
          status: 'complete',
          versions: [{
            versionId: versionId.toString(),
            imagePath: `${basePath}/v1_${timestamp}_wm.webp`,
            thumbPath: `${basePath}/v1_${timestamp}_thumb_wm.webp`,
            dimensions: { width: 768, height: 1024 },
            createdAt: new Date(),
          }],
          metadata: {
            model: 'seed-library-v1',
            seed: Math.floor(Math.random() * 1000000),
            steps: 50,
            ...prompt.styleDNA,
            culturalTags: prompt.metadata.culturalTags,
            languageTags: prompt.metadata.languageTags,
            regionTags: prompt.metadata.regionTags,
            styleIntensity: prompt.metadata.styleIntensity,
            category: prompt.metadata.category,
            seedId: prompt.seedId,
          },
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Last 30 days
          completedAt: new Date(),
        });

        // Create post from generation
        const visibility = Math.random() < 0.8 ? 'public' : 'tribe'; // 80% public
        
        const post = await Post.create({
          userId: user._id,
          generationId: generation._id,
          versionId: versionId.toString(),
          media: {
            imagePath: generation.versions[0].imagePath,
            thumbPath: generation.versions[0].thumbPath,
            watermarkedImagePath: generation.versions[0].imagePath,
            dimensions: generation.versions[0].dimensions,
            aspect: '3:4',
          },
          caption: generateCaption(prompt),
          visibility,
          counts: {
            respects: Math.floor(Math.random() * 50), // Random initial respects
            shares: Math.floor(Math.random() * 10),
            remixes: Math.floor(Math.random() * 5),
          },
          tags: [...prompt.metadata.culturalTags, ...prompt.metadata.languageTags],
          metadata: {
            seedPost: true,
            seedId: prompt.seedId,
            clusterId: prompt.clusterId,
            styleDNA: prompt.styleDNA,
          },
          status: 'active',
          createdAt: generation.createdAt,
        });

        // Update user post count
        await User.updateOne(
          { _id: user._id },
          { $inc: { 'counters.posts': 1 } }
        );

        stats.generationsCreated++;
        stats.postsCreated++;
        
        if ((i + 1) % 50 === 0) {
          process.stdout.write(`\r   Progress: ${i + 1}/${TARGET_POSTS} posts`);
        }
      } catch (error: any) {
        console.error(`\n   Error creating post ${i}:`, error.message);
        stats.errors++;
      }
    }
    
    console.log('\n✅ Generations and posts created\n');

    stats.endTime = new Date();

    // Final summary
    console.log('=' .repeat(60));
    console.log('✅ Seeding Complete!');
    console.log('=' .repeat(60));
    console.log(`Users created:       ${stats.usersCreated}`);
    console.log(`Generations created: ${stats.generationsCreated}`);
    console.log(`Posts created:       ${stats.postsCreated}`);
    console.log(`Errors:              ${stats.errors}`);
    console.log(`Duration:            ${Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)}s`);
    console.log('=' .repeat(60));
    console.log('\n📊 Next Steps:');
    console.log('   1. Verify data in database');
    console.log('   2. Run actual AI generation for seed images (separate process)');
    console.log('   3. Update image paths once images are generated');
    console.log('   4. Test feed distribution and "Try This Style" functionality\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');
  }
}

function generateCaption(prompt: GenerationPrompt): string | undefined {
  // 60% have captions, 40% don't
  if (Math.random() > 0.6) return undefined;
  
  const captions = [
    `${prompt.clusterName} ✨`,
    `Embracing my ${prompt.metadata.culturalTags[0]} roots 🌍`,
    `${prompt.clusterName} • ${prompt.metadata.regionTags[0]}`,
    `Heritage meets future 🔥`,
    `Proudly South African 🇿🇦`,
    `${prompt.clusterName} energy`,
    `Cultural pride, modern style`,
    `This is me 💫`,
    `${prompt.metadata.culturalTags[0]} • ${prompt.metadata.languageTags[0]}`,
    `Representing ${prompt.metadata.regionTags[0]} 🙌`,
  ];
  
  return captions[Math.floor(Math.random() * captions.length)];
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

