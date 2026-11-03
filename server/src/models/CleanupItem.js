import mongoose from 'mongoose';

export const TYPES = ['account', 'file', 'subscription'];
export const CATEGORIES = ['Work', 'Personal', 'Finance', 'Entertainment', 'Cloud Storage', 'Other'];
export const STATUSES = ['active', 'archived', 'deleted'];

const DAY_MS = 24 * 60 * 60 * 1000;

const isEmptyOrUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const cleanupItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: { values: TYPES, message: 'Type must be one of: account, file, subscription' },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: `Category must be one of: ${CATEGORIES.join(', ')}` },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: { values: STATUSES, message: 'Status must be one of: active, archived, deleted' },
      default: 'active',
    },
    reviewIntervalDays: {
      type: Number,
      required: [true, 'Review interval is required'],
      min: [1, 'Review interval must be at least 1 day'],
      max: [730, 'Review interval cannot exceed 730 days'],
      default: 30,
      validate: { validator: Number.isInteger, message: 'Review interval must be a whole number' },
    },
    lastReviewedAt: { type: Date, default: Date.now },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    link: {
      type: String,
      trim: true,
      default: '',
      validate: { validator: isEmptyOrUrl, message: 'Link must be a valid URL (http or https)' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Whole days since the item was last reviewed.
cleanupItemSchema.virtual('daysSinceReview').get(function () {
  if (!this.lastReviewedAt) return null;
  return Math.max(0, Math.floor((Date.now() - this.lastReviewedAt.getTime()) / DAY_MS));
});

// The date the item's own review interval runs out.
cleanupItemSchema.virtual('nextReviewAt').get(function () {
  if (!this.lastReviewedAt) return null;
  return new Date(this.lastReviewedAt.getTime() + this.reviewIntervalDays * DAY_MS);
});

// True once the item's personal review interval has passed.
cleanupItemSchema.virtual('isOverdue').get(function () {
  const next = this.nextReviewAt;
  return next ? next.getTime() < Date.now() : false;
});

// Indexes for fast stale queries: { status, lastReviewedAt }.
cleanupItemSchema.index({ lastReviewedAt: 1 });
cleanupItemSchema.index({ status: 1, lastReviewedAt: 1 });

const CleanupItem = mongoose.model('CleanupItem', cleanupItemSchema);

export default CleanupItem;
