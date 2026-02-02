import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/middleware/auth';
import { requireRole } from '../../src/middleware/rbac';
import { UserRole } from '@3asoftwares/types';
import * as jwt from '../../src/utils/jwt';

// Mock the jwt module
jest.mock('../../src/utils/jwt');

// Mock the Logger
jest.mock('@3asoftwares/utils/server', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      method: 'GET',
      path: '/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() with valid token', async () => {
      const mockPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect((mockRequest as any).user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Access denied.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header has wrong format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Access denied.',
      });
    });

    it('should return 401 if token is empty after Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('jwt must be provided');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if token verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
        error: 'Invalid token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle token with extra spaces', async () => {
      const mockPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
      };

      mockRequest.headers = {
        authorization: 'Bearer   valid-token  ',
      };

      (jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verifyAccessToken).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next() if user has required role', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next() if user has one of multiple required roles', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'seller@example.com',
        role: UserRole.SELLER,
      };

      const middleware = requireRole(UserRole.ADMIN, UserRole.SELLER);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'customer@example.com',
        role: UserRole.CUSTOMER,
      };

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should work with multiple roles where user has none', () => {
      mockRequest.user = {
        userId: 'user123',
        email: 'customer@example.com',
        role: UserRole.CUSTOMER,
      };

      const middleware = requireRole(UserRole.ADMIN, UserRole.SELLER);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
