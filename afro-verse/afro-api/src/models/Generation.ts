import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Generation Model - Creation Sessions
 * 
 * Purpose:
 * - Represent a creation intent
 * - Hold multiple versions (append-only)
 * - Enable iterative refinement
 * 
 * A generation is NOT a post.
 * 
 * Invariants:
 * - Versions are APPEND-ONLY (never overwrite)
 * - Never delete versions
 * - status=succeeded requires versions.length >= 1
 * - Refinements append versions, not replace them
 */

export interface IGenerationVersion {
  versionId: string; // "v1", "v2", etc.
  imagePath: string;
  thumbPath: string;
  watermarkedImagePath?: string;
  watermarkedThumbPath?: string;
  cleanImagePath?: string;
  cleanThumbPath?: string;
  hasWatermark: boolean;
  createdAt: Date;
}

export interface IGeneration extends Document {
  _id: Types.ObjectId;
  
  userId: Types.ObjectId;
  
  source: {
    selfieIds: Types.ObjectId[];
    mode: 'preset' | 'prompt' | 'try_style';
    seedPostId?: Types.ObjectId;
  };
  
  style: {
    presetId?: string;
    prompt: string;
    negativePrompt?: string;
    parameters: {
      aspect: '1:1' | '9:16';
      quality: 'standard' | 'high';
    };
  };
  
  provider: {
    name: string;
    model: string;
    requestIds: string[];
  };
  
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  
  versions: IGenerationVersion[];
  
  // Retry/lock fields (Vercel async pattern)
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  retryAfter?: Date;
  lockedBy?: string; // requestId
  lockedAt?: Date;
  
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const GenerationVersionSchema = new Schema<IGenerationVersion>(
  {
    versionId: {
      type: String,
      required: true,
    },
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const GenerationSchema = new Schema<IGeneration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    source: {
      selfieIds: {
        type: [Schema.Types.ObjectId],
        ref: 'UserSelfie',
        default: [],
      },
      mode: {
        type: String,
        enum: ['preset', 'prompt', 'try_style'],
        required: true,
      },
      seedPostId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        default: null,
      },
    },
    
    style: {
      presetId: {
        type: String,
        default: null,
      },
      prompt: {
        type: String,
        required: true,
        maxlength: 2000,
      },
      negativePrompt: {
        type: String,
        maxlength: 2000,
        default: null,
      },
      parameters: {
        aspect: {
          type: String,
          enum: ['1:1', '9:16'],
          default: '1:1',
        },
        quality: {
          type: String,
          enum: ['standard', 'high'],
          default: 'standard',
        },
      },
    },
    
    provider: {
      name: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      requestIds: {
        type: [String],
        default: [],
      },
    },
    
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'failed'],
      default: 'queued',
    },
    
    versions: {
      type: [GenerationVersionSchema],
      default: [],
    },
    
    // Retry/lock fields (Vercel async pattern)
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    retryAfter: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: String,
      default: null,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    
    error: {
      code: {
        type: String,
      },
      message: {
        type: String,
      },
      retryable: {
        type: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
GenerationSchema.index({ userId: 1, createdAt: -1 });
GenerationSchema.index({ status: 1 });
// Index for cron retry queries
GenerationSchema.index({ status: 1, retryAfter: 1, attempts: 1 });
GenerationSchema.index({ status: 1, lockedAt: 1 });

// INVARIANT VALIDATION
GenerationSchema.pre('save', function (next) {
  // Validate: succeeded status requires at least one version
  if (this.status === 'succeeded' && this.versions.length === 0) {
    return next(new Error('Succeeded generation must have at least one version'));
  }
  
  next();
});

// METHODS
GenerationSchema.methods.addVersion = function (versionData: Omit<IGenerationVersion, 'createdAt'>) {
  const nextVersionNum = this.versions.length + 1;
  const versionId = `v${nextVersionNum}`;
  
  this.versions.push({
    versionId,
    imagePath: versionData.imagePath,
    thumbPath: versionData.thumbPath,
    createdAt: new Date(),
  });
  
  return this.save();
};

GenerationSchema.methods.getLatestVersion = function (): IGenerationVersion | null {
  if (this.versions.length === 0) return null;
  return this.versions[this.versions.length - 1];
};

GenerationSchema.methods.getVersion = function (versionId: string): IGenerationVersion | null {
  return this.versions.find((v: IGenerationVersion) => v.versionId === versionId) || null;
};

GenerationSchema.methods.markFailed = function (errorCode: string, errorMessage: string) {
  this.status = 'failed';
  this.error = {
    code: errorCode,
    message: errorMessage,
  };
  return this.save();
};

GenerationSchema.methods.markSucceeded = function () {
  if (this.versions.length === 0) {
    throw new Error('Cannot mark as succeeded without versions');
  }
  this.status = 'succeeded';
  return this.save();
};

export const Generation = mongoose.model<IGeneration>('Generation', GenerationSchema);

