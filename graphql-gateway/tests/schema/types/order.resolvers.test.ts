import { orderResolvers } from '../../../src/schema/types/order/resolvers';
import { orderClient } from '../../../src/clients/serviceClients';
import { GraphQLError } from 'graphql';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  orderClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  addAuthHeader: jest.fn((token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe('Order Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.orders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = {
        data: {
          data: {
            orders: [
              { _id: '1', total: 100, orderStatus: 'pending' },
              { _id: '2', total: 200, orderStatus: 'confirmed' },
            ],
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrders);

      const result = await orderResolvers.Query.orders(
        null,
        { page: 1, limit: 10 },
        mockContext
      );

      expect(result).toEqual(mockOrders.data.data);
    });

    it('should filter orders by customerId', async () => {
      (orderClient.get as jest.Mock).mockResolvedValue({ data: { data: { orders: [] } } });

      await orderResolvers.Query.orders(
        null,
        { customerId: 'customer123' },
        mockContext
      );

      expect(orderClient.get).toHaveBeenCalledWith('/api/orders', {
        params: expect.objectContaining({ customerId: 'customer123' }),
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        orderResolvers.Query.orders(null, {}, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Query.order', () => {
    it('should return order by ID', async () => {
      const mockOrder = {
        data: {
          data: { order: { _id: '1', total: 100, orderStatus: 'pending' } },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Query.order(null, { id: '1' }, mockContext);

      expect(result).toEqual(mockOrder.data.data.order);
    });

    it('should return order from data directly', async () => {
      const mockOrder = {
        data: {
          data: { _id: '1', total: 100, orderStatus: 'pending' },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Query.order(null, { id: '1' }, mockContext);

      expect(result).toEqual(mockOrder.data.data);
    });
  });

  describe('Query.ordersByCustomer', () => {
    it('should return orders for customer', async () => {
      const mockOrders = {
        data: {
          data: {
            orders: [{ _id: '1', customerId: 'customer123' }],
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockOrders);

      const result = await orderResolvers.Query.ordersByCustomer(
        null,
        { customerId: 'customer123' },
        mockContext
      );

      expect(result).toEqual(mockOrders.data.data.orders);
    });

    it('should return empty array when no orders', async () => {
      (orderClient.get as jest.Mock).mockResolvedValue({ data: { data: {} } });

      const result = await orderResolvers.Query.ordersByCustomer(
        null,
        { customerId: 'customer123' },
        mockContext
      );

      expect(result).toEqual([]);
    });
  });

  describe('Query.sellerStats', () => {
    it('should return seller statistics', async () => {
      const mockStats = {
        data: {
          data: {
            totalOrders: 50,
            totalRevenue: 5000,
            pendingOrders: 10,
          },
        },
      };

      (orderClient.get as jest.Mock).mockResolvedValue(mockStats);

      const result = await orderResolvers.Query.sellerStats(
        null,
        { sellerId: 'seller123' },
        mockContext
      );

      expect(result).toEqual(mockStats.data.data);
    });
  });

  describe('Order field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'order123' };
      expect(orderResolvers.Order.id(parent)).toBe('order123');
    });

    it('should resolve orderNumber', () => {
      const parent = { orderNumber: 'ORD-001' };
      expect(orderResolvers.Order.orderNumber(parent)).toBe('ORD-001');
    });

    it('should return null for missing orderNumber', () => {
      const parent = {};
      expect(orderResolvers.Order.orderNumber(parent)).toBeNull();
    });

    it('should resolve orderStatus to uppercase', () => {
      const parent = { orderStatus: 'pending' };
      expect(orderResolvers.Order.orderStatus(parent)).toBe('PENDING');
    });

    it('should use status field as fallback', () => {
      const parent = { status: 'confirmed' };
      expect(orderResolvers.Order.orderStatus(parent)).toBe('CONFIRMED');
    });

    it('should default to PENDING for missing status', () => {
      const parent = {};
      expect(orderResolvers.Order.orderStatus(parent)).toBe('PENDING');
    });

    it('should resolve paymentStatus to uppercase', () => {
      const parent = { paymentStatus: 'completed' };
      expect(orderResolvers.Order.paymentStatus(parent)).toBe('COMPLETED');
    });

    it('should resolve createdAt to ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const parent = { createdAt: date };
      expect(orderResolvers.Order.createdAt(parent)).toBe(date.toISOString());
    });

    it('should return null for missing createdAt', () => {
      const parent = {};
      expect(orderResolvers.Order.createdAt(parent)).toBeNull();
    });

    it('should resolve updatedAt to ISO string', () => {
      const date = new Date('2024-01-02T00:00:00.000Z');
      const parent = { updatedAt: date };
      expect(orderResolvers.Order.updatedAt(parent)).toBe(date.toISOString());
    });
  });

  describe('Mutation.createOrder', () => {
    it('should create order with single order response', async () => {
      const input = { items: [{ productId: 'p1', quantity: 2 }] };
      const mockOrder = {
        data: {
          data: {
            order: { _id: 'order123', total: 200 },
            orderCount: 1,
          },
        },
      };

      (orderClient.post as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Mutation.createOrder(
        null,
        { input },
        mockContext
      );

      expect(result.order).toEqual({ _id: 'order123', total: 200 });
      expect(result.orderCount).toBe(1);
    });

    it('should create order with multiple orders response', async () => {
      const input = { items: [{ productId: 'p1' }, { productId: 'p2' }] };
      const mockOrder = {
        data: {
          data: {
            orders: [
              { _id: 'order1', total: 100 },
              { _id: 'order2', total: 200 },
            ],
            orderCount: 2,
          },
        },
      };

      (orderClient.post as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Mutation.createOrder(
        null,
        { input },
        mockContext
      );

      expect(result.orders).toHaveLength(2);
      expect(result.orderCount).toBe(2);
    });
  });

  describe('Mutation.updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockOrder = {
        data: {
          data: { order: { _id: 'order123', orderStatus: 'SHIPPED' } },
        },
      };

      (orderClient.patch as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Mutation.updateOrderStatus(
        null,
        { id: 'order123', status: 'shipped' },
        mockContext
      );

      expect(result).toEqual(mockOrder.data.data.order);
      expect(orderClient.patch).toHaveBeenCalledWith(
        '/api/orders/order123/status',
        { orderStatus: 'SHIPPED' },
        expect.any(Object)
      );
    });
  });

  describe('Mutation.updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const mockOrder = {
        data: {
          data: { order: { _id: 'order123', paymentStatus: 'COMPLETED' } },
        },
      };

      (orderClient.patch as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Mutation.updatePaymentStatus(
        null,
        { id: 'order123', status: 'completed' },
        mockContext
      );

      expect(result).toEqual(mockOrder.data.data.order);
    });
  });

  describe('Mutation.cancelOrder', () => {
    it('should cancel order', async () => {
      const mockOrder = {
        data: {
          data: { order: { _id: 'order123', orderStatus: 'CANCELLED' } },
        },
      };

      (orderClient.post as jest.Mock).mockResolvedValue(mockOrder);

      const result = await orderResolvers.Mutation.cancelOrder(
        null,
        { id: 'order123' },
        mockContext
      );

      expect(result).toEqual(mockOrder.data.data.order);
    });
  });
});
