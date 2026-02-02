import express from 'express';
import * as couponController from '../controllers/CouponController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes - for customer checkout
router.post('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);
router.get('/code/:code', couponController.getCouponByCode);

// Protected routes - admin only
router.get('/', authenticate, couponController.getCoupons);
router.get('/:id', authenticate, couponController.getCouponById);
router.post('/', authenticate, couponController.createCoupon);
router.put('/:id', authenticate, couponController.updateCoupon);
router.delete('/:id', authenticate, couponController.deleteCoupon);

export default router;
