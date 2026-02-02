/**
 * Delete Product Use Case Tests - TDD Style
 */

import {
  DeleteProductUseCase,
  DeleteProductInput,
} from '../../../src/domain/usecases/DeleteProductUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { Product } from '../../../src/domain/entities/Product';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;

  const existingProductData = {
    id: 'prod123',
    name: 'Test Product',
    description: 'A test product description that is long enough',
    price: 99.99,
    category: 'Electronics',
    stock: 100,
    sellerId: 'seller123',
    isActive: true,
    tags: ['test'],
    rating: 4.0,
    reviewCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
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

    useCase = new DeleteProductUseCase(mockRepository);
  });

  describe('execute()', () => {
    it('should soft delete product successfully', async () => {
      const existingProduct = Product.fromPersistence(existingProductData);
      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.delete.mockResolvedValue(true);

      const input: DeleteProductInput = { id: 'prod123' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.deleted).toBe(true);
      expect(result.data?.message).toBe('Product deleted successfully');
      expect(mockRepository.delete).toHaveBeenCalledWith('prod123');
      expect(mockRepository.hardDelete).not.toHaveBeenCalled();
    });

    it('should hard delete product when specified', async () => {
      const existingProduct = Product.fromPersistence(existingProductData);
      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.hardDelete.mockResolvedValue(true);

      const input: DeleteProductInput = { id: 'prod123', hardDelete: true };
      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Product permanently deleted');
      expect(mockRepository.hardDelete).toHaveBeenCalledWith('prod123');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should return error when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const input: DeleteProductInput = { id: 'nonexistent' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should return error for empty product ID', async () => {
      const input: DeleteProductInput = { id: '' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.field).toBe('id');
    });

    it('should authorize delete based on sellerId', async () => {
      const existingProduct = Product.fromPersistence(existingProductData);
      mockRepository.findById.mockResolvedValue(existingProduct);

      const input: DeleteProductInput = {
        id: 'prod123',
        sellerId: 'differentSeller', // Wrong seller
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNAUTHORIZED');
    });

    it('should allow delete when sellerId matches', async () => {
      const existingProduct = Product.fromPersistence(existingProductData);
      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.delete.mockResolvedValue(true);

      const input: DeleteProductInput = {
        id: 'prod123',
        sellerId: 'seller123', // Correct seller
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
    });

    it('should return error when delete operation fails', async () => {
      const existingProduct = Product.fromPersistence(existingProductData);
      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.delete.mockResolvedValue(false);

      const input: DeleteProductInput = { id: 'prod123' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DELETE_FAILED');
    });
  });
});
