import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Logger } from '@3asoftwares/utils/server';
import Product from '../models/Product';

// Get reviews for a product
export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    Logger.debug('Fetching product reviews', { productId, page, limit }, 'ReviewController');

    const [reviews, total] = await Promise.all([
      Review.find({ productId, isApproved: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId, isApproved: true }),
    ]);

    Logger.info(`Fetched ${reviews.length} reviews`, { productId, total }, 'ReviewController');

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get product reviews', error, 'ReviewController');
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
      error: error.message,
    });
  }
};

// Create a new review
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { userId, userName, rating, comment } = req.body;

    Logger.info('Creating new review', { productId, userId, rating }, 'ReviewController');

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      Logger.warn('Review creation failed - product not found', { productId }, 'ReviewController');
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      Logger.warn('Review creation failed - user already reviewed', { productId, userId }, 'ReviewController');
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
      return;
    }

    // Create the review
    const review = new Review({
      productId,
      userId,
      userName,
      rating,
      comment,
    });

    await review.save();

    Logger.debug('Review saved, updating product rating', { productId, reviewId: review._id }, 'ReviewController');

    // Update product rating
    const allReviews = await Review.find({ productId, isApproved: true });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    Logger.info('Review created successfully', { reviewId: review._id, productId, rating }, 'ReviewController');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error: any) {
    Logger.error('Failed to create review', error, 'ReviewController');

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message,
    });
  }
};

// Mark review as helpful
export const markReviewHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;

    Logger.debug('Marking review as helpful', { reviewId }, 'ReviewController');

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!review) {
      Logger.warn('Review not found for helpful mark', { reviewId }, 'ReviewController');
      res.status(404).json({
        success: false,
        message: 'Review not found',
      });
      return;
    }

    Logger.debug('Review marked as helpful', { reviewId, helpfulCount: review.helpful }, 'ReviewController');

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: review,
    });
  } catch (error: any) {
    Logger.error('Failed to mark review as helpful', error, 'ReviewController');
    res.status(500).json({
      success: false,
      message: 'Failed to mark review as helpful',
      error: error.message,
    });
  }
};

// Delete a review (by user or admin)
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.body;

    Logger.info('Deleting review', { reviewId, userId }, 'ReviewController');

    const review = await Review.findById(reviewId);

    if (!review) {
      Logger.warn('Review not found for deletion', { reviewId }, 'ReviewController');
      res.status(404).json({
        success: false,
        message: 'Review not found',
      });
      return;
    }

    // Check if user owns the review
    if (review.userId !== userId) {
      Logger.warn('Unauthorized review deletion attempt', { reviewId, userId, ownerId: review.userId }, 'ReviewController');
      res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
      return;
    }

    await Review.findByIdAndDelete(reviewId);

    Logger.debug('Review deleted, updating product rating', { reviewId, productId: review.productId }, 'ReviewController');

    // Update product rating
    const productId = review.productId;
    const allReviews = await Review.find({ productId, isApproved: true });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length,
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0,
      });
    }

    Logger.info('Review deleted successfully', { reviewId, productId }, 'ReviewController');

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to delete review', error, 'ReviewController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message,
    });
  }
};
