import { couponClient, addAuthHeader } from '../../../clients/serviceClients';
import { GraphQLError } from 'graphql';

const requireAuth = (context: any) => {
  if (!context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return addAuthHeader(context.token);
};

export const couponResolvers = {
  Query: {
    // Admin only - list all coupons
    coupons: async (_: any, args: any, context: any) => {
      const authHeader = requireAuth(context);
      const { page, limit, search, isActive } = args;
      const response = await couponClient.get('/api/coupons', {
        params: { page, limit, search, isActive },
        ...authHeader,
      });
      return response.data.data;
    },

    // Admin only - get coupon by ID
    coupon: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await couponClient.get(`/api/coupons/${id}`, authHeader);
      return response.data.data;
    },

    // Public - validate coupon for checkout
    validateCoupon: async (_: any, { code, orderTotal }: { code: string; orderTotal: number }) => {
      try {
        const response = await couponClient.post('/api/coupons/validate', { code, orderTotal });
        const data = response.data.data || response.data;
        return {
          valid: data?.valid ?? true,
          discount: data?.discount ?? 0,
          discountValue: data?.coupon?.discount ?? 0,
          finalTotal: data?.finalTotal ?? orderTotal - (data?.discount ?? 0),
          discountType: data?.coupon?.discountType ?? null,
          message: data?.message ?? 'Coupon applied successfully',
          code: code,
        };
      } catch (error: any) {
        return {
          valid: false,
          discount: 0,
          discountValue: 0,
          finalTotal: orderTotal,
          discountType: null,
          message: error.response?.data?.message || 'Invalid coupon code',
          code: code,
        };
      }
    },
  },

  Coupon: {
    id: (parent: any) => parent._id || parent.id,
    usageCount: (parent: any) => parent.usageCount || 0,
    validFrom: (parent: any) => {
      if (parent.validFrom) {
        return new Date(parent.validFrom).toISOString();
      }
      return new Date().toISOString();
    },
    validTo: (parent: any) => {
      if (parent.validTo) {
        return new Date(parent.validTo).toISOString();
      }
      return new Date().toISOString();
    },
    createdAt: (parent: any) => {
      if (parent.createdAt) {
        return new Date(parent.createdAt).toISOString();
      }
      return null;
    },
    updatedAt: (parent: any) => {
      if (parent.updatedAt) {
        return new Date(parent.updatedAt).toISOString();
      }
      return null;
    },
  },

  Mutation: {
    createCoupon: async (_: any, { input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await couponClient.post('/api/coupons', input, authHeader);
      return response.data.data;
    },

    updateCoupon: async (_: any, { id, input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await couponClient.put(`/api/coupons/${id}`, input, authHeader);
      return response.data.data;
    },

    deleteCoupon: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      await couponClient.delete(`/api/coupons/${id}`, authHeader);
      return true;
    },
  },
};
