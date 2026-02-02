import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { UserRole } from '@3asoftwares/types';
import { Logger } from '@3asoftwares/utils/server';
import {
  sendVerificationEmailTemplate,
  sendPasswordResetEmailTemplate,
} from '../services/emailService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;
    Logger.info(`Registration attempt for email: ${email}`, undefined, 'Auth');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      Logger.warn(`Registration failed - email already exists: ${email}`, undefined, 'Auth');
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    const user = new User({
      email,
      password,
      name: name || email.split('@')[0],
      role: role || UserRole.CUSTOMER,
    });

    await user.save();

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    Logger.info(
      `User registered successfully: ${email}`,
      { userId: user._id, role: user.role },
      'Auth'
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    Logger.error(`Registration failed for email: ${req.body.email}`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    Logger.info(`Login attempt for email: ${email}`, undefined, 'Auth');

    const user: any = await User.findOne({ email }).select('+password');

    if (user === null) {
      Logger.warn(`Login failed - user not found: ${email}`, undefined, 'Auth');
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    if (!user.isActive) {
      Logger.warn(`Login failed - account deactivated: ${email}`, undefined, 'Auth');
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      Logger.warn(`Login failed - invalid password: ${email}`, undefined, 'Auth');
      res.status(401).json({
        success: false,
        message: 'Email and password does not match.',
      });
      return;
    }

    Logger.info(`Login attempt for user: ${user.email}`, undefined, 'Auth');

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    user.lastLogin = new Date();
    user.refreshToken = tokens.refreshToken;
    await user.save();

    Logger.info(`Login successful: ${email}`, { userId: user._id, role: user.role }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    Logger.error(`Login failed for email: ${req.body.email}`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    Logger.debug('Token refresh attempt', undefined, 'Auth');

    if (!refreshToken) {
      Logger.warn('Token refresh failed - no token provided', undefined, 'Auth');
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      Logger.warn('Token refresh failed - invalid token', { userId: decoded.userId }, 'Auth');
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
      return;
    }

    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    Logger.info('Token refreshed successfully', { userId: user._id }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error: any) {
    Logger.error('Token refresh failed', error, 'Auth');
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message,
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    Logger.info(`Logout attempt`, { userId }, 'Auth');

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    Logger.info('Logout successful', { userId }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    Logger.error('Logout failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    Logger.debug('Fetching user profile', { userId }, 'Auth');

    const user = await User.findById(userId);

    if (!user) {
      Logger.warn('Profile not found', { userId }, 'Auth');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    Logger.debug('Profile fetched successfully', { userId, email: user.email }, 'Auth');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get profile', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, phone } = req.body;

    const updateData: { name?: string; phone?: string } = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    Logger.info('Updating user profile', { userId, name, phone }, 'Auth');

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

    if (!user) {
      Logger.warn('Profile update failed - user not found', { userId }, 'Auth');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    Logger.info('Profile updated successfully', { userId, email: user.email }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Failed to update profile', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    Logger.info('Password change attempt', { userId }, 'Auth');

    const user = await User.findById(userId).select('+password');

    if (!user) {
      Logger.warn('Password change failed - user not found', { userId }, 'Auth');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      Logger.warn('Password change failed - incorrect current password', { userId }, 'Auth');
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    Logger.info('Password changed successfully', { userId }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to change password', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    Logger.debug('Fetching user stats', undefined, 'Auth');

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const sellerUsers = await User.countDocuments({ role: 'seller' });
    const customerUsers = await User.countDocuments({ role: 'customer' });

    Logger.info('User stats fetched', { totalUsers, activeUsers }, 'Auth');

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        sellerUsers,
        customerUsers,
      },
    });
  } catch (error: any) {
    Logger.error('Failed to get stats', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message,
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    Logger.info(`Getting user by ID: ${userId}`, undefined, 'Auth');

    const user = await User.findById(userId);

    if (!user) {
      Logger.warn(`User not found: ${userId}`, undefined, 'Auth');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      Logger.warn(`User account deactivated: ${userId}`, undefined, 'Auth');
      res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
      return;
    }

    // Generate fresh tokens for the user
    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    Logger.info(`User fetched successfully: ${user.email}`, { userId, role: user.role }, 'Auth');

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: Date.now() + 15 * 60 * 1000, // 15 minutes
      },
    });
  } catch (error: any) {
    Logger.error(`Failed to get user by ID: ${req.params.userId}`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message,
    });
  }
};

/**
 * Send verification email to the authenticated user
 * Generates a verification token, stores it with expiry, and sends email
 */
export const sendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    Logger.info(`Sending verification email for user: ${userId}`, undefined, 'Auth');

    const user = await User.findById(userId);
    Logger.info(`user: ${user?.emailVerified}`, undefined, 'Auth');

    if (!user) {
      Logger.warn(`User not found for verification: ${userId}`, undefined, 'Auth');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Set token and expiry (24 hours)
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Build verification URL based on source
    const { source } = req.body;
    let frontendUrl: string;

    if (source === 'admin') {
      frontendUrl = process.env.ADMIN_URL || 'http://localhost:3001';
    } else if (source === 'seller') {
      frontendUrl = process.env.SELLER_URL || 'http://localhost:3002';
    } else {
      frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }

    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // Send the email
    try {
      const emailResult = await sendVerificationEmailTemplate(
        user.email,
        user.name,
        verificationUrl
      );

      Logger.info(
        `Verification email sent to: ${user.email}`,
        {
          userId,
          messageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl,
        },
        'Auth'
      );

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
        ...(emailResult.previewUrl && { previewUrl: emailResult.previewUrl }),
      });
    } catch (emailError: any) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      Logger.error(`Failed to send verification email to: ${user.email}`, emailError, 'Auth');
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }
  } catch (error: any) {
    Logger.error(`Failed to send verification email`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message,
    });
  }
};

