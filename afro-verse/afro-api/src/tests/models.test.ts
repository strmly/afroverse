/**
 * Data Model Tests
 * 
 * Tests for all MongoDB models including:
 * - Schema validation
 * - Invariants
 * - Indexes
 * - Methods
 * - Transactions
 */

import mongoose, { Types } from 'mongoose';
import { User } from '../models/User';
import { Tribe } from '../models/Tribe';
import { UserSelfie } from '../models/UserSelfie';
import { Generation } from '../models/Generation';
import { Post } from '../models/Post';
import { Respect } from '../models/Respect';
import { OTPSession } from '../models/OTPSession';
import { addRespectWithCounters, createPostWithCounters } from '../utils/transactions';

describe('User Model', () => {
  it('should create a valid user', async () => {
    const tribe = await Tribe.create({
      slug: 'test-tribe',
      name: 'Test Tribe',
      motto: 'Test motto',
      accentColor: '#FF0000',
      iconKey: 'test.svg',
    });

    const user = await User.create({
      phoneE164: '+27821234567',
      phoneVerified: true,
      auth: {
        provider: 'whatsapp',
        lastVerifiedAt: new Date(),
      },
      username: 'test_user',
      displayName: 'Test User',
      tribeId: tribe._id,
    });

    expect(user.username).toBe('test_user');
    expect(user.phoneE164).toBe('+27821234567');
    expect(user.counters.posts).toBe(0);
  });

  it('should reject invalid phone number', async () => {
    expect.assertions(1);
    try {
      await User.create({
        phoneE164: 'invalid',
        username: 'test',
        displayName: 'Test',
      });
    } catch (error: any) {
      expect(error.name).toBe('ValidationError');
    }
  });

  it('should reject invalid username', async () => {
    expect.assertions(1);
    try {
      await User.create({
        phoneE164: '+27821234567',
        username: 'INVALID USER',
        displayName: 'Test',
      });
    } catch (error: any) {
      expect(error.name).toBe('ValidationError');
    }
  });
});

describe('Tribe Model', () => {
  it('should create a valid tribe', async () => {
    const tribe = await Tribe.create({
      slug: 'test-tribe-2',
      name: 'Test Tribe 2',
      motto: 'Test motto',
      accentColor: '#00FF00',
      iconKey: 'test2.svg',
    });

    expect(tribe.slug).toBe('test-tribe-2');
    expect(tribe.stats.members).toBe(0);
    expect(tribe.stats.posts).toBe(0);
  });

  it('should reject invalid hex color', async () => {
    expect.assertions(1);
    try {
      await Tribe.create({
        slug: 'test',
        name: 'Test',
        motto: 'Test',
        accentColor: 'red',
        iconKey: 'test.svg',
      });
    } catch (error: any) {
      expect(error.name).toBe('ValidationError');
    }
  });
});

describe('Generation Model', () => {
  it('should create a generation', async () => {
    const user = await User.findOne();
    const generation = await Generation.create({
      userId: user!._id,
      source: {
        selfieIds: [],
        mode: 'prompt',
      },
      style: {
        prompt: 'Test prompt',
        parameters: {
          aspect: '1:1',
          quality: 'standard',
        },
      },
      provider: {
        name: 'test-provider',
        model: 'test-model',
        requestIds: [],
      },
    });

    expect(generation.status).toBe('queued');
    expect(generation.versions).toHaveLength(0);
  });

  it('should append versions correctly', async () => {
    const generation = await Generation.findOne();
    
    await generation!.addVersion({
      imagePath: 'path/to/image.jpg',
      thumbPath: 'path/to/thumb.jpg',
    });

    expect(generation!.versions).toHaveLength(1);
    expect(generation!.versions[0].versionId).toBe('v1');
  });

  it('should not allow succeeded status without versions', async () => {
    expect.assertions(1);
    try {
      const generation = await Generation.findOne();
      generation!.status = 'succeeded';
      await generation!.save();
    } catch (error: any) {
      expect(error.message).toContain('version');
    }
  });
});

