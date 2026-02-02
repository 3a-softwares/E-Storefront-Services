import { Request, Response } from 'express';
import * as orderController from '../../src/controllers/OrderController';
import Order from '../../src/models/Order';
import { OrderStatus, PaymentStatus } from '@3asoftwares/types';

// Mock the Order model
jest.mock('../../src/models/Order');

describe('OrderController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('getAllOrders', () => {
    it('should return paginated orders', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      const mockOrders = [
        { _id: 'order1', orderNumber: 'ORD-001', total: 100 },
        { _id: 'order2', orderNumber: 'ORD-002', total: 200 },
      ];

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      (Order.countDocuments as jest.Mock).mockResolvedValue(2);

      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: mockOrders,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter by customerId', async () => {
      mockRequest.query = { customerId: 'customer123' };

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Order.countDocuments as jest.Mock).mockResolvedValue(0);

      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);

      expect(Order.find).toHaveBeenCalledWith({ customerId: 'customer123' });
    });

    it('should use default pagination values', async () => {
      mockRequest.query = {};

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Order.countDocuments as jest.Mock).mockResolvedValue(0);

      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 1,
              limit: 20,
            }),
          }),
        })
      );
    });

    it('should handle errors', async () => {
      (Order.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getAllOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get orders',
        error: 'Database error',
      });
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      mockRequest.params = { customerId: 'customer123' };
      mockRequest.query = { page: '1', limit: '10' };

      const mockOrders = [{ _id: 'order1', customerId: 'customer123' }];

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      (Order.countDocuments as jest.Mock).mockResolvedValue(1);

      await orderController.getOrdersByCustomer(mockRequest as Request, mockResponse as Response);

      expect(Order.find).toHaveBeenCalledWith({ customerId: 'customer123' });
      expect(responseStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('getOrderById', () => {
    it('should return order by ID', async () => {
      mockRequest.params = { id: 'order123' };

      const mockOrder = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        total: 100,
      };

      (Order.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOrder),
      });

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: { order: mockOrder },
      });
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Order.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });
  });

  describe('createOrder', () => {
    const validOrderData = {
      customerId: 'customer123',
      customerEmail: 'customer@example.com',
      items: [
        {
          productId: 'product1',
          productName: 'Test Product',
          quantity: 2,
          price: 50,
          subtotal: 100,
        },
      ],
      subtotal: 100,
      tax: 10,
      shipping: 5,
      discount: 0,
      total: 115,
      paymentMethod: 'credit_card',
      shippingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      },
    };

    it('should create a new order', async () => {
      mockRequest.body = validOrderData;

      const mockSavedOrder = {
        ...validOrderData,
        _id: 'order123',
        orderNumber: 'ORD-123',
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.countDocuments as jest.Mock).mockResolvedValue(0);
      (Order as unknown as jest.Mock).mockImplementation(() => mockSavedOrder);

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Order'),
        })
      );
    });

    it('should create multiple orders for multiple sellers', async () => {
      mockRequest.body = {
        ...validOrderData,
        items: [
          { ...validOrderData.items[0], sellerId: 'seller1' },
          { ...validOrderData.items[0], sellerId: 'seller2', subtotal: 100 },
        ],
        subtotal: 200,
        total: 220,
      };

      const mockSavedOrder = {
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.countDocuments as jest.Mock).mockResolvedValue(0);
      (Order as unknown as jest.Mock).mockImplementation(() => mockSavedOrder);

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
    });

    it('should handle errors during order creation', async () => {
      mockRequest.body = validOrderData;

      (Order.countDocuments as jest.Mock).mockRejectedValue(new Error('Database error'));

      await orderController.createOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create order',
        error: 'Database error',
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      mockRequest.params = { id: 'order123' };
      mockRequest.body = { orderStatus: OrderStatus.PROCESSING };

      const mockUpdatedOrder = {
        _id: 'order123',
        orderStatus: OrderStatus.PROCESSING,
      };

      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(Order.findByIdAndUpdate).toHaveBeenCalledWith(
        'order123',
        expect.objectContaining({ orderStatus: OrderStatus.PROCESSING }),
        expect.objectContaining({ new: true })
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { orderStatus: OrderStatus.PROCESSING };

      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      mockRequest.params = { id: 'order123' };
      mockRequest.body = { paymentStatus: PaymentStatus.COMPLETED };

      const mockUpdatedOrder = {
        _id: 'order123',
        paymentStatus: PaymentStatus.COMPLETED,
      };

      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      await orderController.updatePaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { paymentStatus: PaymentStatus.COMPLETED };

      (Order.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await orderController.updatePaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: 'order123' };
      mockRequest.body = { paymentStatus: PaymentStatus.COMPLETED };

      (Order.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

      await orderController.updatePaymentStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update payment status',
        error: 'Database error',
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel a pending order', async () => {
      mockRequest.params = { id: 'order123' };

      const mockOrder = {
        _id: 'order123',
        orderStatus: OrderStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrder.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(mockOrder.save).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Order cancelled successfully',
        })
      );
    });

    it('should cancel a confirmed order', async () => {
      mockRequest.params = { id: 'order123' };

      const mockOrder = {
        _id: 'order123',
        orderStatus: OrderStatus.CONFIRMED,
        save: jest.fn().mockResolvedValue(true),
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(mockOrder.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 if order not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Order.findById as jest.Mock).mockResolvedValue(null);

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Order not found',
      });
    });

    it('should return 400 if order is already cancelled', async () => {
      mockRequest.params = { id: 'order123' };

      const mockOrder = {
        _id: 'order123',
        orderStatus: OrderStatus.CANCELLED,
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot cancel order with status: cancelled',
      });
    });

    it('should return 400 if order cannot be cancelled (shipped)', async () => {
      mockRequest.params = { id: 'order123' };

      const mockOrder = {
        _id: 'order123',
        orderStatus: OrderStatus.SHIPPED,
      };

      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: `Cannot cancel order with status: ${OrderStatus.SHIPPED}`,
      });
    });

    it('should handle errors', async () => {
      mockRequest.params = { id: 'order123' };

      (Order.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await orderController.cancelOrder(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to cancel order',
        error: 'Database error',
      });
    });
  });

  describe('getSellerOrders', () => {
    it('should return seller orders with pagination', async () => {
      mockRequest.params = { sellerId: 'seller123' };
      mockRequest.query = { page: '1', limit: '10' };

      const mockOrders = [
        {
          _id: 'order1',
          items: [
            { productId: 'prod1', sellerId: 'seller123', subtotal: 100 },
            { productId: 'prod2', sellerId: 'seller456', subtotal: 50 },
          ],
        },
      ];

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      });
      (Order.countDocuments as jest.Mock).mockResolvedValue(1);

      await orderController.getSellerOrders(mockRequest as Request, mockResponse as Response);

      expect(Order.find).toHaveBeenCalledWith({ 'items.sellerId': 'seller123' });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: expect.any(Array),
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
            }),
          }),
        })
      );
    });

    it('should handle errors', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      (Order.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getSellerOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get seller orders',
        error: 'Database error',
      });
    });
  });

  describe('getSellerStats', () => {
    it('should return seller statistics', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      const mockOrders = [
        {
          _id: 'order1',
          orderStatus: OrderStatus.DELIVERED,
          total: 100,
          items: [{ sellerId: 'seller123', subtotal: 100 }],
        },
        {
          _id: 'order2',
          orderStatus: OrderStatus.PENDING,
          total: 200,
          items: [{ sellerId: 'seller123', subtotal: 200 }],
        },
        {
          _id: 'order3',
          orderStatus: OrderStatus.PROCESSING,
          total: 150,
          items: [{ sellerId: 'seller123', subtotal: 150 }],
        },
      ];

      (Order.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockOrders),
      });

      await orderController.getSellerStats(mockRequest as Request, mockResponse as Response);

      expect(Order.find).toHaveBeenCalledWith({ 'items.sellerId': 'seller123' });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalRevenue: 450,
            totalOrders: 3,
            pendingOrders: 1,
            completedOrders: 1,
            processingOrders: 1,
          }),
        })
      );
    });

    it('should return zero stats when no orders exist', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      (Order.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await orderController.getSellerStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalRevenue: 0,
            totalOrders: 0,
            completionRate: 0,
            avgOrderValue: 0,
          }),
        })
      );
    });

    it('should handle errors', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      (Order.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getSellerStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get seller stats',
        error: 'Database error',
      });
    });
  });

  describe('getSellerEarnings', () => {
    it('should return seller earnings with monthly breakdown', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      const mockOrders = [
        {
          _id: 'order1',
          total: 100,
          createdAt: new Date('2024-01-15'),
          items: [{ sellerId: 'seller123', subtotal: 100 }],
        },
        {
          _id: 'order2',
          total: 200,
          createdAt: new Date('2024-01-20'),
          items: [{ sellerId: 'seller123', subtotal: 200 }],
        },
        {
          _id: 'order3',
          total: 150,
          createdAt: new Date('2024-02-10'),
          items: [{ sellerId: 'seller123', subtotal: 150 }],
        },
      ];

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockOrders),
        }),
      });

      await orderController.getSellerEarnings(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            summary: expect.objectContaining({
              totalRevenue: 450,
              totalOrders: 3,
              commissionRate: 0.1,
            }),
            monthlyEarnings: expect.any(Array),
          }),
        })
      );
    });

    it('should return empty earnings when no orders exist', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      (Order.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await orderController.getSellerEarnings(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            summary: expect.objectContaining({
              totalRevenue: 0,
              totalOrders: 0,
              totalCommission: 0,
              totalPayout: 0,
            }),
            monthlyEarnings: [],
          }),
        })
      );
    });

    it('should handle errors', async () => {
      mockRequest.params = { sellerId: 'seller123' };

      (Order.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getSellerEarnings(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get seller earnings',
        error: 'Database error',
      });
    });
  });

  describe('Stub endpoints', () => {
    it('validateCart should return stub response', () => {
      orderController.validateCart(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ message: 'validateCart stub' });
    });

    it('addTracking should return stub response', () => {
      orderController.addTracking(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ message: 'addTracking stub' });
    });

    it('markAsShipped should return stub response', () => {
      orderController.markAsShipped(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ message: 'markAsShipped stub' });
    });

    it('getAdminOrders should return stub response', () => {
      orderController.getAdminOrders(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ message: 'getAdminOrders stub' });
    });

    it('processRefund should return stub response', () => {
      orderController.processRefund(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({ message: 'processRefund stub' });
    });
  });

  describe('updateOrderStatus', () => {
    it('should handle errors', async () => {
      mockRequest.params = { id: 'order123' };
      mockRequest.body = { orderStatus: OrderStatus.PROCESSING };

      (Order.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

      await orderController.updateOrderStatus(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update order status',
        error: 'Database error',
      });
    });
  });

  describe('getOrderById', () => {
    it('should handle errors', async () => {
      mockRequest.params = { id: 'order123' };

      (Order.findById as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getOrderById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get order',
        error: 'Database error',
      });
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should handle errors', async () => {
      mockRequest.params = { customerId: 'customer123' };

      (Order.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await orderController.getOrdersByCustomer(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get customer orders',
        error: 'Database error',
      });
    });
  });
});
