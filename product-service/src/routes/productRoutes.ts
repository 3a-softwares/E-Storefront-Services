

import express from 'express';
import { body } from 'express-validator';
import * as productController from '../controllers/ProductController';
import { validate } from '../middleware/validator';
import { authenticate } from '../middleware/auth';

const router = express.Router();

const productValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('sellerId').notEmpty().withMessage('Seller ID is required'),
];

// Public routes (GET - read operations)
router.get('/seller/:sellerId', productController.getProductsBySeller);

router.get('/', productController.getAllProducts);

router.get('/:id', productController.getProductById);

// Protected routes (require authentication)
router.post('/', authenticate, productValidation, validate, productController.createProduct);

router.put('/:id', authenticate, productController.updateProduct);

router.delete('/:id', authenticate, productController.deleteProduct);

export default router;
