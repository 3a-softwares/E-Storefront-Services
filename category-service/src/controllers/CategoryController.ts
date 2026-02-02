import { Request, Response } from 'express';
import Category from '../models/Category';
import { Logger } from '@3asoftwares/utils/server';

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, isActive } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined && isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true;
    }

    const categories = await Category.find(query).sort({ name: 1 });
    Logger.debug(`Fetched ${categories.length} categories`, { search, isActive }, 'CategoryController');

    res.status(200).json({
      success: true,
      data: { categories, count: categories.length },
    });
  } catch (error: any) {
    Logger.error('Get categories error', { error: error.message }, 'CategoryController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      $or: [{ _id: id }, { slug: id }],
    });

    if (!category) {
      Logger.warn('Category not found', { id }, 'CategoryController');
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    Logger.debug('Category fetched successfully', { id, name: category.name }, 'CategoryController');
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    Logger.error('Get category by id error', { id: req.params.id, error: error.message }, 'CategoryController');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message,
    });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon } = req.body;

    const existingCategory = await Category.findOne({
      $or: [{ name: name.toLowerCase() }],
    });

    if (existingCategory) {
      Logger.warn('Category creation failed - duplicate name', { name }, 'CategoryController');
      res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
      return;
    }

    const category = new Category({
      name,
      description,
      icon,
    });

    await category.save();
    Logger.info('Category created successfully', { id: category._id, name: category.name }, 'CategoryController');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error: any) {
    Logger.error('Create category error', { name: req.body.name, error: error.message }, 'CategoryController');
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    if (name) {
      const existingCategory = await Category.findOne({
        name: name.toLowerCase(),
        _id: { $ne: id },
      });

      if (existingCategory) {
        Logger.warn('Category update failed - duplicate name', { id, name }, 'CategoryController');
        res.status(400).json({
          success: false,
          message: 'Category with this name already exists',
        });
        return;
      }
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, icon, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      Logger.warn('Category update failed - not found', { id }, 'CategoryController');
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    Logger.info('Category updated successfully', { id, name: category.name }, 'CategoryController');
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error: any) {
    Logger.error('Update category error', { id: req.params.id, error: error.message }, 'CategoryController');
    res.status(400).json({
      success: false,
      message: 'Failed to update category',
      error: error.message,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!category) {
      Logger.warn('Category delete failed - not found', { id }, 'CategoryController');
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }

    Logger.info('Category deleted successfully', { id, name: category.name }, 'CategoryController');
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    Logger.error('Delete category error', { id: req.params.id, error: error.message }, 'CategoryController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message,
    });
  }
};
