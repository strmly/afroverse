/**
 * AfroMoji South Africa Database Seeding with ACTUAL AI Image Generation
 * Seeds 1000 users and 1000 culturally diverse transformations
 * Generates REAL images using Nano Banana Pro
 * 
 * Usage: npx ts-node scripts/seed-sa-with-images.ts [--confirm] [--batch-size=10]
 */

import dotenv from 'dotenv';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import fs from 'fs/promises';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectDatabase } from '../src/config/db';
import { User } from '../src/models/User';
import { Generation } from '../src/models/Generation';
import { Tribe } from '../src/models/Tribe';
import { logger } from '../src/utils/logger';

import { generateSeedUsers } from './seed-data/user-generator';
import { allClusters } from './seed-data/clusters';
import { buildAllPrompts, GenerationPrompt } from './seed-data/prompt-builder';
import { generateImage } from '../src/services/gemini.service';
import { uploadImageToGCS } from '../src/utils/image';
import { setAvatar } from '../src/services/profile.service';
import { createPost } from '../src/services/post.service';
import sharp from 'sharp';

// Base photography style (always applied)
const BASE_PHOTOGRAPHY_STYLE = `
Hyper-realistic amateur photography, iPhone snapshot quality, natural lighting, casual everyday aesthetic, realistic details, background also in focus, tiny imperfections only from real life (not digital noise), no filters, no dramatic color grading, soft neutral tones, imperfect framing with subjects slightly off-center, real-life unedited vibe, clean high-resolution look, crisp edges, natural skin texture, realistic shadows and highlights, handheld composition, 23mm wide-angle feel, 1:1 aspect ratio
`.trim();

const BASE_NEGATIVE_PROMPT = `
No date/time stamp, no cinematic look, no vignette, no background blur, no symmetrical composition, no grain, no low resolution, no harsh artifacts
`.trim();

// Configuration
const TARGET_USERS = 1000;
const TARGET_POSTS = 1000;
const DEFAULT_BATCH_SIZE = 10; // Generate 10 images at a time
const PROGRESS_FILE = path.resolve(__dirname, '../seed-progress.json');

interface SeedProgress {
  usersCreated: number;
  imagesGenerated: number;
  postsCreated: number;
  errors: number;
  lastProcessedIndex: number;
  failedIndices: number[];
  startTime: string;
  lastUpdated: string;
}

interface SeedStats extends SeedProgress {
  endTime?: string;
  duration?: number;
}

