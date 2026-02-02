/**
 * Create Product Use Case Tests - TDD Style
 */

import {
  CreateProductUseCase,
  CreateProductInput,
} from '../../../src/domain/usecases/CreateProductUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { Product } from '../../../src/domain/entities/Product';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;

  const validInput: CreateProductInput = {
    name: 'Test Product',
    description: 'This is a test product description that is long enough',
    price: 99.99,
    category: 'Electronics',
    stock: 100,
    imageUrl: 'https://example.com/image.jpg',
    sellerId: 'seller123',
    tags: ['test', 'product'],
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

    useCase = new CreateProductUseCase(mockRepository);
  });

  describe('execute()', () => {
    it('should create a product successfully with valid input', async () => {
      const savedProduct = Product.fromPersistence({
        id: 'prod123',
        ...validInput,
        isActive: true,
        tags: validInput.tags || [],
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.save.mockResolvedValue(savedProduct);

      const result = await useCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.product.id).toBe('prod123');
      expect(result.data?.product.name).toBe('Test Product');
      expect(result.data?.product.price).toBe(99.99);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should return error for invalid product name', async () => {
      const result = await useCase.execute({
        ...validInput,
        name: 'AB', // Too short
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.field).toBe('name');
      expect(result.error?.message).toContain('at least 3 characters');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should return error for invalid description', async () => {
      const result = await useCase.execute({
        ...validInput,
        description: 'Short', // Too short
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.field).toBe('description');
    });

    it('should return error for negative price', async () => {
      const result = await useCase.execute({
        ...validInput,
        price: -10,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.field).toBe('price');
    });

    it('should return error for negative stock', async () => {
      const result = await useCase.execute({
        ...validInput,
        stock: -5,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.field).toBe('stock');
    });

    it('should return error for empty sellerId', async () => {
      const result = await useCase.execute({
        ...validInput,
        sellerId: '',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.field).toBe('sellerId');
    });

    it('should create product without optional fields', async () => {
      const inputWithoutOptional: CreateProductInput = {
        name: 'Basic Product',
        description: 'A basic product without optional fields',
        price: 50,
        category: 'General',
        stock: 10,
        sellerId: 'seller456',
      };

      const savedProduct = Product.fromPersistence({
        id: 'prod456',
        ...inputWithoutOptional,
        isActive: true,
        tags: [],
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRepository.save.mockResolvedValue(savedProduct);

      const result = await useCase.execute(inputWithoutOptional);

      expect(result.success).toBe(true);
      expect(result.data?.product.tags).toEqual([]);
      expect(result.data?.product.imageUrl).toBeUndefined();
    });

    it('should handle repository save errors', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(validInput)).rejects.toThrow('Database error');
    });
  });
});
