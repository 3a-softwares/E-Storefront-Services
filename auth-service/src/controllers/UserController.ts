

import { Request, Response } from 'express';
import User from '../models/User';
import { Logger } from '@3asoftwares/utils/server';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500); // Default 100, max 500
    const search = req.query.search as string;
    const role = req.query.role as string;

    Logger.debug('Fetching users', { page, limit, search, role }, 'UserController');

    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }

    Logger.debug('Executing user query', { query }, 'UserController');

    const [users, total, sellerCount, adminCount, customerCount] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'customer' }),
    ]);

    Logger.info(`Fetched ${users.length} users`, { total, page, limit }, 'UserController');

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          sellerCount,
          adminCount,
          customerCount,
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to fetch users', error, 'UserController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    Logger.info('Updating user role', { userId: id, newRole: role }, 'UserController');

    const user = await User.findById(id);
    if (!user) {
      Logger.warn('User not found for role update', { userId: id }, 'UserController');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    Logger.info('User role updated successfully', { userId: id, previousRole, newRole: role }, 'UserController');

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    Logger.error('Failed to update user role', error, 'UserController');
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    Logger.info('Deleting user (soft delete)', { userId: id }, 'UserController');

    const user = await User.findById(id);
    if (!user) {
      Logger.warn('User not found for deletion', { userId: id }, 'UserController');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    user.isActive = false;
    await user.save();

    Logger.info('User deleted successfully', { userId: id, email: user.email }, 'UserController');

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    Logger.error('Failed to delete user', error, 'UserController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
