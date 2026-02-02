import { Request, Response } from 'express';
import * as couponController from '../../src/controllers/CouponController';
import { Coupon } from '../../src/models/Coupon';

// Mock dependencies
jest.mock('../../src/models/Coupon');

describe('CouponController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('getCoupons', () => {
    it('should return paginated coupons', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      const mockCoupons = [
        { _id: 'coup1', code: 'SAVE10', discountType: 'percentage', discountValue: 10 },
        { _id: 'coup2', code: 'SAVE20', discountType: 'percentage', discountValue: 20 },
      ];

      (Coupon.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockCoupons),
            }),
          }),
        }),
      });
      (Coupon.countDocuments as jest.Mock).mockResolvedValue(2);

      await couponController.getCoupons(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          coupons: mockCoupons,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
      });
    });

    it('should filter by search term', async () => {
      mockRequest.query = { search: 'SAVE' };

      (Coupon.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Coupon.countDocuments as jest.Mock).mockResolvedValue(0);

      await couponController.getCoupons(mockRequest as Request, mockResponse as Response);

      expect(Coupon.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
        })
      );
    });

    it('should filter by isActive status', async () => {
      mockRequest.query = { isActive: 'true' };

      (Coupon.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Coupon.countDocuments as jest.Mock).mockResolvedValue(0);

      await couponController.getCoupons(mockRequest as Request, mockResponse as Response);

      expect(Coupon.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('should handle errors', async () => {
      (Coupon.find as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      await couponController.getCoupons(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getCouponById', () => {
    it('should return coupon by ID', async () => {
      mockRequest.params = { id: 'coup123' };

      const mockCoupon = {
        _id: 'coup123',
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
      };

      (Coupon.findById as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.getCouponById(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCoupon,
      });
    });

    it('should return 404 if coupon not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Coupon.findById as jest.Mock).mockResolvedValue(null);

      await couponController.getCouponById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon not found',
      });
    });
  });

  describe('getCouponByCode', () => {
    it('should return valid coupon by code', async () => {
      mockRequest.params = { code: 'save10' };

      const mockCoupon = {
        _id: 'coup123',
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        usageLimit: 100,
        usageCount: 10,
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.getCouponByCode(mockRequest as Request, mockResponse as Response);

      expect(Coupon.findOne).toHaveBeenCalledWith({
        code: 'SAVE10',
        isActive: true,
        validFrom: { $lte: expect.any(Date) },
        validTo: { $gte: expect.any(Date) },
      });
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCoupon,
      });
    });

    it('should return 404 if coupon not found or expired', async () => {
      mockRequest.params = { code: 'EXPIRED' };

      (Coupon.findOne as jest.Mock).mockResolvedValue(null);

      await couponController.getCouponByCode(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon not found or expired',
      });
    });

    it('should return 400 if usage limit reached', async () => {
      mockRequest.params = { code: 'LIMITED' };

      const mockCoupon = {
        code: 'LIMITED',
        usageLimit: 10,
        usageCount: 10,
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.getCouponByCode(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon usage limit reached',
      });
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      mockRequest.body = { code: 'SAVE10', orderTotal: 100 };

      const now = new Date();
      const mockCoupon = {
        _id: 'coup123',
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        validFrom: new Date(now.getTime() - 86400000), // Yesterday
        validTo: new Date(now.getTime() + 86400000), // Tomorrow
        minimumOrderAmount: 50,
        usageLimit: 100,
        usageCount: 10,
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.validateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return 400 if no code provided', async () => {
      mockRequest.body = { orderTotal: 100 };

      await couponController.validateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon code is required',
      });
    });

    it('should return 404 if coupon not found', async () => {
      mockRequest.body = { code: 'INVALID', orderTotal: 100 };

      (Coupon.findOne as jest.Mock).mockResolvedValue(null);

      await couponController.validateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon not found',
      });
    });

    it('should return 400 if coupon is not yet valid', async () => {
      mockRequest.body = { code: 'FUTURE', orderTotal: 100 };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockCoupon = {
        code: 'FUTURE',
        isActive: true,
        validFrom: futureDate,
        validTo: new Date(futureDate.getTime() + 86400000),
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.validateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon is not yet valid',
      });
    });
  });

  describe('createCoupon', () => {
    const validCouponData = {
      code: 'NEWCODE',
      discountType: 'percentage',
      discountValue: 15,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 86400000 * 30),
    };

    it('should create a new coupon', async () => {
      mockRequest.body = validCouponData;

      const mockSavedCoupon = {
        ...validCouponData,
        _id: 'coup123',
        save: jest.fn().mockResolvedValue(true),
      };

      (Coupon.findOne as jest.Mock).mockResolvedValue(null);
      (Coupon as unknown as jest.Mock).mockImplementation(() => mockSavedCoupon);

      await couponController.createCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Coupon created successfully',
        })
      );
    });

    it('should return 400 if coupon code already exists', async () => {
      mockRequest.body = validCouponData;

      // Implementation catches MongoDB duplicate key error (code 11000) from save()
      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;

      const mockCouponWithError = {
        ...validCouponData,
        save: jest.fn().mockRejectedValue(duplicateError),
      };

      (Coupon as unknown as jest.Mock).mockImplementation(() => mockCouponWithError);

      await couponController.createCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Coupon code already exists',
      });
    });
  });

  describe('updateCoupon', () => {
    it('should update an existing coupon', async () => {
      mockRequest.params = { id: 'coup123' };
      mockRequest.body = { discountValue: 20 };

      const mockUpdatedCoupon = {
        _id: 'coup123',
        code: 'SAVE10',
        discountValue: 20,
      };

      (Coupon.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedCoupon);

      await couponController.updateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Coupon updated successfully',
        })
      );
    });

    it('should return 404 if coupon not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { discountValue: 20 };

      (Coupon.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await couponController.updateCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCoupon', () => {
    it('should delete a coupon', async () => {
      mockRequest.params = { id: 'coup123' };

      (Coupon.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: 'coup123' });

      await couponController.deleteCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Coupon deleted successfully',
      });
    });

    it('should return 404 if coupon not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Coupon.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await couponController.deleteCoupon(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon and increment usage count', async () => {
      mockRequest.body = { code: 'SAVE10', orderTotal: 100 };

      const mockCoupon = {
        _id: 'coup123',
        code: 'SAVE10',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validTo: new Date(Date.now() + 86400000),
        minimumOrderAmount: 0,
        usageLimit: 100,
        usageCount: 11, // incremented by the atomic update
      };

      // Implementation uses findOneAndUpdate atomically (not findOne + save)
      (Coupon.findOneAndUpdate as jest.Mock).mockResolvedValue(mockCoupon);

      await couponController.applyCoupon(mockRequest as Request, mockResponse as Response);

      expect(Coupon.findOneAndUpdate).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
