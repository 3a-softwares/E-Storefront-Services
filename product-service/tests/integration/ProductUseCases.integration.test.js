"use strict";
/**
 * Integration Tests - Testing Use Cases with Mock Repository
 * This demonstrates TDD integration testing
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MockProductRepository_1 = require("../__mocks__/MockProductRepository");
const CreateProductUseCase_1 = require("../../src/domain/usecases/CreateProductUseCase");
const GetProductUseCase_1 = require("../../src/domain/usecases/GetProductUseCase");
const UpdateProductUseCase_1 = require("../../src/domain/usecases/UpdateProductUseCase");
const DeleteProductUseCase_1 = require("../../src/domain/usecases/DeleteProductUseCase");
const ListProductsUseCase_1 = require("../../src/domain/usecases/ListProductsUseCase");
describe('Product Use Cases Integration Tests', () => {
    let repository;
    let createUseCase;
    let getUseCase;
    let updateUseCase;
    let deleteUseCase;
    let listUseCase;
    beforeEach(() => {
        repository = new MockProductRepository_1.MockProductRepository();
        createUseCase = new CreateProductUseCase_1.CreateProductUseCase(repository);
        getUseCase = new GetProductUseCase_1.GetProductUseCase(repository);
        updateUseCase = new UpdateProductUseCase_1.UpdateProductUseCase(repository);
        deleteUseCase = new DeleteProductUseCase_1.DeleteProductUseCase(repository);
        listUseCase = new ListProductsUseCase_1.ListProductsUseCase(repository);
    });
    describe('Full Product Lifecycle', () => {
        it('should create, read, update, and delete a product', async () => {
            // CREATE
            const createResult = await createUseCase.execute({
                name: 'Test Laptop',
                description: 'A powerful laptop for developers',
                price: 1299.99,
                category: 'Electronics',
                stock: 50,
                sellerId: 'seller1',
                tags: ['laptop', 'electronics'],
            });
            expect(createResult.success).toBe(true);
            const productId = createResult.data.product.id;
            // READ
            const getResult = await getUseCase.execute({ id: productId });
            expect(getResult.success).toBe(true);
            expect(getResult.data?.product.name).toBe('Test Laptop');
            // UPDATE
            const updateResult = await updateUseCase.execute({
                id: productId,
                data: {
                    price: 1199.99,
                    stock: 45,
                },
            });
            expect(updateResult.success).toBe(true);
            expect(updateResult.data?.product.price).toBe(1199.99);
            expect(updateResult.data?.product.stock).toBe(45);
            // DELETE (soft)
            const deleteResult = await deleteUseCase.execute({ id: productId });
            expect(deleteResult.success).toBe(true);
            // Verify product is not accessible after deletion
            const getAfterDelete = await getUseCase.execute({ id: productId });
            expect(getAfterDelete.success).toBe(false);
            expect(getAfterDelete.error?.code).toBe('NOT_FOUND');
        });
    });
    describe('Product Listing and Filtering', () => {
        beforeEach(async () => {
            // Seed test data
            await createUseCase.execute({
                name: 'iPhone 15',
                description: 'Latest Apple smartphone',
                price: 999,
                category: 'Electronics',
                stock: 100,
                sellerId: 'apple',
                tags: ['phone', 'apple'],
            });
            await createUseCase.execute({
                name: 'Samsung Galaxy',
                description: 'Premium Android phone',
                price: 899,
                category: 'Electronics',
                stock: 80,
                sellerId: 'samsung',
                tags: ['phone', 'android'],
            });
            await createUseCase.execute({
                name: 'MacBook Pro',
                description: 'Professional laptop for developers',
                price: 2499,
                category: 'Computers',
                stock: 30,
                sellerId: 'apple',
                tags: ['laptop', 'apple'],
            });
            await createUseCase.execute({
                name: 'Budget Phone',
                description: 'Affordable smartphone option',
                price: 199,
                category: 'Electronics',
                stock: 200,
                sellerId: 'budget-brand',
                tags: ['phone', 'budget'],
            });
        });
        it('should list all products', async () => {
            const result = await listUseCase.execute({});
            expect(result.success).toBe(true);
            expect(result.data?.products).toHaveLength(4);
        });
        it('should filter by category', async () => {
            const result = await listUseCase.execute({
                filters: { category: 'Electronics' },
            });
            expect(result.success).toBe(true);
            expect(result.data?.products).toHaveLength(3);
            result.data?.products.forEach((p) => {
                expect(p.category.toLowerCase()).toBe('electronics');
            });
        });
        it('should filter by seller', async () => {
            const result = await listUseCase.execute({
                filters: { sellerId: 'apple' },
            });
            expect(result.success).toBe(true);
            expect(result.data?.products).toHaveLength(2);
        });
        it('should filter by price range', async () => {
            const result = await listUseCase.execute({
                filters: { minPrice: 500, maxPrice: 1000 },
            });
            expect(result.success).toBe(true);
            expect(result.data?.products.length).toBeGreaterThan(0);
            result.data?.products.forEach((p) => {
                expect(p.price).toBeGreaterThanOrEqual(500);
                expect(p.price).toBeLessThanOrEqual(1000);
            });
        });
        it('should search by name', async () => {
            const result = await listUseCase.execute({
                filters: { search: 'phone' },
            });
            expect(result.success).toBe(true);
            expect(result.data?.products.length).toBeGreaterThan(0);
        });
        it('should paginate results', async () => {
            const page1 = await listUseCase.execute({
                pagination: { page: 1, limit: 2 },
            });
            const page2 = await listUseCase.execute({
                pagination: { page: 2, limit: 2 },
            });
            expect(page1.data?.products).toHaveLength(2);
            expect(page2.data?.products).toHaveLength(2);
            expect(page1.data?.pagination.page).toBe(1);
            expect(page2.data?.pagination.page).toBe(2);
        });
    });
    describe('Authorization Scenarios', () => {
        let productId;
        beforeEach(async () => {
            const result = await createUseCase.execute({
                name: 'Seller Product',
                description: 'A product owned by a specific seller',
                price: 100,
                category: 'General',
                stock: 10,
                sellerId: 'seller123',
            });
            productId = result.data.product.id;
        });
        it('should allow owner to update product', async () => {
            const result = await updateUseCase.execute({
                id: productId,
                sellerId: 'seller123',
                data: { price: 90 },
            });
            expect(result.success).toBe(true);
        });
        it('should reject update from non-owner', async () => {
            const result = await updateUseCase.execute({
                id: productId,
                sellerId: 'different-seller',
                data: { price: 90 },
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('UNAUTHORIZED');
        });
        it('should allow owner to delete product', async () => {
            const result = await deleteUseCase.execute({
                id: productId,
                sellerId: 'seller123',
            });
            expect(result.success).toBe(true);
        });
        it('should reject delete from non-owner', async () => {
            const result = await deleteUseCase.execute({
                id: productId,
                sellerId: 'different-seller',
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('UNAUTHORIZED');
        });
    });
    describe('Edge Cases', () => {
        it('should handle getting non-existent product', async () => {
            const result = await getUseCase.execute({ id: 'non-existent-id' });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
        it('should handle updating non-existent product', async () => {
            const result = await updateUseCase.execute({
                id: 'non-existent-id',
                data: { price: 100 },
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
        it('should handle deleting non-existent product', async () => {
            const result = await deleteUseCase.execute({ id: 'non-existent-id' });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
        it('should handle empty search results', async () => {
            const result = await listUseCase.execute({
                filters: { search: 'xyz-non-existent-product-xyz' },
            });
            expect(result.success).toBe(true);
            expect(result.data?.products).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=ProductUseCases.integration.test.js.map