describe('Post Model', () => {
  it('should create a post with references', async () => {
    const user = await User.findOne();
    const tribe = await Tribe.findOne();
    const generation = await Generation.findOne();
    
    await generation!.addVersion({
      imagePath: 'path/to/image.jpg',
      thumbPath: 'path/to/thumb.jpg',
    });
    generation!.status = 'succeeded';
    await generation!.save();

    const post = await Post.create({
      userId: user!._id,
      tribeId: tribe!._id,
      generationId: generation!._id,
      versionId: 'v1',
      caption: 'Test caption',
      media: {
        imagePath: 'path/to/image.jpg',
        thumbPath: 'path/to/thumb.jpg',
        aspect: '1:1',
      },
    });

    expect(post.caption).toBe('Test caption');
    expect(post.counts.respects).toBe(0);
    expect(post.status).toBe('active');
  });
});

describe('Respect Model', () => {
  it('should prevent duplicate respects', async () => {
    const user = await User.findOne();
    const post = await Post.findOne();

    await Respect.create({
      userId: user!._id,
      postId: post!._id,
    });

    expect.assertions(1);
    try {
      await Respect.create({
        userId: user!._id,
        postId: post!._id,
      });
    } catch (error: any) {
      expect(error.code).toBe(11000); // Duplicate key error
    }
  });
});

describe('OTPSession Model', () => {
  it('should create OTP session', async () => {
    const session = await OTPSession.createSession(
      '+27821234567',
      'twilio',
      '123456'
    );

    expect(session.phoneE164).toBe('+27821234567');
    expect(session.status).toBe('sent');
    expect(session.attempts).toBe(0);
  });

  it('should verify OTP correctly', async () => {
    const session = await OTPSession.createSession(
      '+27829999999',
      'twilio',
      '123456'
    );

    const verified = await session.verify('123456');
    expect(verified).toBe(true);
    expect(session.status).toBe('verified');
  });

  it('should reject incorrect OTP', async () => {
    const session = await OTPSession.createSession(
      '+27828888888',
      'twilio',
      '123456'
    );

    const verified = await session.verify('999999');
    expect(verified).toBe(false);
    expect(session.attempts).toBe(1);
  });

  it('should expire after max attempts', async () => {
    const session = await OTPSession.createSession(
      '+27827777777',
      'twilio',
      '123456'
    );

    for (let i = 0; i < 5; i++) {
      await session.verify('999999');
    }

    expect(session.status).toBe('failed');
  });
});

describe('Transaction Operations', () => {
  it('should create post with counter updates', async () => {
    const user = await User.findOne();
    const tribe = await Tribe.findOne();
    const generation = await Generation.findOne();

    const initialUserPosts = user!.counters.posts;
    const initialTribePosts = tribe!.stats.posts;

    await createPostWithCounters({
      userId: user!._id,
      tribeId: tribe!._id,
      generationId: generation!._id,
      versionId: 'v1',
      media: {
        imagePath: 'path/to/image.jpg',
        thumbPath: 'path/to/thumb.jpg',
        aspect: '1:1',
      },
    });

    await user!.reload();
    await tribe!.reload();

    expect(user!.counters.posts).toBe(initialUserPosts + 1);
    expect(tribe!.stats.posts).toBe(initialTribePosts + 1);
  });

  it('should add respect with counter updates', async () => {
    const user = await User.findOne();
    const post = await Post.findOne();
    const postOwner = await User.findById(post!.userId);

    const initialPostRespects = post!.counts.respects;
    const initialUserRespects = postOwner!.counters.respectsReceived;

    await addRespectWithCounters(post!._id, user!._id);

    await post!.reload();
    await postOwner!.reload();

    expect(post!.counts.respects).toBe(initialPostRespects + 1);
    expect(postOwner!.counters.respectsReceived).toBe(initialUserRespects + 1);
  });
});

describe('UserSelfie Model', () => {
  it('should create selfie', async () => {
    const user = await User.findOne();
    
    const selfie = await UserSelfie.create({
      userId: user!._id,
      gcsPath: 'selfies/test.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      width: 512,
      height: 512,
    });

    expect(selfie.status).toBe('active');
    expect(selfie.isActive()).toBe(true);
  });

  it('should soft delete selfie', async () => {
    const selfie = await UserSelfie.findOne();
    await selfie!.softDelete();

    expect(selfie!.status).toBe('deleted');
    expect(selfie!.deletedAt).toBeDefined();
  });
});







