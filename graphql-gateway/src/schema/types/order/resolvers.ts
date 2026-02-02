import { orderClient, addAuthHeader } from '../../../clients/serviceClients';
import { GraphQLError } from 'graphql';

const requireAuth = (context: any) => {
  if (!context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return addAuthHeader(context.token);
};

export const orderResolvers = {
  Query: {
    orders: async (_: any, args: any, context: any) => {
      const authHeader = requireAuth(context);
      const { page, limit, customerId } = args;
      const response = await orderClient.get('/api/orders', {
        params: { page, limit, customerId },
        ...authHeader,
      });
      return response.data.data;
    },

    order: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.get(`/api/orders/${id}`, authHeader);
      return response.data.data.order || response.data.data;
    },

    ordersByCustomer: async (_: any, { customerId }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.get(`/api/orders/customer/${customerId}`, authHeader);
      return response.data.data.orders || [];
    },

    sellerStats: async (_: any, { sellerId }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.get(`/api/orders/seller-stats/${sellerId}`, authHeader);
      return response.data.data;
    },
  },

  Order: {
    id: (parent: any) => parent._id || parent.id,
    orderNumber: (parent: any) => parent.orderNumber || null,
    orderStatus: (parent: any) => (parent.orderStatus || parent.status || 'pending').toUpperCase(),
    paymentStatus: (parent: any) => (parent.paymentStatus || 'pending').toUpperCase(),
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
    createOrder: async (_: any, { input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.post('/api/orders', input, authHeader);
      const data = response.data.data;
      return {
        order: data.order || data.orders?.[0] || null,
        orders: data.orders || [data.order],
        orderCount: data.orderCount || 1,
      };
    },

    updateOrderStatus: async (_: any, { id, status }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.patch(
        `/api/orders/${id}/status`,
        {
          orderStatus: status.toUpperCase(),
        },
        authHeader
      );
      return response.data.data.order;
    },

    updatePaymentStatus: async (_: any, { id, status }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.patch(
        `/api/orders/${id}/payment`,
        {
          paymentStatus: status.toUpperCase(),
        },
        authHeader
      );
      return response.data.data.order;
    },

    cancelOrder: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await orderClient.post(`/api/orders/${id}/cancel`, {}, authHeader);
      return response.data.data.order;
    },
  },
};
