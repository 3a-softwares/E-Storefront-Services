import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon';
import { Logger } from '@3asoftwares/utils/server';

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined && isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(query),
    ]);

    Logger.debug(`Fetched ${coupons.length} coupons`, { page, limit, total }, 'CouponController');

    return res.json({
      success: true,
      data: {
        coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('Get coupons error', { error: error.message }, 'CouponController');
    return res.status(500).json({
      success: false,
      message: 'Failed to get coupons',
      error: error.message,
    });
  }
};

export const getCouponById = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      Logger.warn('Coupon not found', { id: req.params.id }, 'CouponController');
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }
    Logger.debug('Coupon fetched successfully', { id: req.params.id, code: coupon.code }, 'CouponController');
    return res.json({ success: true, data: coupon });
  } catch (error: any) {
    Logger.error('Get coupon by id error', { id: req.params.id, error: error.message }, 'CouponController');
    return res.status(500).json({
      success: false,
      message: 'Failed to get coupon',
      error: error.message,
    });
  }
};

export const getCouponByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
    });

    if (!coupon) {
      Logger.warn('Coupon not found or expired', { code }, 'CouponController');
      return res.status(404).json({
        success: false,
        message: 'Coupon not found or expired',
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      Logger.warn('Coupon usage limit reached', { code, usageCount: coupon.usageCount, usageLimit: coupon.usageLimit }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached',
      });
    }

    Logger.debug('Coupon fetched by code successfully', { code }, 'CouponController');
    return res.json({ success: true, data: coupon });
  } catch (error: any) {
    Logger.error('Get coupon by code error', { code: req.params.code, error: error.message }, 'CouponController');
    return res.status(500).json({
      success: false,
      message: 'Failed to get coupon',
      error: error.message,
    });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code) {
      Logger.warn('Coupon validation failed - code required', undefined, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required',
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      Logger.warn('Coupon validation failed - not found', { code }, 'CouponController');
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      Logger.warn('Coupon validation failed - not yet valid', { code, validFrom: coupon.validFrom }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon is not yet valid',
      });
    }

    if (now > coupon.validTo) {
      Logger.warn('Coupon validation failed - expired', { code, validTo: coupon.validTo }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon has expired',
      });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      Logger.warn('Coupon validation failed - usage limit reached', { code }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon usage limit reached',
      });
    }

    if (coupon.minPurchase && orderTotal < coupon.minPurchase) {
      Logger.warn('Coupon validation failed - minimum purchase not met', { code, orderTotal, minPurchase: coupon.minPurchase }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of $${coupon.minPurchase} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * coupon.discount) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discount;
    }

    Logger.info('Coupon validated successfully', { code, discount, orderTotal }, 'CouponController');
    return res.json({
      success: true,
      data: {
        coupon,
        discount,
        finalTotal: orderTotal - discount,
      },
    });
  } catch (error: any) {
    Logger.error('Validate coupon error', { code: req.body.code, error: error.message }, 'CouponController');
    return res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message,
    });
  }
};

export const applyCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() },
        $or: [
          { usageLimit: { $exists: false } },
          { $expr: { $lt: ['$usageCount', '$usageLimit'] } },
        ],
      },
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!coupon) {
      Logger.warn('Apply coupon failed - not available', { code }, 'CouponController');
      return res.status(400).json({
        success: false,
        message: 'Coupon not available',
      });
    }

    Logger.info('Coupon applied successfully', { code, usageCount: coupon.usageCount }, 'CouponController');
    return res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: coupon,
    });
  } catch (error: any) {
    Logger.error('Apply coupon error', { code: req.body.code, error: error.message }, 'CouponController');
    return res.status(500).json({
      success: false,
      message: 'Failed to apply coupon',
      error: error.message,
    });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const couponData = {
      ...req.body,
      code: req.body.code?.toUpperCase(),
    };

    const coupon = new Coupon(couponData);
    await coupon.save();

    Logger.info('Coupon created successfully', { id: coupon._id, code: coupon.code }, 'CouponController');
    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error: any) {
    Logger.error('Create coupon error', { code: req.body.code, error: error.message }, 'CouponController');
    return res.status(400).json({
      success: false,
      message: error.code === 11000 ? 'Coupon code already exists' : error.message,
    });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const updateData = { ...req.body };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      Logger.warn('Coupon update failed - not found', { id: req.params.id }, 'CouponController');
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    Logger.info('Coupon updated successfully', { id: req.params.id, code: coupon.code }, 'CouponController');
    return res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error: any) {
    Logger.error('Update coupon error', { id: req.params.id, error: error.message }, 'CouponController');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      Logger.warn('Coupon delete failed - not found', { id: req.params.id }, 'CouponController');
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    Logger.info('Coupon deleted successfully', { id: req.params.id, code: coupon.code }, 'CouponController');
    return res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error: any) {
    Logger.error('Delete coupon error', { id: req.params.id, error: error.message }, 'CouponController');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
