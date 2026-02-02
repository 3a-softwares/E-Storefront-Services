import { Request, Response } from 'express';
import * as userController from '../../src/controllers/UserController';
import User from '../../src/models/User';

// Mock User model
jest.mock('../../src/models/User');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [
        { _id: 'user1', name: 'User 1', email: 'user1@test.com', role: 'customer' },
        { _id: 'user2', name: 'User 2', email: 'user2@test.com', role: 'seller' },
      ];

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      });
      (User.countDocuments as jest.Mock)
        .mockResolvedValueOnce(2) // total
        .mockResolvedValueOnce(1) // seller count
        .mockResolvedValueOnce(0) // admin count
        .mockResolvedValueOnce(1); // customer count

      await userController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: mockUsers,
            pagination: expect.objectContaining({
              page: 1,
              limit: 100,
              total: 2,
              sellerCount: 1,
              adminCount: 0,
              customerCount: 1,
            }),
          }),
        })
      );
    });

    it('should filter users by search term', async () => {
      mockRequest.query = { search: 'test' };

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      await userController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { name: { $regex: 'test', $options: 'i' } },
            { email: { $regex: 'test', $options: 'i' } },
          ]),
        })
      );
    });

    it('should filter users by role', async () => {
      mockRequest.query = { role: 'seller' };

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(0);

      await userController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'seller',
        })
      );
    });

    it('should use custom pagination', async () => {
      mockRequest.query = { page: '2', limit: '5' };

      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (User.countDocuments as jest.Mock).mockResolvedValue(10);

      await userController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pagination: expect.objectContaining({
              page: 2,
              limit: 5,
            }),
          }),
        })
      );
    });

    it('should handle errors', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      await userController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to fetch users',
        })
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      mockRequest.params = { id: 'user123' };
      mockRequest.body = { role: 'seller' };

      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'customer',
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        lastLogin: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(mockUser.role).toBe('seller');
      expect(mockUser.save).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User role updated successfully',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { role: 'seller' };

      (User.findById as jest.Mock).mockResolvedValue(null);

      await userController.updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should handle errors during role update', async () => {
      mockRequest.params = { id: 'user123' };
      mockRequest.body = { role: 'seller' };

      (User.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await userController.updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to update user role',
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user successfully', async () => {
      mockRequest.params = { id: 'user123' };

      const mockUser = {
        _id: 'user123',
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(mockUser.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User deleted successfully',
        })
      );
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (User.findById as jest.Mock).mockResolvedValue(null);

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    it('should handle errors during deletion', async () => {
      mockRequest.params = { id: 'user123' };

      (User.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to delete user',
        })
      );
    });
  });
});
