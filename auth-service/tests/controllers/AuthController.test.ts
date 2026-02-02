import { Request, Response } from 'express';
import * as authController from '../../src/controllers/AuthController';
import User from '../../src/models/User';
import * as jwt from '../../src/utils/jwt';
import { UserRole } from '@3asoftwares/types';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/services/emailService', () => ({
  sendVerificationEmailTemplate: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmailTemplate: jest.fn().mockResolvedValue(true),
}));

describe('AuthController', () => {
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
      user: undefined,
    };
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: UserRole.CUSTOMER,
    };

    it('should register a new user successfully', async () => {
      mockRequest.body = validRegistrationData;

      const mockSavedUser = {
        _id: 'user123',
        email: validRegistrationData.email,
        name: validRegistrationData.name,
        role: validRegistrationData.role,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => mockSavedUser);
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: validRegistrationData.email });
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      mockRequest.body = validRegistrationData;

      (User.findOne as jest.Mock).mockResolvedValue({ email: validRegistrationData.email });

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
    });

    it('should handle registration errors', async () => {
      mockRequest.body = validRegistrationData;

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Registration failed',
        })
      );
    });

    it('should use default name from email if not provided', async () => {
      mockRequest.body = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const mockSavedUser = {
        _id: 'user123',
        email: 'testuser@example.com',
        name: 'testuser',
        role: UserRole.CUSTOMER,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => mockSavedUser);
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      mockRequest.body = loginCredentials;

      const mockUser = {
        _id: 'user123',
        email: loginCredentials.email,
        name: 'Test User',
        role: UserRole.CUSTOMER,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = loginCredentials;

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 403 if account is deactivated', async () => {
      mockRequest.body = loginCredentials;

      const mockUser = {
        _id: 'user123',
        email: loginCredentials.email,
        isActive: false,
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(403);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    });

    it('should return 401 if password is invalid', async () => {
      mockRequest.body = loginCredentials;

      const mockUser = {
        _id: 'user123',
        email: loginCredentials.email,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password does not match.',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(true);

      await authController.logout(mockRequest as Request, mockResponse as Response);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user123', { refreshToken: null });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle logout without user ID', async () => {
      mockRequest.user = undefined;

      await authController.logout(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      mockRequest.body = { refreshToken: 'valid-refresh-token' };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        refreshToken: 'valid-refresh-token',
        save: jest.fn().mockResolvedValue(true),
      };

      (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      });
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      (jwt.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        })
      );
    });

    it('should return 400 if no refresh token provided', async () => {
      mockRequest.body = {};

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required',
      });
    });

    it('should return 401 if refresh token is invalid', async () => {
      mockRequest.body = { refreshToken: 'invalid-token' };

      (jwt.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
    });

    it('should return 401 if refresh token does not match stored token', async () => {
      mockRequest.body = { refreshToken: 'valid-but-old-token' };

      const mockUser = {
        _id: 'user123',
        refreshToken: 'different-stored-token',
      };

      (jwt.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'user123' });
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER,
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.any(Object),
          }),
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.user = {
        userId: 'nonexistent',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      (User.findById as jest.Mock).mockResolvedValue(null);

      await authController.getProfile(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      mockRequest.body = {
        email: 'user@example.com',
        role: UserRole.CUSTOMER,
      };

      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response);

      expect(mockUser.save).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return success even if user not found (security)', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        role: UserRole.CUSTOMER,
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await authController.forgotPassword(mockRequest as Request, mockResponse as Response);

      // Should still return success for security reasons
      expect(responseStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockRequest.body = {
        token: 'valid-reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        password: 'oldhashedpassword',
        passwordResetToken: 'hashedtoken',
        passwordResetExpires: new Date(Date.now() + 3600000),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockUser.save).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should return error if passwords do not match', async () => {
      mockRequest.body = {
        token: 'valid-reset-token',
        password: 'newpassword123',
        confirmPassword: 'differentpassword',
      };

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Passwords do not match',
      });
    });

    it('should return error if token is invalid or expired', async () => {
      mockRequest.body = {
        token: 'expired-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.resetPassword(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });
  });
});
