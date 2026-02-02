import { authClient, orderClient } from '../clients/serviceClients';

export const dashboardTypeDefs = `#graphql
  type DashboardStats {
    totalUsers: Int!
    totalOrders: Int!
    totalRevenue: Float!
    pendingOrders: Int!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type Query {
    dashboardStats: DashboardStats!
  }

  type Mutation {
    _empty: String
  }
`;

export const dashboardResolvers = {
  Query: {
    dashboardStats: async (_: any, __: any, context: any) => {
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};

        const [orderStatsRes, authRes] = await Promise.all([
          orderClient.get('/api/orders/admin-stats', { headers }),
          authClient
            .get('/api/auth/stats', { headers })
            .catch(() => ({ data: { data: { totalUsers: 0 } } })),
        ]);

        const orderStats = orderStatsRes.data.data || {};
        const totalUsers = authRes.data.data?.totalUsers || 0;

        return {
          totalUsers,
          totalOrders: orderStats.totalOrders || 0,
          totalRevenue: orderStats.totalRevenue || 0,
          pendingOrders: orderStats.pendingOrders || 0,
        };
      } catch (error) {
        return {
          totalUsers: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        };
      }
    },
  },
};