/**
 * Verify email - Can be called via the link in the email (with token) or by authenticated user (demo)
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const userId = req.user?.userId;

    let user;

    // If token provided, verify using the token (from email link)
    if (token) {
      Logger.info('Verifying email with token', undefined, 'Auth');

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token',
        });
        return;
      }
    } else if (userId) {
      // Demo mode: Verify for authenticated user without token
      Logger.info(`Verifying email for authenticated user: ${userId}`, undefined, 'Auth');
      user = await User.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Mark email as verified and clear verification token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    Logger.info(`Email verified for user: ${user.email}`, { userId: user._id }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error: any) {
    Logger.error(`Failed to verify email`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
};

/**
 * Forgot Password - Sends a password reset link via email
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, domain } = req.body;
    Logger.info(`Password reset requested for email: ${email}`, undefined, 'Auth');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Use domain directly from frontend, fallback to default
    const resetUrl = `${domain}/reset-password?token=${resetToken}`;

    try {
      const emailResult = await sendPasswordResetEmailTemplate(user.email, user.name, resetUrl);

      Logger.info(
        `Password reset email sent to: ${email}`,
        {
          messageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl,
        },
        'Auth'
      );

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Include preview URL for Ethereal test emails (development only)
        ...(emailResult.previewUrl && { previewUrl: emailResult.previewUrl }),
        // For demo/development - remove in production
        ...(process.env.NODE_ENV !== 'production' && {
          resetToken: resetToken,
          resetUrl: resetUrl,
        }),
      });
    } catch (emailError: any) {
      // If email fails, clear the token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      Logger.error(`Failed to send password reset email to: ${email}`, emailError, 'Auth');
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }
  } catch (error: any) {
    Logger.error(`Forgot password failed for email: ${req.body.email}`, error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message,
    });
  }
};

/**
 * Reset Password - Resets the password using a valid reset token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;
    Logger.info('Password reset attempt with token', undefined, 'Auth');

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
      return;
    }

    if (!password || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Password and confirm password are required',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    Logger.info(`Password reset successful for user: ${user.email}`, undefined, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    Logger.error('Password reset failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

/**
 * Validate Reset Token - Checks if a reset token is valid
 */
