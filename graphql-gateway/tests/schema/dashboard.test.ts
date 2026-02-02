import { authClient, orderClient } from '../../src/clients/serviceClients';
import { dashboardResolvers } from '../../src/schema/dashboard';

// Mock the service clients
jest.mock('../../src/clients/serviceClients', () => ({
  authClient: {
    get: jest.fn(),
  },
  orderClient: {
    get: jest.fn(),
  },
  addAuthHeader: jest.fn((token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe('Dashboard Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.dashboardStats', () => {
    it('should return dashboard stats with valid token', async () => {
      const mockOrderStats = {
        data: {
          data: {
            totalOrders: 100,
            totalRevenue: 5000.50,
            pendingOrders: 15,
          },
        },
      };

      const mockAuthStats = {
        data: {
          data: {
            totalUsers: 250,
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrderStats);
      (authClient.get as jest.Mock).mockResolvedValue(mockAuthStats);

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContext
      );

      expect(result).toEqual({
        totalUsers: 250,
        totalOrders: 100,
        totalRevenue: 5000.50,
        pendingOrders: 15,
      });

      expect(orderClient.get).toHaveBeenCalledWith('/api/orders/admin-stats', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should return dashboard stats without token', async () => {
      const mockOrderStats = {
        data: {
          data: {
            totalOrders: 50,
            totalRevenue: 2000,
            pendingOrders: 5,
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrderStats);
      (authClient.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContextNoToken
      );

      expect(result).toEqual({
        totalUsers: 0,
        totalOrders: 50,
        totalRevenue: 2000,
        pendingOrders: 5,
      });
    });

    it('should return zeros when auth service fails', async () => {
      const mockOrderStats = {
        data: {
          data: {
            totalOrders: 100,
            totalRevenue: 5000,
            pendingOrders: 10,
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrderStats);
      (authClient.get as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContext
      );

      expect(result.totalUsers).toBe(0);
      expect(result.totalOrders).toBe(100);
    });

    it('should return all zeros when all services fail', async () => {
      (orderClient.get as jest.Mock).mockRejectedValue(new Error('Service unavailable'));
      (authClient.get as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContext
      );

      expect(result).toEqual({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    });

    it('should handle empty data from order service', async () => {
      const mockOrderStats = {
        data: {
          data: {},
        },
      };

      const mockAuthStats = {
        data: {
          data: {
            totalUsers: 100,
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrderStats);
      (authClient.get as jest.Mock).mockResolvedValue(mockAuthStats);

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContext
      );

      expect(result).toEqual({
        totalUsers: 100,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    });

    it('should handle null data from services', async () => {
      const mockOrderStats = {
        data: {
          data: null,
        },
      };

      const mockAuthStats = {
        data: {
          data: null,
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrderStats);
      (authClient.get as jest.Mock).mockResolvedValue(mockAuthStats);

      const result = await dashboardResolvers.Query.dashboardStats(
        null,
        {},
        mockContext
      );

      expect(result).toEqual({
        totalUsers: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
      });
    });
  });
});
