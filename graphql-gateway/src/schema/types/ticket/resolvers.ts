import { ticketClient, addAuthHeader } from '../../../clients/serviceClients';
import { GraphQLError } from 'graphql';

const requireAuth = (context: any) => {
  if (!context.token) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return addAuthHeader(context.token);
};

export const ticketResolvers = {
  Query: {
    tickets: async (_: any, args: any, context: any) => {
      const authHeader = requireAuth(context);
      const { page = 1, limit = 10, status, priority, category, customerId, search } = args;

      const params: any = { page, limit };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (customerId) params.customerId = customerId;
      if (search) params.search = search;

      const response = await ticketClient.get('/api/tickets', {
        params,
        ...authHeader,
      });

      return {
        tickets: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    },

    ticket: async (_: any, { id }: any, context: any) => {
      const authHeader = requireAuth(context);
      const response = await ticketClient.get(`/api/tickets/${id}`, authHeader);
      return response.data.data;
    },

    myTickets: async (_: any, args: any, context: any) => {
      const authHeader = requireAuth(context);
      const { page = 1, limit = 10 } = args;

      // Get user info from context
      const customerId = context.user?.id;
      if (!customerId) {
        throw new GraphQLError('User ID not found in token', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const response = await ticketClient.get('/api/tickets', {
        params: { page, limit, customerId },
        ...authHeader,
      });

      return {
        tickets: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    },
  },

  Ticket: {
    id: (parent: any) => parent._id || parent.id,
    status: (parent: any) => {
      // Convert 'in-progress' to 'in_progress' for GraphQL enum compatibility
      const status = parent.status || 'open';
      return status.replace('-', '_');
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
    resolvedAt: (parent: any) => {
      if (parent.resolvedAt) {
        return new Date(parent.resolvedAt).toISOString();
      }
      return null;
    },
    closedAt: (parent: any) => {
      if (parent.closedAt) {
        return new Date(parent.closedAt).toISOString();
      }
      return null;
    },
  },

  Mutation: {
    createTicket: async (_: any, { input }: any, context: any) => {
      const authHeader = requireAuth(context);

      // Add customerId from context if not provided
      const ticketData = {
        ...input,
        customerId: input.customerId || context.user?.id,
      };

      const response = await ticketClient.post('/api/tickets', ticketData, authHeader);
      return response.data.data;
    },

    addTicketComment: async (_: any, { input }: any, context: any) => {
      const authHeader = requireAuth(context);
      const { ticketId, message, isInternal = false } = input;

      const commentData = {
        userId: context.user?.id,
        userName: context.user?.name || 'Customer',
        userRole: context.user?.role || 'customer',
        message,
        isInternal,
      };

      const response = await ticketClient.post(
        `/api/tickets/${ticketId}/comments`,
        commentData,
        authHeader
      );
      return response.data.data;
    },
  },
};
