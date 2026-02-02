/**
 * Get Product Use Case Tests - TDD Style
 */

import { GetProductUseCase, GetProductInput } from '../../../src/domain/usecases/GetProductUseCase';
import { IProductRepository } from '../../../src/domain/repositories/IProductRepository';
import { Product } from '../../../src/domain/entities/Product';

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;

  const mockProductData = {
    id: 'prod123',
    name: 'Test Product',
    description: 'A test product description that is long enough',
    price: 99.99,
    category: 'Electronics',
    stock: 100,
    imageUrl: 'https://example.com/image.jpg',
    sellerId: 'seller123',
    isActive: true,
    tags: ['test'],
    rating: 4.5,
    reviewCount: 10,
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

    useCase = new GetProductUseCase(mockRepository);
  });

  describe('execute()', () => {
    it('should return product when found', async () => {
      const product = Product.fromPersistence(mockProductData);
      mockRepository.findById.mockResolvedValue(product);

      const input: GetProductInput = { id: 'prod123' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.product.id).toBe('prod123');
      expect(result.data?.product.name).toBe('Test Product');
      expect(mockRepository.findById).toHaveBeenCalledWith('prod123');
    });

    it('should return error when product not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const input: GetProductInput = { id: 'nonexistent' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
      expect(result.error?.message).toBe('Product not found');
    });

    it('should return error for inactive product', async () => {
      const inactiveProduct = Product.fromPersistence({
        ...mockProductData,
        isActive: false,
      });
      mockRepository.findById.mockResolvedValue(inactiveProduct);

      const input: GetProductInput = { id: 'prod123' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should return error for empty product ID', async () => {
      const input: GetProductInput = { id: '' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
      expect(result.error?.field).toBe('id');
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should return error for whitespace-only product ID', async () => {
      const input: GetProductInput = { id: '   ' };
      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_INPUT');
    });

    it('should return complete product data', async () => {
      const product = Product.fromPersistence(mockProductData);
      mockRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute({ id: 'prod123' });

      expect(result.success).toBe(true);
      expect(result.data?.product).toMatchObject({
        id: 'prod123',
        name: 'Test Product',
        description: expect.any(String),
        price: 99.99,
        category: 'Electronics',
        stock: 100,
        sellerId: 'seller123',
        isActive: true,
        tags: ['test'],
        rating: 4.5,
        reviewCount: 10,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle repository errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(useCase.execute({ id: 'prod123' })).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});
