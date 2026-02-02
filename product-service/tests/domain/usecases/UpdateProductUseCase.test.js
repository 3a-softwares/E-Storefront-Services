"use strict";
/**
 * Update Product Use Case Tests - TDD Style
 */
Object.defineProperty(exports, "__esModule", { value: true });
const UpdateProductUseCase_1 = require("../../../src/domain/usecases/UpdateProductUseCase");
const Product_1 = require("../../../src/domain/entities/Product");
describe('UpdateProductUseCase', () => {
    let useCase;
    let mockRepository;
    const existingProductData = {
        id: 'prod123',
        name: 'Original Product',
        description: 'Original description that is long enough',
        price: 99.99,
        category: 'Electronics',
        stock: 100,
        imageUrl: 'https://example.com/original.jpg',
        sellerId: 'seller123',
        isActive: true,
        tags: ['original'],
        rating: 4.0,
        reviewCount: 5,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };
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
        useCase = new UpdateProductUseCase_1.UpdateProductUseCase(mockRepository);
    });
    describe('execute()', () => {
        it('should update product successfully', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const updatedProduct = existingProduct.update({
                name: 'Updated Product',
                price: 149.99,
            });
            mockRepository.update.mockResolvedValue(updatedProduct);
            const input = {
                id: 'prod123',
                data: {
                    name: 'Updated Product',
                    price: 149.99,
                },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(true);
            expect(result.data?.product.name).toBe('Updated Product');
            expect(result.data?.product.price).toBe(149.99);
            expect(mockRepository.update).toHaveBeenCalledWith('prod123', expect.any(Object));
        });
        it('should return error when product not found', async () => {
            mockRepository.findById.mockResolvedValue(null);
            const input = {
                id: 'nonexistent',
                data: { name: 'New Name' },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
        it('should return error for invalid product ID', async () => {
            const input = {
                id: '',
                data: { name: 'New Name' },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_INPUT');
            expect(result.error?.field).toBe('id');
        });
        it('should return error for invalid name update', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const input = {
                id: 'prod123',
                data: { name: 'AB' }, // Too short
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
            expect(result.error?.field).toBe('name');
        });
        it('should authorize update based on sellerId', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const input = {
                id: 'prod123',
                sellerId: 'differentSeller', // Wrong seller
                data: { name: 'New Name' },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('UNAUTHORIZED');
        });
        it('should allow update when sellerId matches', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const updatedProduct = existingProduct.update({ name: 'Updated Name' });
            mockRepository.update.mockResolvedValue(updatedProduct);
            const input = {
                id: 'prod123',
                sellerId: 'seller123', // Correct seller
                data: { name: 'Updated Name' },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(true);
        });
        it('should handle partial updates', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const updatedProduct = existingProduct.update({ price: 79.99 });
            mockRepository.update.mockResolvedValue(updatedProduct);
            const input = {
                id: 'prod123',
                data: { price: 79.99 },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(true);
            expect(result.data?.product.price).toBe(79.99);
            expect(result.data?.product.name).toBe('Original Product'); // Unchanged
        });
        it('should update isActive status', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            const updatedProduct = existingProduct.update({ isActive: false });
            mockRepository.update.mockResolvedValue(updatedProduct);
            const input = {
                id: 'prod123',
                data: { isActive: false },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(true);
            expect(result.data?.product.isActive).toBe(false);
        });
        it('should return error when repository update fails', async () => {
            const existingProduct = Product_1.Product.fromPersistence(existingProductData);
            mockRepository.findById.mockResolvedValue(existingProduct);
            mockRepository.update.mockResolvedValue(null);
            const input = {
                id: 'prod123',
                data: { name: 'New Name' },
            };
            const result = await useCase.execute(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('UPDATE_FAILED');
        });
    });
});
//# sourceMappingURL=UpdateProductUseCase.test.js.map