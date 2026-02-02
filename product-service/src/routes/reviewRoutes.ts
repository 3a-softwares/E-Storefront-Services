import express from 'express';
import * as reviewController from '../controllers/ReviewController';

const router = express.Router();

// GET /api/reviews/:productId - Get reviews for a product
router.get('/:productId', reviewController.getProductReviews);

// POST /api/reviews/:productId - Create a review for a product
router.post('/:productId', reviewController.createReview);

// POST /api/reviews/:reviewId/helpful - Mark review as helpful
router.post('/:reviewId/helpful', reviewController.markReviewHelpful);

// DELETE /api/reviews/:reviewId - Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
