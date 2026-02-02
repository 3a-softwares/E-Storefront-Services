import { Request, Response } from 'express';
import * as categoryController from '../../src/controllers/CategoryController';
import Category from '../../src/models/Category';

// Mock dependencies
jest.mock('../../src/models/Category');

describe('CategoryController', () => {
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
      query: {},
    };
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return all active categories', async () => {
      mockRequest.query = {};

      const mockCategories = [
        { _id: 'cat1', name: 'Electronics', isActive: true },
        { _id: 'cat2', name: 'Clothing', isActive: true },
      ];

      (Category.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories),
      });

      await categoryController.getAllCategories(mockRequest as Request, mockResponse as Response);

      expect(Category.find).toHaveBeenCalledWith({ isActive: true });
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          categories: mockCategories,
          count: 2,
        },
      });
    });

    it('should filter by search term', async () => {
      mockRequest.query = { search: 'electron' };

      (Category.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await categoryController.getAllCategories(mockRequest as Request, mockResponse as Response);

      expect(Category.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
          isActive: true,
        })
      );
    });

    it('should filter by isActive status', async () => {
      mockRequest.query = { isActive: 'false' };

      (Category.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      await categoryController.getAllCategories(mockRequest as Request, mockResponse as Response);

      expect(Category.find).toHaveBeenCalledWith({ isActive: false });
    });

    it('should handle errors', async () => {
      (Category.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await categoryController.getAllCategories(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch categories',
        error: 'Database error',
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', async () => {
      mockRequest.params = { id: 'cat123' };

      const mockCategory = {
        _id: 'cat123',
        name: 'Electronics',
        description: 'Electronic products',
      };

      (Category.findOne as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockCategory,
      });
    });

    it('should return category by slug', async () => {
      mockRequest.params = { id: 'electronics' };

      const mockCategory = {
        _id: 'cat123',
        name: 'Electronics',
        slug: 'electronics',
      };

      (Category.findOne as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(Category.findOne).toHaveBeenCalledWith({
        $or: [{ _id: 'electronics' }, { slug: 'electronics' }],
      });
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Category.findOne as jest.Mock).mockResolvedValue(null);

      await categoryController.getCategoryById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
    });
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'New Category',
      description: 'Category description',
      icon: 'category-icon',
    };

    it('should create a new category', async () => {
      mockRequest.body = validCategoryData;

      const mockSavedCategory = {
        ...validCategoryData,
        _id: 'cat123',
        save: jest.fn().mockResolvedValue(true),
      };

      (Category.findOne as jest.Mock).mockResolvedValue(null);
      (Category as unknown as jest.Mock).mockImplementation(() => mockSavedCategory);

      await categoryController.createCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Category created successfully',
        })
      );
    });

    it('should return 400 if category name already exists', async () => {
      mockRequest.body = validCategoryData;

      (Category.findOne as jest.Mock).mockResolvedValue({ name: validCategoryData.name });

      await categoryController.createCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Category with this name already exists',
      });
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      mockRequest.params = { id: 'cat123' };
      mockRequest.body = { description: 'Updated description' };

      const mockUpdatedCategory = {
        _id: 'cat123',
        name: 'Electronics',
        description: 'Updated description',
      };

      (Category.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      await categoryController.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Category updated successfully',
        })
      );
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { name: 'Updated' };

      // Mock findOne to return null (no duplicate found)
      (Category.findOne as jest.Mock).mockResolvedValue(null);
      // Mock findByIdAndUpdate to return null (category not found)
      (Category.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await categoryController.updateCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      mockRequest.params = { id: 'cat123' };

      // Implementation uses soft delete via findByIdAndUpdate
      (Category.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'cat123',
        isActive: false,
      });

      await categoryController.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully',
      });
    });

    it('should return 404 if category not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Category.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await categoryController.deleteCategory(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });
});
