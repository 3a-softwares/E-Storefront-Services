import { Request, Response } from 'express';
import * as productController from '../../src/controllers/ProductController';
import Product from '../../src/models/Product';
import { CacheService } from '../../src/infrastructure/cache';

// Mock dependencies
jest.mock('../../src/models/Product');
jest.mock('../../src/infrastructure/cache', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  },
  CacheKeys: {
    products: jest.fn((page, limit) => `products:${page}:${limit}`),
    product: jest.fn((id) => `product:${id}`),
  },
  CacheTTL: {
    PRODUCTS: 300,
    PRODUCT_DETAIL: 600,
  },
}));

describe('ProductController', () => {
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

  describe('getAllProducts', () => {
    it('should return paginated products', async () => {
      mockRequest.query = { page: '1', limit: '10' };

      const mockProducts = [
        { _id: 'prod1', name: 'Product 1', price: 100 },
        { _id: 'prod2', name: 'Product 2', price: 200 },
      ];

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockProducts),
            }),
          }),
        }),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(2);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: {
          products: mockProducts,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1,
          },
        },
        fromCache: false,
      });
    });

    it('should return cached products when available', async () => {
      mockRequest.query = { page: '1', limit: '20' };

      const cachedData = {
        products: [{ _id: 'prod1', name: 'Cached Product' }],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      };

      (CacheService.get as jest.Mock).mockResolvedValue(cachedData);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: cachedData,
        fromCache: true,
      });
      expect(Product.find).not.toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      mockRequest.query = { search: 'laptop' };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array),
        })
      );
    });

    it('should filter by category', async () => {
      mockRequest.query = { category: 'Electronics' };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.objectContaining({ $regex: expect.any(RegExp) }),
        })
      );
    });

    it('should filter by price range', async () => {
      mockRequest.query = { minPrice: '50', maxPrice: '200' };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          price: { $gte: 50, $lte: 200 },
        })
      );
    });

    it('should filter by sellerId', async () => {
      mockRequest.query = { sellerId: 'seller123' };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
      (Product.countDocuments as jest.Mock).mockResolvedValue(0);

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: 'seller123',
        })
      );
    });

    it('should handle errors', async () => {
      (CacheService.get as jest.Mock).mockRejectedValue(new Error('Cache error'));

      await productController.getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getProductById', () => {
    it('should return product by ID', async () => {
      mockRequest.params = { id: 'prod123' };

      const mockProduct = {
        _id: 'prod123',
        name: 'Test Product',
        price: 100,
      };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.findOne as jest.Mock).mockResolvedValue(mockProduct);

      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: mockProduct,
        fromCache: false,
      });
    });

    it('should return cached product when available', async () => {
      mockRequest.params = { id: 'prod123' };

      const cachedProduct = { _id: 'prod123', name: 'Cached Product' };

      (CacheService.get as jest.Mock).mockResolvedValue(cachedProduct);

      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        data: cachedProduct,
        fromCache: true,
      });
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (CacheService.get as jest.Mock).mockResolvedValue(null);
      (Product.findOne as jest.Mock).mockResolvedValue(null);

      await productController.getProductById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found',
      });
    });
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'New Product',
      description: 'Product description',
      price: 99.99,
      category: 'Electronics',
      stock: 100,
      sellerId: 'seller123',
    };

    it('should create a new product', async () => {
      mockRequest.body = validProductData;

      const mockSavedProduct = {
        ...validProductData,
        _id: 'prod123',
        save: jest.fn().mockResolvedValue(true),
      };

      (Product as unknown as jest.Mock).mockImplementation(() => mockSavedProduct);

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(CacheService.deletePattern).toHaveBeenCalledWith('products:*');
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: { product: mockSavedProduct },
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { name: '' }; // Invalid data

      const mockProduct = {
        save: jest.fn().mockRejectedValue(new Error('Validation error')),
      };

      (Product as unknown as jest.Mock).mockImplementation(() => mockProduct);

      await productController.createProduct(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      mockRequest.params = { id: 'prod123' };
      mockRequest.body = { price: 149.99 };

      const mockUpdatedProduct = {
        _id: 'prod123',
        name: 'Product',
        price: 149.99,
      };

      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      expect(CacheService.delete).toHaveBeenCalled();
      expect(CacheService.deletePattern).toHaveBeenCalledWith('products:*');
      expect(responseStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { price: 149.99 };

      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await productController.updateProduct(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product (soft delete)', async () => {
      mockRequest.params = { id: 'prod123' };

      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: 'prod123',
        isActive: false,
      });

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'prod123',
        { isActive: false },
        { new: true }
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully',
      });
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { id: 'nonexistent' };

      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await productController.deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });
});
