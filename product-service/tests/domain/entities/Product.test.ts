/**
 * Product Entity Tests - TDD Style
 * Tests written first to define expected behavior
 */

import {
  Product,
  CreateProductDTO,
  ProductValidationError,
} from '../../../src/domain/entities/Product';

describe('Product Entity', () => {
  const validProductDTO: CreateProductDTO = {
    name: 'Test Product',
    description: 'This is a test product description that is long enough',
    price: 99.99,
    category: 'Electronics',
    stock: 100,
    imageUrl: 'https://example.com/image.jpg',
    sellerId: 'seller123',
    tags: ['test', 'product'],
  };

  describe('Product.create()', () => {
    it('should create a valid product with all required fields', () => {
      const product = Product.create(validProductDTO);

      expect(product.name).toBe('Test Product');
      expect(product.description).toBe('This is a test product description that is long enough');
      expect(product.price).toBe(99.99);
      expect(product.category).toBe('Electronics');
      expect(product.stock).toBe(100);
      expect(product.imageUrl).toBe('https://example.com/image.jpg');
      expect(product.sellerId).toBe('seller123');
      expect(product.tags).toEqual(['test', 'product']);
    });

    it('should set default values for optional fields', () => {
      const product = Product.create({
        name: 'Test Product',
        description: 'This is a test product description that is long enough',
        price: 99.99,
        category: 'Electronics',
        stock: 100,
        sellerId: 'seller123',
      });

      expect(product.isActive).toBe(true);
      expect(product.tags).toEqual([]);
      expect(product.rating).toBe(0);
      expect(product.reviewCount).toBe(0);
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim whitespace from string fields', () => {
      const product = Product.create({
        ...validProductDTO,
        name: '  Trimmed Name  ',
        description: '  Trimmed description that is long enough  ',
        category: '  Trimmed Category  ',
      });

      expect(product.name).toBe('Trimmed Name');
      expect(product.description).toBe('Trimmed description that is long enough');
      expect(product.category).toBe('Trimmed Category');
    });

    describe('Name validation', () => {
      it('should throw error for empty name', () => {
        expect(() => Product.create({ ...validProductDTO, name: '' })).toThrow(
          ProductValidationError
        );
      });

      it('should throw error for name shorter than 3 characters', () => {
        expect(() => Product.create({ ...validProductDTO, name: 'AB' })).toThrow(
          'Product name must be at least 3 characters'
        );
      });

      it('should throw error for name longer than 200 characters', () => {
        const longName = 'A'.repeat(201);
        expect(() => Product.create({ ...validProductDTO, name: longName })).toThrow(
          'Product name cannot exceed 200 characters'
        );
      });

      it('should throw error with correct field identifier', () => {
        try {
          Product.create({ ...validProductDTO, name: '' });
        } catch (error: any) {
          expect(error.field).toBe('name');
        }
      });
    });

    describe('Description validation', () => {
      it('should throw error for empty description', () => {
        expect(() => Product.create({ ...validProductDTO, description: '' })).toThrow(
          ProductValidationError
        );
      });

      it('should throw error for description shorter than 10 characters', () => {
        expect(() => Product.create({ ...validProductDTO, description: 'Short' })).toThrow(
          'Description must be at least 10 characters'
        );
      });

      it('should throw error for description longer than 2000 characters', () => {
        const longDesc = 'A'.repeat(2001);
        expect(() => Product.create({ ...validProductDTO, description: longDesc })).toThrow(
          'Description cannot exceed 2000 characters'
        );
      });
    });

    describe('Price validation', () => {
      it('should throw error for negative price', () => {
        expect(() => Product.create({ ...validProductDTO, price: -1 })).toThrow(
          'Price cannot be negative'
        );
      });

      it('should throw error for NaN price', () => {
        expect(() => Product.create({ ...validProductDTO, price: NaN })).toThrow(
          'Price must be a valid number'
        );
      });

      it('should allow zero price (free products)', () => {
        const product = Product.create({ ...validProductDTO, price: 0 });
        expect(product.price).toBe(0);
      });

      it('should allow decimal prices', () => {
        const product = Product.create({ ...validProductDTO, price: 99.99 });
        expect(product.price).toBe(99.99);
      });
    });

    describe('Category validation', () => {
      it('should throw error for empty category', () => {
        expect(() => Product.create({ ...validProductDTO, category: '' })).toThrow(
          ProductValidationError
        );
      });

      it('should throw error for category shorter than 2 characters', () => {
        expect(() => Product.create({ ...validProductDTO, category: 'A' })).toThrow(
          'Category must be at least 2 characters'
        );
      });

      it('should throw error for category longer than 100 characters', () => {
        const longCategory = 'A'.repeat(101);
        expect(() => Product.create({ ...validProductDTO, category: longCategory })).toThrow(
          'Category cannot exceed 100 characters'
        );
      });
    });

    describe('Stock validation', () => {
      it('should throw error for negative stock', () => {
        expect(() => Product.create({ ...validProductDTO, stock: -1 })).toThrow(
          'Stock cannot be negative'
        );
      });

      it('should throw error for non-integer stock', () => {
        expect(() => Product.create({ ...validProductDTO, stock: 10.5 })).toThrow(
          'Stock must be a whole number'
        );
      });

      it('should allow zero stock', () => {
        const product = Product.create({ ...validProductDTO, stock: 0 });
        expect(product.stock).toBe(0);
      });
    });

    describe('SellerId validation', () => {
      it('should throw error for empty sellerId', () => {
        expect(() => Product.create({ ...validProductDTO, sellerId: '' })).toThrow(
          'Seller ID is required'
        );
      });

      it('should throw error for whitespace-only sellerId', () => {
        expect(() => Product.create({ ...validProductDTO, sellerId: '   ' })).toThrow(
          'Seller ID is required'
        );
      });
    });
  });

  describe('Product.fromPersistence()', () => {
    it('should reconstitute a product from persistence data', () => {
      const persistenceData = {
        id: 'prod123',
        name: 'Persisted Product',
        description: 'A product from the database',
        price: 49.99,
        category: 'Books',
        stock: 50,
        sellerId: 'seller456',
        isActive: true,
        tags: ['book'],
        rating: 4.5,
        reviewCount: 10,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const product = Product.fromPersistence(persistenceData);

      expect(product.id).toBe('prod123');
      expect(product.name).toBe('Persisted Product');
      expect(product.rating).toBe(4.5);
      expect(product.reviewCount).toBe(10);
    });
  });

  describe('Product.update()', () => {
    it('should update product properties', () => {
      const product = Product.create(validProductDTO);
      const updatedProduct = product.update({
        name: 'Updated Product Name',
        price: 149.99,
      });

      expect(updatedProduct.name).toBe('Updated Product Name');
      expect(updatedProduct.price).toBe(149.99);
      expect(updatedProduct.description).toBe(product.description);
    });

    it('should update the updatedAt timestamp', () => {
      const product = Product.create(validProductDTO);
      const originalUpdatedAt = product.updatedAt;

      // Small delay to ensure different timestamp
      const updatedProduct = product.update({ name: 'New Name' });

      expect(updatedProduct.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });

    it('should validate updated fields', () => {
      const product = Product.create(validProductDTO);

      expect(() => product.update({ name: 'AB' })).toThrow(
        'Product name must be at least 3 characters'
      );
    });

    it('should return a new instance (immutability)', () => {
      const product = Product.create(validProductDTO);
      const updatedProduct = product.update({ name: 'New Name' });

      expect(product).not.toBe(updatedProduct);
      expect(product.name).toBe('Test Product');
    });
  });

  describe('Product.deactivate()', () => {
    it('should deactivate an active product', () => {
      const product = Product.create(validProductDTO);
      const deactivatedProduct = product.deactivate();

      expect(deactivatedProduct.isActive).toBe(false);
    });

    it('should return a new instance (immutability)', () => {
      const product = Product.create(validProductDTO);
      const deactivatedProduct = product.deactivate();

      expect(product).not.toBe(deactivatedProduct);
      expect(product.isActive).toBe(true);
    });
  });

  describe('Product.activate()', () => {
    it('should activate an inactive product', () => {
      const product = Product.create(validProductDTO);
      const deactivatedProduct = product.deactivate();
      const reactivatedProduct = deactivatedProduct.activate();

      expect(reactivatedProduct.isActive).toBe(true);
    });
  });

  describe('Stock management', () => {
    describe('updateStock()', () => {
      it('should add stock', () => {
        const product = Product.create(validProductDTO);
        const updatedProduct = product.updateStock(50);

        expect(updatedProduct.stock).toBe(150);
      });

      it('should remove stock', () => {
        const product = Product.create(validProductDTO);
        const updatedProduct = product.updateStock(-30);

        expect(updatedProduct.stock).toBe(70);
      });

      it('should throw error when resulting stock is negative', () => {
        const product = Product.create(validProductDTO);

        expect(() => product.updateStock(-150)).toThrow('Insufficient stock');
      });
    });

    describe('decrementStock()', () => {
      it('should decrease stock by specified amount', () => {
        const product = Product.create(validProductDTO);
        const updatedProduct = product.decrementStock(10);

        expect(updatedProduct.stock).toBe(90);
      });

      it('should throw error when not enough stock', () => {
        const product = Product.create(validProductDTO);

        expect(() => product.decrementStock(101)).toThrow('Insufficient stock');
      });
    });

    describe('incrementStock()', () => {
      it('should increase stock by specified amount', () => {
        const product = Product.create(validProductDTO);
        const updatedProduct = product.incrementStock(50);

        expect(updatedProduct.stock).toBe(150);
      });
    });

    describe('isInStock()', () => {
      it('should return true when stock is greater than 0', () => {
        const product = Product.create(validProductDTO);
        expect(product.isInStock()).toBe(true);
      });

      it('should return false when stock is 0', () => {
        const product = Product.create({ ...validProductDTO, stock: 0 });
        expect(product.isInStock()).toBe(false);
      });
    });

    describe('hasEnoughStock()', () => {
      it('should return true when enough stock available', () => {
        const product = Product.create(validProductDTO);
        expect(product.hasEnoughStock(50)).toBe(true);
      });

      it('should return false when not enough stock', () => {
        const product = Product.create(validProductDTO);
        expect(product.hasEnoughStock(150)).toBe(false);
      });

      it('should return true for exact stock amount', () => {
        const product = Product.create(validProductDTO);
        expect(product.hasEnoughStock(100)).toBe(true);
      });
    });
  });

  describe('Rating management', () => {
    describe('updateRating()', () => {
      it('should update rating and review count', () => {
        const product = Product.create(validProductDTO);
        const updatedProduct = product.updateRating(4.5, 10);

        expect(updatedProduct.rating).toBe(4.5);
        expect(updatedProduct.reviewCount).toBe(10);
      });

      it('should throw error for rating below 0', () => {
        const product = Product.create(validProductDTO);

        expect(() => product.updateRating(-1, 10)).toThrow('Rating must be between 0 and 5');
      });

      it('should throw error for rating above 5', () => {
        const product = Product.create(validProductDTO);

        expect(() => product.updateRating(6, 10)).toThrow('Rating must be between 0 and 5');
      });
    });
  });

  describe('belongsToSeller()', () => {
    it('should return true for matching seller ID', () => {
      const product = Product.create(validProductDTO);
      expect(product.belongsToSeller('seller123')).toBe(true);
    });

    it('should return false for non-matching seller ID', () => {
      const product = Product.create(validProductDTO);
      expect(product.belongsToSeller('differentSeller')).toBe(false);
    });
  });

  describe('Serialization', () => {
    describe('toPersistence()', () => {
      it('should return a plain object with all properties', () => {
        const product = Product.create(validProductDTO);
        const persistence = product.toPersistence();

        expect(persistence.name).toBe('Test Product');
        expect(persistence.price).toBe(99.99);
        expect(persistence.isActive).toBe(true);
        expect(typeof persistence).toBe('object');
      });
    });

    describe('toJSON()', () => {
      it('should return JSON-serializable object', () => {
        const product = Product.create(validProductDTO);
        const json = product.toJSON();

        expect(() => JSON.stringify(json)).not.toThrow();
      });
    });
  });
});