async function loadProgress(): Promise<SeedProgress | null> {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveProgress(progress: SeedProgress): Promise<void> {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function main() {
  const stats: SeedStats = {
    usersCreated: 0,
    imagesGenerated: 0,
    postsCreated: 0,
    errors: 0,
    lastProcessedIndex: -1,
    failedIndices: [],
    startTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  try {
    // Parse arguments
    const hasConfirm = process.argv.includes('--confirm');
    const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch-size='));
    const batchSize = batchSizeArg
      ? parseInt(batchSizeArg.split('=')[1])
      : DEFAULT_BATCH_SIZE;

    if (!hasConfirm) {
      console.log('\n⚠️  WARNING: This will:');
      console.log('   • Create 1000 users in your database');
      console.log('   • Generate 1000 REAL AI images using Nano Banana Pro');
      console.log('   • Upload images to GCS');
      console.log('   • Create 1000 posts');
      console.log('\n   This will consume API credits and take significant time.');
      console.log('   Estimated time: 30-60 minutes (depending on API speed)\n');
      console.log('   Run with --confirm to proceed:');
      console.log('   npx ts-node scripts/seed-sa-with-images.ts --confirm\n');
      console.log('   Optional: --batch-size=N to process N images at a time (default: 10)\n');
      process.exit(0);
    }

    console.log('\n🌍 AfroMoji SA Seed Library - WITH REAL IMAGE GENERATION');
    console.log('═'.repeat(70));
    console.log(`Target: ${TARGET_USERS} users, ${TARGET_POSTS} posts with real images`);
    console.log(`Batch size: ${batchSize} images per batch\n`);

    // Check for existing progress
    const existingProgress = await loadProgress();
    if (existingProgress) {
      console.log('📊 Found existing progress:');
      console.log(`   Users created: ${existingProgress.usersCreated}`);
      console.log(`   Images generated: ${existingProgress.imagesGenerated}`);
      console.log(`   Last index: ${existingProgress.lastProcessedIndex}`);
      console.log(`   Failed indices: ${existingProgress.failedIndices.length}\n`);
      
      const resume = process.argv.includes('--resume');
      if (!resume) {
        console.log('   Add --resume to continue from last checkpoint\n');
        process.exit(0);
      }
      
      Object.assign(stats, existingProgress);
      console.log('✅ Resuming from checkpoint\n');
    }

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to database\n');

    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not configured in .env');
      process.exit(1);
    }
    console.log('✅ Gemini API (Nano Banana Pro) ready\n');

    // Get tribes
    const tribes = await Tribe.find();
    if (tribes.length === 0) {
      console.error('❌ No tribes found. Run database initialization first.');
      process.exit(1);
    }
    console.log(`✅ Found ${tribes.length} tribes\n`);
    
    const tribeIds = tribes.map(t => t._id);

    // STEP 1: Generate/Load users
    console.log('👥 Step 1: Users...');
    let createdUsers: any[] = [];
    
    if (stats.usersCreated === 0) {
      console.log('   Generating user profiles...');
      const seedUsers = generateSeedUsers(TARGET_USERS, tribeIds);
      
      console.log('   Creating users in database...');
      const userBatchSize = 50;
      for (let i = 0; i < seedUsers.length; i += userBatchSize) {
        const batch = seedUsers.slice(i, i + userBatchSize);
        try {
          const users = await User.insertMany(
            batch.map(su => {
              // Sanitize username - ensure it's valid (3-30 chars, a-z0-9_ only)
              let sanitizedUsername = su.username.toLowerCase().replace(/[^a-z0-9_]/g, '_');
              // Ensure minimum length of 3
              if (sanitizedUsername.length < 3) {
                sanitizedUsername = `${sanitizedUsername}${Math.random().toString(36).substring(2, 5)}`;
              }
              // Ensure max length of 30
              sanitizedUsername = sanitizedUsername.substring(0, 30);
              
              // Ensure phoneE164 format
              const phoneClean = su.phoneNumber.replace(/\s+/g, '').replace(/^\+?27/, '');
              const phoneE164 = `+27${phoneClean}`;
              
              return {
                phoneE164,
                phoneVerified: true,
                auth: {
                  provider: 'whatsapp' as const,
                  lastVerifiedAt: su.createdAt,
                },
                username: sanitizedUsername,
                displayName: su.displayName,
                tribeId: su.tribeId,
                bio: su.bio,
                counters: {
                  posts: 0,
                  respectsReceived: 0,
                },
                followersCount: 0,
                followingCount: 0,
                roles: [],
                status: {
                  banned: false,
                  shadowbanned: false,
                },
                createdAt: su.createdAt,
                updatedAt: su.createdAt,
              };
            }),
            { ordered: false }
          );
          createdUsers.push(...users);
          stats.usersCreated += users.length;
          process.stdout.write(`\r   Progress: ${stats.usersCreated}/${TARGET_USERS} users`);
        } catch (error: any) {
          if (error.code === 11000) {
            // Duplicate key - some users already exist, try inserting individually
            console.log(`\n   Some usernames already exist, inserting individually...`);
            for (const su of batch) {
              try {
                // Max length is 30 chars, so: base (max 15) + _ + timestamp (10) + random (4) = 30
                const sanitizedBase = su.username.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 15);
                const timestamp = Date.now().toString().slice(-10); // Last 10 digits
                const random = Math.random().toString(36).substring(2, 6); // 4 chars
                const uniqueUsername = `${sanitizedBase}_${timestamp}${random}`.substring(0, 30);
                
                const phoneClean = su.phoneNumber.replace(/\s+/g, '').replace(/^\+?27/, '');
                const phoneE164 = `+27${phoneClean}`;
                
                const user = await User.create({
                  phoneE164,
                  phoneVerified: true,
                  auth: {
                    provider: 'whatsapp',
                    lastVerifiedAt: su.createdAt,
                  },
                  username: uniqueUsername,
                  displayName: su.displayName,
                  tribeId: su.tribeId,
                  bio: su.bio,
                  counters: {
                    posts: 0,
                    respectsReceived: 0,
                  },
                  followersCount: 0,
                  followingCount: 0,
                  roles: [],
                  status: {
                    banned: false,
                    shadowbanned: false,
                  },
                  createdAt: su.createdAt,
                  updatedAt: su.createdAt,
                });
                createdUsers.push(user);
                stats.usersCreated++;
              } catch (err: any) {
                if (err.code !== 11000) {
                  console.error(`   Error creating user ${su.username}:`, err.message);
                  stats.errors++;
                }
              }
            }
          } else {
            console.error('\n   Error:', error.message);
            stats.errors++;
          }
        }
      }
      console.log(`\n✅ Users created: ${createdUsers.length}\n`);
    }
    
    // If we don't have enough users, load existing ones or create more
    if (createdUsers.length < TARGET_USERS) {
      console.log(`   Loading existing users to reach ${TARGET_USERS}...`);
      const existingUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(TARGET_USERS);
      
      // Merge with created users, avoiding duplicates
      const existingUsernames = new Set(createdUsers.map(u => u.username));
      const additionalUsers = existingUsers.filter(u => !existingUsernames.has(u.username));
      createdUsers.push(...additionalUsers);
      
      console.log(`   Total users available: ${createdUsers.length}\n`);
    }

    if (createdUsers.length === 0) {
      console.error('❌ No users available. Exiting.');
      process.exit(1);
    }
    
    // If we still don't have enough, create more
    if (createdUsers.length < TARGET_USERS) {
      const needed = TARGET_USERS - createdUsers.length;
      console.log(`   Creating ${needed} more users...`);
      const seedUsers = generateSeedUsers(needed, tribeIds);
      
      for (const su of seedUsers) {
        try {
            // Sanitize username: remove spaces, dots, special chars, keep only a-z0-9_
            // Max length is 30 chars, so: base (max 15) + _ + timestamp (10) + random (4) = 30
            const sanitizedBase = su.username.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 15);
            const timestamp = Date.now().toString().slice(-10); // Last 10 digits
            const random = Math.random().toString(36).substring(2, 6); // 4 chars
            const uniqueUsername = `${sanitizedBase}_${timestamp}${random}`.substring(0, 30);
          
          // Ensure phoneE164 format: +27XXXXXXXXX (remove spaces, ensure +27 prefix)
          const phoneClean = su.phoneNumber.replace(/\s+/g, '').replace(/^\+?27/, '');
          const phoneE164 = `+27${phoneClean}`;
          
          const user = await User.create({
            phoneE164,
            phoneVerified: true,
            auth: {
              provider: 'whatsapp',
              lastVerifiedAt: su.createdAt,
            },
            username: uniqueUsername,
            displayName: su.displayName,
            tribeId: su.tribeId,
            bio: su.bio,
            counters: {
              posts: 0,
              respectsReceived: 0,
            },
            followersCount: 0,
            followingCount: 0,
            roles: [],
            status: {
              banned: false,
              shadowbanned: false,
            },
            createdAt: su.createdAt,
            updatedAt: su.createdAt,
          });
          createdUsers.push(user);
          stats.usersCreated++;
        } catch (err: any) {
          console.error(`   Error:`, err.message);
          stats.errors++;
        }
      }
      console.log(`   Created ${needed} additional users\n`);
    }

    // STEP 2: Build prompts
    console.log('🎨 Step 2: Building prompts...');
    const allPrompts = buildAllPrompts(allClusters);
    console.log(`   Generated ${allPrompts.length} prompts\n`);

    // STEP 3: Generate images and create posts
    console.log('🖼️  Step 3: Generating images and creating posts...');
    console.log(`   Starting from index: ${stats.lastProcessedIndex + 1}\n`);

    const startIndex = stats.lastProcessedIndex + 1;
    
    for (let i = startIndex; i < Math.min(allPrompts.length, TARGET_POSTS); i += batchSize) {
      const batchPrompts = allPrompts.slice(i, Math.min(i + batchSize, TARGET_POSTS));
      
      console.log(`\n   Batch ${Math.floor(i / batchSize) + 1}: Processing prompts ${i + 1}-${i + batchPrompts.length}`);
      
      // Process batch in parallel (but limited)
      const batchResults = await Promise.allSettled(
        batchPrompts.map(async (prompt, batchIndex) => {
          const globalIndex = i + batchIndex;
          const user = createdUsers[globalIndex % createdUsers.length];
          
          try {
            const generationId = new Types.ObjectId();
            const versionId = new Types.ObjectId();
            
            console.log(`   [${globalIndex + 1}] Generating: ${prompt.clusterName}...`);
            
            // Combine prompts with base photography style
            const fullPrompt = [prompt.prompt, BASE_PHOTOGRAPHY_STYLE].join(', ');
            const fullNegativePrompt = [prompt.negativePrompt, BASE_NEGATIVE_PROMPT].join(', ');
            
            // Generate image with Gemini (Nano Banana Pro) with retry
            let imageBuffer: Buffer | null = null;
            let lastError: Error | undefined;
            
            // Log prompt length for debugging
            const promptLength = fullPrompt.length;
            if (promptLength > 2000) {
              console.log(`   [${globalIndex + 1}] ⚠️  Warning: Prompt is very long (${promptLength} chars)`);
            }
            
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const result = await generateImage({
                  prompt: fullPrompt,
                  aspectRatio: '1:1',
                  quality: 'high',
                });
                
                imageBuffer = result.imageData;
                break;
              } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || String(error);
                const errorCode = error.code || 'UNKNOWN';
                console.error(`   [${globalIndex + 1}] Attempt ${attempt} failed:`, errorMsg, `(Code: ${errorCode})`);
                
                if (attempt < 3) {
                  const delay = 2000 * Math.pow(2, attempt - 1);
                  console.log(`   [${globalIndex + 1}] Retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            }
            
            if (!imageBuffer) {
              const errorDetails = lastError 
                ? `${lastError.message} (${lastError.name || 'Error'})`
                : 'Unknown error';
              throw new Error(`Image generation failed after 3 attempts: ${errorDetails}`);
            }
            
            // Get dimensions first
            const metadata = await sharp(imageBuffer).metadata();
            const dimensions = {
              width: metadata.width || 1024,
              height: metadata.height || 1024,
            };
            
            // Prepare paths
            const basePath = `generations/${user._id}/${generationId}`;
            const timestamp = Date.now();
            const imagePath = `${basePath}/v1_${timestamp}.webp`;
            const thumbPath = `${basePath}/v1_${timestamp}_thumb.webp`;
            
            // Upload to GCS (this handles watermarking internally)
            const uploadResult = await uploadImageToGCS(
              imageBuffer,
              imagePath,
              thumbPath,
              {
                transformationId: generationId.toString(),
                applyWatermark: true,
                visibilityType: 'seed',
              }
            );
            
            const watermarkedPath = uploadResult.watermarkedPath || imagePath.replace(/(\.[^.]+)$/, '_wm$1');
            const cleanPath = uploadResult.cleanPath;
            
            // Derive thumbnail path (uploadImageToGCS uploads it with _wm suffix)
            const watermarkedThumbPath = thumbPath.replace(/(\.[^.]+)$/, '_wm$1');
            
            console.log(`   [${globalIndex + 1}] ✅ Image generated and uploaded`);
            
            // Create generation record
            const generation = await Generation.create({
              _id: generationId,
              userId: user._id,
              source: {
                selfieIds: [],
                mode: 'prompt',
                seedPostId: undefined,
              },
              style: {
                prompt: fullPrompt,
                negativePrompt: fullNegativePrompt,
                parameters: {
                  aspect: '1:1',
                  quality: 'high',
                },
              },
              provider: {
                name: 'gemini',
                model: 'gemini-3-pro-image-preview',
                requestIds: [],
              },
              status: 'succeeded',
              versions: [{
                versionId: versionId.toString(),
                imagePath: watermarkedPath,
                thumbPath: watermarkedThumbPath,
                watermarkedImagePath: watermarkedPath,
                watermarkedThumbPath: watermarkedThumbPath,
                cleanImagePath: cleanPath,
                cleanThumbPath: cleanPath ? cleanPath.replace(/(\.[^.]+)$/, '_thumb$1') : undefined,
                hasWatermark: true,
                createdAt: new Date(),
              }],
              attempts: 1,
              maxAttempts: 3,
              lastAttemptAt: new Date(),
              createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
              updatedAt: new Date(),
            });
            
            // Set as user's profile picture using the service
            const avatarResult = await setAvatar(user._id.toString(), {
              generationId: generationId.toString(),
              versionId: versionId.toString(),
            });
            
            if (!avatarResult.success) {
              console.error(`   [${globalIndex + 1}] ⚠️  Failed to set avatar: ${avatarResult.error}`);
            } else {
              console.log(`   [${globalIndex + 1}] ✅ Avatar set as profile picture`);
            }
            
            // Create post using the service
            const visibility = Math.random() < 0.8 ? 'public' : 'tribe';
            const postResult = await createPost({
              userId: user._id.toString(),
              generationId: generationId.toString(),
              versionId: versionId.toString(),
              caption: generateCaption(prompt),
              visibility,
              idempotencyKey: `${generationId}-${versionId}-${Date.now()}`,
            });
            
            if (!postResult.success) {
              throw new Error(`Failed to create post: ${postResult.error}`);
            }
            
            console.log(`   [${globalIndex + 1}] ✅ Post created: ${postResult.postId}`);
            
            return { success: true, index: globalIndex };
          } catch (error: any) {
            console.error(`   [${globalIndex + 1}] ❌ Failed: ${error.message}`);
            stats.failedIndices.push(globalIndex);
            return { success: false, index: globalIndex, error: error.message };
          }
        })
      );
      
      // Update stats
      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.success) {
          stats.imagesGenerated++;
          stats.postsCreated++;
        } else {
          stats.errors++;
        }
      });
      
      stats.lastProcessedIndex = i + batchPrompts.length - 1;
      stats.lastUpdated = new Date().toISOString();
      
      // Save progress after each batch
      await saveProgress(stats);
      
      console.log(`\n   Batch complete. Total: ${stats.imagesGenerated}/${TARGET_POSTS} images generated`);
      console.log(`   Errors: ${stats.errors}, Failed indices: ${stats.failedIndices.length}`);
      
      // Rate limiting: wait 2 seconds between batches
      if (i + batchSize < TARGET_POSTS) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ All batches complete\n');

    stats.endTime = new Date().toISOString();
    stats.duration = Math.round(
      (new Date(stats.endTime).getTime() - new Date(stats.startTime).getTime()) / 1000
    );

    // Final summary
    console.log('═'.repeat(70));
    console.log('✅ Seeding Complete!');
    console.log('═'.repeat(70));
    console.log(`Users created:       ${stats.usersCreated}`);
    console.log(`Images generated:    ${stats.imagesGenerated}`);
    console.log(`Posts created:       ${stats.postsCreated}`);
    console.log(`Errors:              ${stats.errors}`);
    console.log(`Failed indices:      ${stats.failedIndices.length}`);
    console.log(`Duration:            ${stats.duration}s (${Math.round(stats.duration / 60)}m)`);
    console.log('═'.repeat(70));

    if (stats.failedIndices.length > 0) {
      console.log('\n⚠️  Failed indices (can retry):');
      console.log(`   ${stats.failedIndices.join(', ')}`);
    }
    
    console.log('\n📊 Seed library ready for use!');
    console.log('   • All images have been generated and watermarked');
    console.log('   • Posts are live in the feed');
    console.log('   • "Try This Style" functionality enabled\n');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error);
    stats.lastUpdated = new Date().toISOString();
    await saveProgress(stats);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from database\n');
  }
}

function generateCaption(prompt: GenerationPrompt): string | undefined {
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

