import { authClient, addAuthHeader } from '../../../clients/serviceClients';

export const addressResolvers = {
  Query: {
    myAddresses: async (_: any, __: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.get('/api/addresses', { headers: authHeader.headers });

      const addresses = response.data.data?.addresses || [];
      return {
        addresses: addresses.map((addr: any) => ({
          id: addr._id || addr.id,
          userId: addr.userId,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          isDefault: addr.isDefault || false,
          label: addr.label,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        })),
      };
    },
  },

  Mutation: {
    addAddress: async (_: any, { input }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.post('/api/addresses', input, {
        headers: authHeader.headers,
      });

      const addr = response.data.data?.address;
      return {
        success: response.data.success,
        message: response.data.message,
        address: addr
          ? {
              id: addr._id || addr.id,
              userId: addr.userId,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              isDefault: addr.isDefault || false,
              label: addr.label,
              createdAt: addr.createdAt,
              updatedAt: addr.updatedAt,
            }
          : null,
      };
    },

    updateAddress: async (_: any, { id, input }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.put(`/api/addresses/${id}`, input, {
        headers: authHeader.headers,
      });

      const addr = response.data.data?.address;
      return {
        success: response.data.success,
        message: response.data.message,
        address: addr
          ? {
              id: addr._id || addr.id,
              userId: addr.userId,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              isDefault: addr.isDefault || false,
              label: addr.label,
              createdAt: addr.createdAt,
              updatedAt: addr.updatedAt,
            }
          : null,
      };
    },

    deleteAddress: async (_: any, { id }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.delete(`/api/addresses/${id}`, {
        headers: authHeader.headers,
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    },

    setDefaultAddress: async (_: any, { id }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.patch(
        `/api/addresses/${id}/default`,
        {},
        { headers: authHeader.headers }
      );

      const addr = response.data.data?.address;
      return {
        success: response.data.success,
        message: response.data.message,
        address: addr
          ? {
              id: addr._id || addr.id,
              userId: addr.userId,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              zip: addr.zip,
              country: addr.country,
              isDefault: addr.isDefault || false,
              label: addr.label,
              createdAt: addr.createdAt,
              updatedAt: addr.updatedAt,
            }
          : null,
      };
    },
  },
};
