import { Request, Response } from 'express';
import * as reviewController from '../../src/controllers/ReviewController';
import { Review } from '../../src/models/Review';
import Product from '../../src/models/Product';

// Mock models
jest.mock('../../src/models/Review');
jest.mock('../../src/models/Product');

// Mock Logger
jest.mock('@3asoftwares/utils/server', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ReviewController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getProductReviews', () => {
    it('should return paginated reviews for a product', async () => {
      mockRequest.params = { productId: 'prod123' };

      const mockReviews = [
        { _id: 'rev1', rating: 5, comment: 'Great product!' },
        { _id: 'rev2', rating: 4, comment: 'Good quality' },
      ];

      (Review.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockReviews),
            }),
          }),
        }),
      });
      (Review.countDocuments as jest.Mock).mockResolvedValue(2);

      await reviewController.getProductReviews(mockRequest as Request, mockResponse as Response);

      expect(Review.find).toHaveBeenCalledWith({ productId: 'prod123', isApproved: true });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            reviews: mockReviews,
            pagination: expect.objectContaining({
              total: 2,
            }),
          }),
        })
      );
    });

    it('should use custom pagination', async () => {
      mockRequest.params = { productId: 'prod123' };
      mockRequest.query = { page: '2', limit: '5' };

      (Review.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Review.countDocuments as jest.Mock).mockResolvedValue(10);

      await reviewController.getProductReviews(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 2,
              limit: 5,
            }),
          }),
        })
      );
    });

    it('should handle errors', async () => {
      mockRequest.params = { productId: 'prod123' };

      (Review.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      await reviewController.getProductReviews(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to get reviews',
        })
      );
    });
  });

  describe('createReview', () => {
    const validReviewData = {
      userId: 'user123',
      userName: 'Test User',
      rating: 5,
      comment: 'Excellent product!',
    };

    it('should create a review successfully', async () => {
      mockRequest.params = { productId: 'prod123' };
      mockRequest.body = validReviewData;

      (Product.findById as jest.Mock).mockResolvedValue({ _id: 'prod123', name: 'Test Product' });
      (Review.findOne as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(true);
      (Review as unknown as jest.Mock).mockImplementation(() => ({
        ...validReviewData,
        productId: 'prod123',
        save: mockSave,
      }));

      (Review.find as jest.Mock).mockResolvedValue([{ rating: 5 }, { rating: 4 }]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await reviewController.createReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Review submitted successfully',
        })
      );
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { productId: 'nonexistent' };
      mockRequest.body = validReviewData;

      (Product.findById as jest.Mock).mockResolvedValue(null);

      await reviewController.createReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Product not found',
        })
      );
    });

    it('should return 400 if user already reviewed product', async () => {
      mockRequest.params = { productId: 'prod123' };
      mockRequest.body = validReviewData;

      (Product.findById as jest.Mock).mockResolvedValue({ _id: 'prod123' });
      (Review.findOne as jest.Mock).mockResolvedValue({ _id: 'existingReview' });

      await reviewController.createReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You have already reviewed this product',
        })
      );
    });

    it('should handle duplicate key error', async () => {
      mockRequest.params = { productId: 'prod123' };
      mockRequest.body = validReviewData;

      (Product.findById as jest.Mock).mockResolvedValue({ _id: 'prod123' });
      (Review.findOne as jest.Mock).mockResolvedValue(null);

      const duplicateError = new Error('Duplicate key') as any;
      duplicateError.code = 11000;

      (Review as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(duplicateError),
      }));

      await reviewController.createReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You have already reviewed this product',
        })
      );
    });
  });

  describe('markReviewHelpful', () => {
    it('should mark review as helpful', async () => {
      mockRequest.params = { reviewId: 'rev123' };

      const updatedReview = {
        _id: 'rev123',
        helpful: 6,
      };

      (Review.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedReview);

      await reviewController.markReviewHelpful(mockRequest as Request, mockResponse as Response);

      expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
        'rev123',
        { $inc: { helpful: 1 } },
        { new: true }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Review marked as helpful',
        })
      );
    });

    it('should return 404 if review not found', async () => {
      mockRequest.params = { reviewId: 'nonexistent' };

      (Review.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await reviewController.markReviewHelpful(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Review not found',
        })
      );
    });

    it('should handle errors', async () => {
      mockRequest.params = { reviewId: 'rev123' };

      (Review.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

      await reviewController.markReviewHelpful(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      mockRequest.params = { reviewId: 'rev123' };
      mockRequest.body = { userId: 'user123' };

      const existingReview = {
        _id: 'rev123',
        userId: 'user123',
        productId: 'prod123',
      };

      (Review.findById as jest.Mock).mockResolvedValue(existingReview);
      (Review.findByIdAndDelete as jest.Mock).mockResolvedValue(existingReview);
      (Review.find as jest.Mock).mockResolvedValue([{ rating: 4 }]);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await reviewController.deleteReview(mockRequest as Request, mockResponse as Response);

      expect(Review.findByIdAndDelete).toHaveBeenCalledWith('rev123');
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Review deleted successfully',
        })
      );
    });

    it('should return 404 if review not found', async () => {
      mockRequest.params = { reviewId: 'nonexistent' };
      mockRequest.body = { userId: 'user123' };

      (Review.findById as jest.Mock).mockResolvedValue(null);

      await reviewController.deleteReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Review not found',
        })
      );
    });

    it('should return 403 if user does not own review', async () => {
      mockRequest.params = { reviewId: 'rev123' };
      mockRequest.body = { userId: 'differentUser' };

      const existingReview = {
        _id: 'rev123',
        userId: 'user123',
        productId: 'prod123',
      };

      (Review.findById as jest.Mock).mockResolvedValue(existingReview);

      await reviewController.deleteReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'You can only delete your own reviews',
        })
      );
    });

    it('should reset product rating when no reviews left', async () => {
      mockRequest.params = { reviewId: 'rev123' };
      mockRequest.body = { userId: 'user123' };

      const existingReview = {
        _id: 'rev123',
        userId: 'user123',
        productId: 'prod123',
      };

      (Review.findById as jest.Mock).mockResolvedValue(existingReview);
      (Review.findByIdAndDelete as jest.Mock).mockResolvedValue(existingReview);
      (Review.find as jest.Mock).mockResolvedValue([]); // No reviews left
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await reviewController.deleteReview(mockRequest as Request, mockResponse as Response);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith('prod123', {
        rating: 0,
        reviewCount: 0,
      });
    });

    it('should handle errors', async () => {
      mockRequest.params = { reviewId: 'rev123' };
      mockRequest.body = { userId: 'user123' };

      (Review.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await reviewController.deleteReview(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });
});
