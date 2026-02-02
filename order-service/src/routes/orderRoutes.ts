

import express from 'express';
import { body } from 'express-validator';
import * as orderController from '../controllers/OrderController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = express.Router();

const orderValidation = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('customerEmail').isEmail().withMessage('Valid email is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zip').notEmpty().withMessage('ZIP code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Country is required'),
];

// Protected routes (require authentication for all order operations)
router.get('/customer/:customerId', authenticate, orderController.getOrdersByCustomer);

router.get('/seller/:sellerId', authenticate, orderController.getSellerOrders);

router.get('/seller-stats/:sellerId', authenticate, orderController.getSellerStats);

router.get('/seller-earnings/:sellerId', authenticate, orderController.getSellerEarnings);

router.get('/admin-stats', authenticate, orderController.getAdminStats);

router.get('/', authenticate, orderController.getAllOrders);

router.get('/:id', authenticate, orderController.getOrderById);

router.post('/', authenticate, orderValidation, validate, orderController.createOrder);

router.patch('/:id/status', authenticate, orderController.updateOrderStatus);

router.patch('/:id/payment', authenticate, orderController.updatePaymentStatus);

router.post('/:id/cancel', authenticate, orderController.cancelOrder);

export default router;
