import { couponResolvers } from '../../../src/schema/types/coupon/resolvers';
import { couponClient } from '../../../src/clients/serviceClients';
import { GraphQLError } from 'graphql';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  couponClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  addAuthHeader: jest.fn((token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe('Coupon Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.coupons', () => {
    it('should return paginated coupons', async () => {
      const mockCoupons = {
        data: {
          data: {
            coupons: [
              { _id: '1', code: 'SAVE10', discount: 10 },
              { _id: '2', code: 'SAVE20', discount: 20 },
            ],
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      };

      (couponClient.get as jest.Mock).mockResolvedValue(mockCoupons);

      const result = await couponResolvers.Query.coupons(
        null,
        { page: 1, limit: 10 },
        mockContext
      );

      expect(result).toEqual(mockCoupons.data.data);
    });

    it('should filter by search and isActive', async () => {
      (couponClient.get as jest.Mock).mockResolvedValue({ data: { data: { coupons: [] } } });

      await couponResolvers.Query.coupons(
        null,
        { search: 'SAVE', isActive: true },
        mockContext
      );

      expect(couponClient.get).toHaveBeenCalledWith('/api/coupons', {
        params: { search: 'SAVE', isActive: true },
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        couponResolvers.Query.coupons(null, {}, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Query.coupon', () => {
    it('should return coupon by ID', async () => {
      const mockCoupon = {
        data: {
          data: { _id: '1', code: 'SAVE10', discount: 10 },
        },
      };

      (couponClient.get as jest.Mock).mockResolvedValue(mockCoupon);

      const result = await couponResolvers.Query.coupon(
        null,
        { id: '1' },
        mockContext
      );

      expect(result).toEqual(mockCoupon.data.data);
    });
  });

  describe('Query.validateCoupon', () => {
    it('should validate coupon successfully', async () => {
      const mockValidation = {
        data: {
          data: {
            valid: true,
            discount: 15,
            coupon: { discount: 10, discountType: 'percentage' },
            finalTotal: 85,
            message: 'Coupon applied',
          },
        },
      };

      (couponClient.post as jest.Mock).mockResolvedValue(mockValidation);

      const result = await couponResolvers.Query.validateCoupon(
        null,
        { code: 'SAVE10', orderTotal: 100 }
      );

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(15);
      expect(result.code).toBe('SAVE10');
    });

    it('should return error for invalid coupon', async () => {
      (couponClient.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Coupon expired' } },
      });

      const result = await couponResolvers.Query.validateCoupon(
        null,
        { code: 'EXPIRED', orderTotal: 100 }
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon expired');
      expect(result.finalTotal).toBe(100);
    });

    it('should handle missing data gracefully', async () => {
      (couponClient.post as jest.Mock).mockResolvedValue({
        data: {},
      });

      const result = await couponResolvers.Query.validateCoupon(
        null,
        { code: 'TEST', orderTotal: 100 }
      );

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(0);
    });
  });

  describe('Coupon field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'coupon123' };
      expect(couponResolvers.Coupon.id(parent)).toBe('coupon123');
    });

    it('should resolve usageCount with default', () => {
      expect(couponResolvers.Coupon.usageCount({ usageCount: 5 })).toBe(5);
      expect(couponResolvers.Coupon.usageCount({})).toBe(0);
    });

    it('should resolve validFrom to ISO string', () => {
      const date = new Date('2024-01-01');
      const parent = { validFrom: date };
      expect(couponResolvers.Coupon.validFrom(parent)).toBe(date.toISOString());
    });

    it('should return current date for missing validFrom', () => {
      const parent = {};
      const result = couponResolvers.Coupon.validFrom(parent);
      expect(new Date(result)).toBeInstanceOf(Date);
    });

    it('should resolve validTo to ISO string', () => {
      const date = new Date('2024-12-31');
      const parent = { validTo: date };
      expect(couponResolvers.Coupon.validTo(parent)).toBe(date.toISOString());
    });

    it('should resolve createdAt to ISO string', () => {
      const date = new Date('2024-01-01');
      const parent = { createdAt: date };
      expect(couponResolvers.Coupon.createdAt(parent)).toBe(date.toISOString());
    });

    it('should return null for missing createdAt', () => {
      expect(couponResolvers.Coupon.createdAt({})).toBeNull();
    });

    it('should resolve updatedAt to ISO string', () => {
      const date = new Date('2024-01-02');
      const parent = { updatedAt: date };
      expect(couponResolvers.Coupon.updatedAt(parent)).toBe(date.toISOString());
    });

    it('should return null for missing updatedAt', () => {
      expect(couponResolvers.Coupon.updatedAt({})).toBeNull();
    });
  });

  describe('Mutation.createCoupon', () => {
    it('should create coupon successfully', async () => {
      const input = { code: 'NEW20', discount: 20, discountType: 'percentage' };
      const mockCoupon = {
        data: {
          data: { _id: 'newcoupon123', ...input },
        },
      };

      (couponClient.post as jest.Mock).mockResolvedValue(mockCoupon);

      const result = await couponResolvers.Mutation.createCoupon(
        null,
        { input },
        mockContext
      );

      expect(result).toEqual(mockCoupon.data.data);
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        couponResolvers.Mutation.createCoupon(null, { input: {} }, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.updateCoupon', () => {
    it('should update coupon successfully', async () => {
      const input = { discount: 25 };
      const mockCoupon = {
        data: {
          data: { _id: 'coupon123', discount: 25 },
        },
      };

      (couponClient.put as jest.Mock).mockResolvedValue(mockCoupon);

      const result = await couponResolvers.Mutation.updateCoupon(
        null,
        { id: 'coupon123', input },
        mockContext
      );

      expect(result).toEqual(mockCoupon.data.data);
    });
  });
});