export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    Logger.info('Validating reset token', undefined, 'Auth');

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.email,
    });
  } catch (error: any) {
    Logger.error('Token validation failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to validate token',
      error: error.message,
    });
  }
};

/**
 * Verify email by token - Public endpoint called from email link
 */
export const verifyEmailByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    Logger.info('Email verification attempt with token', undefined, 'Auth');

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    // Mark email as verified and clear verification token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    Logger.info(`Email verified for user: ${user.email}`, { userId: user._id }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now close this page.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error: any) {
    Logger.error('Email verification by token failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to verify email',
      error: error.message,
    });
  }
};

/**
 * Validate email verification token - Check if token is valid before showing verify page
 */
export const validateEmailToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    Logger.info('Validating email verification token', undefined, 'Auth');

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.email,
      name: user.name,
    });
  } catch (error: any) {
    Logger.error('Email token validation failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Failed to validate token',
      error: error.message,
    });
  }
};

/**
 * Google OAuth Login/Signup - Verify Google ID token and create/login user
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, accessToken } = req.body;
    Logger.info('Google OAuth attempt', undefined, 'Auth');

    if (!idToken && !accessToken) {
      Logger.warn('Google OAuth failed - no token provided', undefined, 'Auth');
      res.status(400).json({
        success: false,
        message: 'Google token is required',
      });
      return;
    }

    // Verify the Google token
    let googleUserInfo: { email: string; name: string; picture?: string; sub: string };

    try {
      // Verify the ID token using Google's tokeninfo endpoint
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
      );

      if (!response.ok) {
        throw new Error('Invalid Google token');
      }

      const tokenInfo:any = await response.json();

      // Verify the audience (client ID)
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (tokenInfo.aud !== expectedClientId) {
        Logger.warn('Google OAuth failed - invalid client ID', { aud: tokenInfo.aud }, 'Auth');
        throw new Error('Invalid token audience');
      }

      googleUserInfo = {
        email: tokenInfo.email,
        name: tokenInfo.name || tokenInfo.email.split('@')[0],
        picture: tokenInfo.picture,
        sub: tokenInfo.sub,
      };

      Logger.debug('Google token verified', { email: googleUserInfo.email }, 'Auth');
    } catch (tokenError: any) {
      Logger.error('Google token verification failed', tokenError, 'Auth');
      res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
      return;
    }

    // Check if user exists with this email
    let user = await User.findOne({ email: googleUserInfo.email });

    if (user) {
      // User exists - update Google info if not set
      if (!user.googleId) {
        user.googleId = googleUserInfo.sub;
        user.profilePicture = googleUserInfo.picture || user.profilePicture;
        user.emailVerified = true; // Google emails are verified
        await user.save();
        Logger.info('Linked Google account to existing user', { userId: user._id }, 'Auth');
      }

      // Check if account is active
      if (!user.isActive) {
        Logger.warn('Google OAuth failed - account deactivated', { email: googleUserInfo.email }, 'Auth');
        res.status(403).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
        return;
      }
    } else {
      // Create new user
      Logger.info('Creating new user from Google OAuth', { email: googleUserInfo.email }, 'Auth');

      user = new User({
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        googleId: googleUserInfo.sub,
        profilePicture: googleUserInfo.picture,
        emailVerified: true, // Google emails are verified
        role: 'customer', // Default role for Google signups
        password: crypto.randomBytes(32).toString('hex'), // Random password (user won't need it)
      });

      await user.save();
      Logger.info('New user created from Google OAuth', { userId: user._id }, 'Auth');
    }

    // Generate tokens
    const tokens = generateTokens(user._id.toString(), user.email, user.role);

    // Update user with refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    Logger.info('Google OAuth successful', { userId: user._id, email: user.email }, 'Auth');

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      user: {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    Logger.error('Google OAuth failed', error, 'Auth');
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};
