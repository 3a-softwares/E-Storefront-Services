"use strict";
/**
 * List Products Use Case Tests - TDD Style
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ListProductsUseCase_1 = require("../../../src/domain/usecases/ListProductsUseCase");
const Product_1 = require("../../../src/domain/entities/Product");
describe('ListProductsUseCase', () => {
    let useCase;
    let mockRepository;
    const mockProducts = [
        Product_1.Product.fromPersistence({
            id: 'prod1',
            name: 'Product 1',
            description: 'Description for product 1',
            price: 29.99,
            category: 'Electronics',
            stock: 50,
            sellerId: 'seller1',
            isActive: true,
            tags: ['tag1'],
            rating: 4.5,
            reviewCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        Product_1.Product.fromPersistence({
            id: 'prod2',
            name: 'Product 2',
            description: 'Description for product 2',
            price: 49.99,
            category: 'Electronics',
            stock: 30,
            sellerId: 'seller2',
            isActive: true,
            tags: ['tag2'],
            rating: 4.0,
            reviewCount: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
    ];
    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            findBySellerId: jest.fn(),
            findByCategory: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            hardDelete: jest.fn(),
            count: jest.fn(),
            exists: jest.fn(),
            bulkUpdate: jest.fn(),
            findFeatured: jest.fn(),
            search: jest.fn(),
        };
        useCase = new ListProductsUseCase_1.ListProductsUseCase(mockRepository);
    });
    describe('execute()', () => {
        it('should return paginated products', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 2,
                    pages: 1,
                },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {};
            const result = await useCase.execute(input);
            expect(result.success).toBe(true);
            expect(result.data?.products).toHaveLength(2);
            expect(result.data?.pagination.page).toBe(1);
            expect(result.data?.pagination.total).toBe(2);
        });
        it('should use default pagination values', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: { page: 1, limit: 20, total: 2, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            await useCase.execute({});
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                isActive: true, // Default to active products
            }), expect.objectContaining({
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }));
        });
        it('should apply custom pagination', async () => {
            const paginatedResult = {
                items: [],
                pagination: { page: 3, limit: 50, total: 100, pages: 2 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                pagination: {
                    page: 3,
                    limit: 50,
                    sortBy: 'price',
                    sortOrder: 'asc',
                },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                page: 3,
                limit: 50,
                sortBy: 'price',
                sortOrder: 'asc',
            }));
        });
        it('should limit maximum items per page to 100', async () => {
            const paginatedResult = {
                items: [],
                pagination: { page: 1, limit: 100, total: 0, pages: 0 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                pagination: { limit: 500 }, // Exceed limit
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
                limit: 100, // Capped at 100
            }));
        });
        it('should apply search filter', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: { page: 1, limit: 20, total: 2, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                filters: { search: 'laptop' },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                search: 'laptop',
            }), expect.any(Object));
        });
        it('should apply category filter', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: { page: 1, limit: 20, total: 2, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                filters: { category: 'Electronics' },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                category: 'Electronics',
            }), expect.any(Object));
        });
        it('should apply price range filter', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: { page: 1, limit: 20, total: 2, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                filters: { minPrice: 20, maxPrice: 100 },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                minPrice: 20,
                maxPrice: 100,
            }), expect.any(Object));
        });
        it('should apply seller filter', async () => {
            const paginatedResult = {
                items: [mockProducts[0]],
                pagination: { page: 1, limit: 20, total: 1, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                filters: { sellerId: 'seller1' },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                sellerId: 'seller1',
            }), expect.any(Object));
        });
        it('should return error for invalid page number', async () => {
            const input = {
                pagination: { page: 0 },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_INPUT');
            expect(result.error?.field).toBe('page');
        });
        it('should return error for invalid limit', async () => {
            const input = {
                pagination: { limit: 0 },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_INPUT');
            expect(result.error?.field).toBe('limit');
        });
        it('should return empty array when no products found', async () => {
            const paginatedResult = {
                items: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 0 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const result = await useCase.execute({});
            expect(result.success).toBe(true);
            expect(result.data?.products).toEqual([]);
            expect(result.data?.pagination.total).toBe(0);
        });
        it('should handle repository errors', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('Database error'));
            await expect(useCase.execute({})).rejects.toThrow('Database error');
        });
        it('should include inactive products when specified', async () => {
            const paginatedResult = {
                items: mockProducts,
                pagination: { page: 1, limit: 20, total: 2, pages: 1 },
            };
            mockRepository.findAll.mockResolvedValue(paginatedResult);
            const input = {
                filters: { isActive: false },
            };
            await useCase.execute(input);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                isActive: false,
            }), expect.any(Object));
        });
    });
});
//# sourceMappingURL=ListProductsUseCase.test.js.map