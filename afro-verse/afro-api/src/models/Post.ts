import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Post Model - Public Content
 * 
 * Purpose:
 * - Feed items
 * - Tribe content
 * - Profile grid
 * 
 * Posts are PUBLISHED REFERENCES to generation versions.
 * 
 * Invariants:
 * - Posts always reference an existing generation version
 * - Posts are immutable except: caption edits, status changes
 * - Deleting a post does NOT delete the generation
 */

export interface IPost extends Document {
  _id: Types.ObjectId;
  
  userId: Types.ObjectId;
  tribeId: Types.ObjectId;
  
  generationId: Types.ObjectId;
  versionId: string;
  
  caption?: string;
  styleTag?: string;
  
  visibility: 'tribe' | 'public';
  
  media: {
    imagePath: string;
    thumbPath: string;
    watermarkedImagePath?: string;
    watermarkedThumbPath?: string;
    cleanImagePath?: string;
    cleanThumbPath?: string;
    hasWatermark: boolean;
    aspect: '1:1' | '9:16';
  };
  
  counts: {
    respects: number;
    shares: number;
  };
  
  rank: {
    qualityScore: number;
    hotScore: number;
  };
  
  status: 'active' | 'removed' | 'flagged';
  
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tribeId: {
      type: Schema.Types.ObjectId,
      ref: 'Tribe',
      required: true,
    },
    
    // GENERATION REFERENCE (immutable)
    generationId: {
      type: Schema.Types.ObjectId,
      ref: 'Generation',
      required: true,
      immutable: true,
    },
    versionId: {
      type: String,
      required: true,
      immutable: true,
    },
    
    // CONTENT (mutable)
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    styleTag: {
      type: String,
      maxlength: 50,
    },
    
    visibility: {
      type: String,
      enum: ['tribe', 'public'],
      default: 'tribe',
    },
    
    // MEDIA (denormalized from generation)
    media: {
      imagePath: {
        type: String,
        required: true,
      },
      thumbPath: {
        type: String,
        required: true,
      },
      watermarkedImagePath: {
        type: String,
      },
      watermarkedThumbPath: {
        type: String,
      },
      cleanImagePath: {
        type: String,
      },
      cleanThumbPath: {
        type: String,
      },
      hasWatermark: {
        type: Boolean,
        default: true,
      },
      aspect: {
        type: String,
        enum: ['1:1', '9:16'],
        default: '1:1',
      },
    },
    
    // DENORMALIZED COUNTERS
    counts: {
      respects: {
        type: Number,
        default: 0,
        min: 0,
      },
      shares: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    
    // RANKING (for feed algorithm)
    rank: {
      qualityScore: {
        type: Number,
        default: 0,
      },
      hotScore: {
        type: Number,
        default: 0,
      },
    },
    
    status: {
      type: String,
      enum: ['active', 'removed', 'flagged'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES (Critical for feed performance)
PostSchema.index({ tribeId: 1, createdAt: -1 });
PostSchema.index({ visibility: 1, createdAt: -1 });
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ status: 1 });
PostSchema.index({ 'rank.hotScore': -1 }); // For hot feed

// INVARIANT VALIDATION
PostSchema.pre('save', function (next) {
  // Validate media is present
  if (!this.media.imagePath || !this.media.thumbPath) {
    return next(new Error('Post must have valid media paths'));
  }
  
  next();
});

// METHODS
PostSchema.methods.updateCaption = function (newCaption: string) {
  this.caption = newCaption;
  return this.save();
};

PostSchema.methods.softDelete = function () {
  this.status = 'removed';
  return this.save();
};

PostSchema.methods.flag = function () {
  this.status = 'flagged';
  return this.save();
};

PostSchema.methods.isActive = function () {
  return this.status === 'active';
};

PostSchema.methods.toFeedItem = function () {
  return {
    id: this._id,
    userId: this.userId,
    tribeId: this.tribeId,
    caption: this.caption,
    styleTag: this.styleTag,
    media: this.media,
    counts: this.counts,
    createdAt: this.createdAt,
  };
};

// STATICS
PostSchema.statics.findFeedByTribe = function (
  tribeId: Types.ObjectId,
  limit: number = 20,
  before?: Date
) {
  const query: any = {
    tribeId,
    status: 'active',
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username displayName avatar');
};

PostSchema.statics.findByUser = function (
  userId: Types.ObjectId,
  limit: number = 20,
  before?: Date
) {
  const query: any = {
    userId,
    status: 'active',
  };
  
  if (before) {
    query.createdAt = { $lt: before };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

export const Post = mongoose.model<IPost>('Post', PostSchema);





