import { reviewResolvers } from '../../../src/schema/types/review';
import { productClient, authClient } from '../../../src/clients/serviceClients';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  productClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  authClient: {
    get: jest.fn(),
  },
}));

describe('Review Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.productReviews', () => {
    it('should return paginated reviews for product', async () => {
      const mockReviews = {
        data: {
          data: {
            reviews: [
              { _id: '1', rating: 5, comment: 'Great product!' },
              { _id: '2', rating: 4, comment: 'Good quality' },
            ],
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      };

      (productClient.get as jest.Mock).mockResolvedValue(mockReviews);

      const result = await reviewResolvers.Query.productReviews(
        null,
        { productId: 'product123', page: 1, limit: 10 }
      );

      expect(result).toEqual(mockReviews.data.data);
      expect(productClient.get).toHaveBeenCalledWith('/api/reviews/product123', {
        params: { page: 1, limit: 10 },
      });
    });

    it('should use default pagination values', async () => {
      (productClient.get as jest.Mock).mockResolvedValue({ data: { data: { reviews: [] } } });

      await reviewResolvers.Query.productReviews(null, { productId: 'product123' });

      expect(productClient.get).toHaveBeenCalledWith('/api/reviews/product123', {
        params: { page: 1, limit: 10 },
      });
    });

    it('should return empty reviews on error', async () => {
      (productClient.get as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const result = await reviewResolvers.Query.productReviews(
        null,
        { productId: 'product123' }
      );

      expect(result).toEqual({
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });
    });
  });

  describe('Review field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'review123' };
      expect(reviewResolvers.Review.id(parent)).toBe('review123');
    });

    it('should resolve id from id field', () => {
      const parent = { id: 'review456' };
      expect(reviewResolvers.Review.id(parent)).toBe('review456');
    });
  });

  describe('Mutation.createReview', () => {
    it('should create review successfully', async () => {
      const mockUser = {
        data: {
          data: {
            user: { _id: 'user123', name: 'Test User' },
          },
        },
      };

      const mockReviewResponse = {
        data: {
          success: true,
          message: 'Review created',
          data: { _id: 'review123', rating: 5, comment: 'Great!' },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);
      (productClient.post as jest.Mock).mockResolvedValue(mockReviewResponse);

      const result = await reviewResolvers.Mutation.createReview(
        null,
        { productId: 'product123', input: { rating: 5, comment: 'Great!' } },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.review).toBeDefined();
    });

    it('should return error when not authenticated', async () => {
      const result = await reviewResolvers.Mutation.createReview(
        null,
        { productId: 'product123', input: { rating: 5, comment: 'Great!' } },
        mockContextNoToken
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('You must be logged in to submit a review');
    });

    it('should return error when unable to get user', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await reviewResolvers.Mutation.createReview(
        null,
        { productId: 'product123', input: { rating: 5, comment: 'Great!' } },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unable to get user information');
    });

    it('should handle review creation failure', async () => {
      const mockUser = {
        data: {
          data: {
            user: { _id: 'user123', name: 'Test User' },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);
      (productClient.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Already reviewed' } },
      });

      const result = await reviewResolvers.Mutation.createReview(
        null,
        { productId: 'product123', input: { rating: 5, comment: 'Great!' } },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Already reviewed');
    });
  });

  describe('Mutation.markReviewHelpful', () => {
    it('should mark review as helpful', async () => {
      const mockReview = {
        data: {
          data: { _id: 'review123', helpful: 5 },
        },
      };

      (productClient.post as jest.Mock).mockResolvedValue(mockReview);

      const result = await reviewResolvers.Mutation.markReviewHelpful(
        null,
        { reviewId: 'review123' }
      );

      expect(result).toEqual(mockReview.data.data);
    });

    it('should throw error on failure', async () => {
      (productClient.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Review not found' } },
      });

      await expect(
        reviewResolvers.Mutation.markReviewHelpful(null, { reviewId: 'nonexistent' })
      ).rejects.toThrow('Review not found');
    });
  });

  describe('Mutation.deleteReview', () => {
    it('should delete review successfully', async () => {
      const mockUser = {
        data: {
          data: {
            user: { _id: 'user123', name: 'Test User' },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);
      (productClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await reviewResolvers.Mutation.deleteReview(
        null,
        { reviewId: 'review123' },
        mockContext
      );

      expect(result).toBe(true);
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        reviewResolvers.Mutation.deleteReview(
          null,
          { reviewId: 'review123' },
          mockContextNoToken
        )
      ).rejects.toThrow('You must be logged in to delete a review');
    });

    it('should throw error on deletion failure', async () => {
      const mockUser = {
        data: {
          data: {
            user: { _id: 'user123', name: 'Test User' },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);
      (productClient.delete as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Not authorized' } },
      });

      await expect(
        reviewResolvers.Mutation.deleteReview(
          null,
          { reviewId: 'review123' },
          mockContext
        )
      ).rejects.toThrow('Not authorized');
    });
  });
});
