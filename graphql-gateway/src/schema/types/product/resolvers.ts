import { productClient, authClient, addAuthHeader } from '../../../clients/serviceClients';
import { GraphQLError } from 'graphql';

const requireAuth = (context: any) => {
  if (!context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return addAuthHeader(context.token);
};

export const productResolvers = {
  Query: {
    // Public routes - no auth required for browsing products
    products: async (_: any, args: any) => {
      const {
        page,
        limit,
        search,
        category,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
        featured,
        includeInactive,
      } = args;

      const finalSortBy = featured ? 'reviewCount' : sortBy;
      const finalSortOrder = featured ? 'desc' : sortOrder;

      const response = await productClient.get('/api/products', {
        params: {
          page,
          limit,
          search,
          category,
          minPrice,
          maxPrice,
          sortBy: finalSortBy,
          sortOrder: finalSortOrder,
          featured,
          includeInactive: includeInactive || false,
        },
      });
      return response.data.data;
    },

    product: async (_: any, { id }: any) => {
      const response = await productClient.get(`/api/products/${id}`);
      return response.data.data;
    },

    productsBySeller: async (_: any, { sellerId }: any) => {
      const response = await productClient.get(`/api/products/seller/${sellerId}`);
      return response.data.data.products || [];
    },
  },

  Product: {
    id: (parent: any) => parent._id || parent.id,
    seller: async (parent: any) => {
      if (!parent.sellerId) return null;
      try {
        const response = await authClient.get(`/api/users/${parent.sellerId}`);
        const user = response.data.data?.user || response.data.user;
        if (user) {
          return {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
          };
        }
        return null;
      } catch (error) {
        // Return minimal seller info if user fetch fails
        return {
          id: parent.sellerId,
          name: 'Seller',
          email: null,
        };
      }
    },
  },

  Mutation: {
    createProduct: async (_: any, { input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await productClient.post('/api/products', input, authHeader);
      return response.data.data.product;
    },

    updateProduct: async (_: any, { id, input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await productClient.put(`/api/products/${id}`, input, authHeader);
      return response.data.data.product;
    },

    deleteProduct: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      await productClient.delete(`/api/products/${id}`, authHeader);
      return true;
    },
  },
};
