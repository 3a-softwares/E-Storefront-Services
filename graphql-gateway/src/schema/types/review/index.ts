import { productClient, authClient } from '../../../clients/serviceClients';

export const reviewTypeDefs = `#graphql
  type Review {
    id: ID!
    productId: ID!
    userId: String!
    userName: String!
    rating: Int!
    comment: String!
    helpful: Int!
    isApproved: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type ReviewConnection {
    reviews: [Review!]!
    pagination: Pagination!
  }

  input CreateReviewInput {
    rating: Int!
    comment: String!
  }

  type CreateReviewResponse {
    success: Boolean!
    message: String!
    review: Review
  }

  extend type Query {
    productReviews(productId: ID!, page: Int, limit: Int): ReviewConnection!
  }

  extend type Mutation {
    createReview(productId: ID!, input: CreateReviewInput!): CreateReviewResponse!
    markReviewHelpful(reviewId: ID!): Review
    deleteReview(reviewId: ID!): Boolean!
  }
`;

export const reviewResolvers = {
  Query: {
    productReviews: async (_: any, { productId, page = 1, limit = 10 }: any) => {
      try {
        const response = await productClient.get(`/api/reviews/${productId}`, {
          params: { page, limit },
        });
        return response.data.data;
      } catch (error: any) {
        // Logger not available in gateway - silently handle errors
        return {
          reviews: [],
          pagination: { page, limit, total: 0, pages: 0 },
        };
      }
    },
  },

  Review: {
    id: (parent: any) => parent._id || parent.id,
  },

  Mutation: {
    createReview: async (_: any, { productId, input }: any, context: any) => {
      if (!context.token) {
        return {
          success: false,
          message: 'You must be logged in to submit a review',
          review: null,
        };
      }

      try {
        // Get current user info
        const meResponse = await authClient.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${context.token}` },
        });

        const user = meResponse.data.data?.user || meResponse.data.user;

        if (!user) {
          return {
            success: false,
            message: 'Unable to get user information',
            review: null,
          };
        }

        const response = await productClient.post(`/api/reviews/${productId}`, {
          userId: user.id || user._id,
          userName: user.name,
          rating: input.rating,
          comment: input.comment,
        });

        return {
          success: response.data.success,
          message: response.data.message,
          review: response.data.data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to submit review',
          review: null,
        };
      }
    },

    markReviewHelpful: async (_: any, { reviewId }: any) => {
      try {
        const response = await productClient.post(`/api/reviews/${reviewId}/helpful`);
        return response.data.data;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to mark review as helpful');
      }
    },

    deleteReview: async (_: any, { reviewId }: any, context: any) => {
      if (!context.token) {
        throw new Error('You must be logged in to delete a review');
      }

      try {
        // Get current user info
        const meResponse = await authClient.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${context.token}` },
        });

        const user = meResponse.data.data?.user || meResponse.data.user;

        await productClient.delete(`/api/reviews/${reviewId}`, {
          data: { userId: user.id || user._id },
        });

        return true;
      } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete review');
      }
    },
  },
};
