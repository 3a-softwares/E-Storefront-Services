

import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = express.Router();

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

router.post('/register', registerValidation, validate, authController.register);

router.post('/login', loginValidation, validate, authController.login);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getProfile);

router.put('/me', authenticate, authController.updateProfile);

router.post(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validate,
  authController.changePassword
);

router.get('/stats', authenticate, authController.getStats);

// Get user by ID with fresh tokens (for micro-frontend auth)
router.get('/user/:userId', authController.getUserById);

// Email verification routes
router.post('/send-verification-email', authenticate, authController.sendVerificationEmail);
router.post('/verify-email', authenticate, authController.verifyEmail);
// Public endpoint for email verification via token (from email link)
router.post('/verify-email-token', authController.verifyEmailByToken);
router.get('/validate-email-token/:token', authController.validateEmailToken);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/validate-reset-token/:token', authController.validateResetToken);

// Google OAuth route
router.post('/google', authController.googleAuth);

export default router;
