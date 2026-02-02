import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  helpful: number;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 2000,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true, // Auto-approve for now
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index for fetching reviews by product
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
