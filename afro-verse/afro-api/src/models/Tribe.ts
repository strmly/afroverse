import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * Tribe Model - Social Graph Anchor
 * 
 * Purpose:
 * - Define cultural homes
 * - Drive feed partitioning
 * - Provide visual + identity metadata
 * 
 * Invariants:
 * - Tribe slugs are immutable
 * - stats.members is denormalized (updated on join/leave)
 * - Do NOT delete tribes in MVP (only deactivate later)
 */

export interface ITribe extends Document {
  _id: Types.ObjectId;
  
  slug: string;
  name: string;
  motto: string;
  
  accentColor: string;
  iconKey: string;
  
  stats: {
    members: number;
    posts: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const TribeSchema = new Schema<ITribe>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      immutable: true, // Slugs are immutable
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/, // URL-safe: lowercase letters, numbers, hyphens
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    motto: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    
    // Visual identity
    accentColor: {
      type: String,
      required: true,
      match: /^#[0-9A-Fa-f]{6}$/, // Hex color
    },
    iconKey: {
      type: String,
      required: true,
    },
    
    // DENORMALIZED STATS
    stats: {
      members: {
        type: Number,
        default: 0,
        min: 0,
      },
      posts: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// INDEXES
// Note: slug already has a unique index from schema definition

// METHODS
TribeSchema.methods.toPublicInfo = function () {
  return {
    id: this._id,
    slug: this.slug,
    name: this.name,
    motto: this.motto,
    accentColor: this.accentColor,
    iconKey: this.iconKey,
    stats: this.stats,
  };
};

export const Tribe = mongoose.model<ITribe>('Tribe', TribeSchema);



