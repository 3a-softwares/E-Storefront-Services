"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productController = __importStar(require("../../src/controllers/ProductController"));
const Product_1 = __importDefault(require("../../src/models/Product"));
const cache_1 = require("../../src/infrastructure/cache");
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
    let mockRequest;
    let mockResponse;
    let responseJson;
    let responseStatus;
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
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue(mockProducts),
                        }),
                    }),
                }),
            });
            Product_1.default.countDocuments.mockResolvedValue(2);
            await productController.getAllProducts(mockRequest, mockResponse);
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
            cache_1.CacheService.get.mockResolvedValue(cachedData);
            await productController.getAllProducts(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: cachedData,
                fromCache: true,
            });
            expect(Product_1.default.find).not.toHaveBeenCalled();
        });
        it('should filter by search term', async () => {
            mockRequest.query = { search: 'laptop' };
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });
            Product_1.default.countDocuments.mockResolvedValue(0);
            await productController.getAllProducts(mockRequest, mockResponse);
            expect(Product_1.default.find).toHaveBeenCalledWith(expect.objectContaining({
                $or: expect.any(Array),
            }));
        });
        it('should filter by category', async () => {
            mockRequest.query = { category: 'Electronics' };
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });
            Product_1.default.countDocuments.mockResolvedValue(0);
            await productController.getAllProducts(mockRequest, mockResponse);
            expect(Product_1.default.find).toHaveBeenCalledWith(expect.objectContaining({
                category: expect.objectContaining({ $regex: expect.any(RegExp) }),
            }));
        });
        it('should filter by price range', async () => {
            mockRequest.query = { minPrice: '50', maxPrice: '200' };
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });
            Product_1.default.countDocuments.mockResolvedValue(0);
            await productController.getAllProducts(mockRequest, mockResponse);
            expect(Product_1.default.find).toHaveBeenCalledWith(expect.objectContaining({
                price: { $gte: 50, $lte: 200 },
            }));
        });
        it('should filter by sellerId', async () => {
            mockRequest.query = { sellerId: 'seller123' };
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({
                            lean: jest.fn().mockResolvedValue([]),
                        }),
                    }),
                }),
            });
            Product_1.default.countDocuments.mockResolvedValue(0);
            await productController.getAllProducts(mockRequest, mockResponse);
            expect(Product_1.default.find).toHaveBeenCalledWith(expect.objectContaining({
                sellerId: 'seller123',
            }));
        });
        it('should handle errors', async () => {
            cache_1.CacheService.get.mockRejectedValue(new Error('Cache error'));
            await productController.getAllProducts(mockRequest, mockResponse);
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
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.findOne.mockResolvedValue(mockProduct);
            await productController.getProductById(mockRequest, mockResponse);
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
            cache_1.CacheService.get.mockResolvedValue(cachedProduct);
            await productController.getProductById(mockRequest, mockResponse);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                data: cachedProduct,
                fromCache: true,
            });
        });
        it('should return 404 if product not found', async () => {
            mockRequest.params = { id: 'nonexistent' };
            cache_1.CacheService.get.mockResolvedValue(null);
            Product_1.default.findOne.mockResolvedValue(null);
            await productController.getProductById(mockRequest, mockResponse);
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
            Product_1.default.mockImplementation(() => mockSavedProduct);
            await productController.createProduct(mockRequest, mockResponse);
            expect(cache_1.CacheService.deletePattern).toHaveBeenCalledWith('products:*');
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
            Product_1.default.mockImplementation(() => mockProduct);
            await productController.createProduct(mockRequest, mockResponse);
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
            Product_1.default.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);
            await productController.updateProduct(mockRequest, mockResponse);
            expect(cache_1.CacheService.delete).toHaveBeenCalled();
            expect(cache_1.CacheService.deletePattern).toHaveBeenCalledWith('products:*');
            expect(responseStatus).toHaveBeenCalledWith(200);
        });
        it('should return 404 if product not found', async () => {
            mockRequest.params = { id: 'nonexistent' };
            mockRequest.body = { price: 149.99 };
            Product_1.default.findByIdAndUpdate.mockResolvedValue(null);
            await productController.updateProduct(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
        });
    });
    describe('deleteProduct', () => {
        it('should delete a product (soft delete)', async () => {
            mockRequest.params = { id: 'prod123' };
            Product_1.default.findByIdAndUpdate.mockResolvedValue({
                _id: 'prod123',
                isActive: false,
            });
            await productController.deleteProduct(mockRequest, mockResponse);
            expect(Product_1.default.findByIdAndUpdate).toHaveBeenCalledWith('prod123', { isActive: false }, { new: true });
            expect(responseStatus).toHaveBeenCalledWith(200);
            expect(responseJson).toHaveBeenCalledWith({
                success: true,
                message: 'Product deleted successfully',
            });
        });
        it('should return 404 if product not found', async () => {
            mockRequest.params = { id: 'nonexistent' };
            Product_1.default.findByIdAndUpdate.mockResolvedValue(null);
            await productController.deleteProduct(mockRequest, mockResponse);
            expect(responseStatus).toHaveBeenCalledWith(404);
        });
    });
});
//# sourceMappingURL=ProductController.test.js.map