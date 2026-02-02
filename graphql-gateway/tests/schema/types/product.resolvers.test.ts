import { productResolvers } from '../../../src/schema/types/product/resolvers';
import { productClient, authClient } from '../../../src/clients/serviceClients';
import { GraphQLError } from 'graphql';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  productClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  authClient: {
    get: jest.fn(),
  },
  addAuthHeader: jest.fn((token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe('Product Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.products', () => {
    it('should return paginated products', async () => {
      const mockProducts = {
        data: {
          data: {
            products: [
              { _id: '1', name: 'Product 1', price: 100 },
              { _id: '2', name: 'Product 2', price: 200 },
            ],
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      };

      (productClient.get as jest.Mock).mockResolvedValue(mockProducts);

      const result = await productResolvers.Query.products(
        null,
        { page: 1, limit: 10 },
        mockContext
      );

      expect(result).toEqual(mockProducts.data.data);
      expect(productClient.get).toHaveBeenCalledWith('/api/products', {
        params: expect.objectContaining({ page: 1, limit: 10 }),
      });
    });

    it('should filter products by search term', async () => {
      const mockProducts = {
        data: {
          data: {
            products: [{ _id: '1', name: 'Test Product', price: 100 }],
            pagination: { page: 1, limit: 10, total: 1, pages: 1 },
          },
        },
      };

      (productClient.get as jest.Mock).mockResolvedValue(mockProducts);

      await productResolvers.Query.products(
        null,
        { search: 'Test' },
        mockContext
      );

      expect(productClient.get).toHaveBeenCalledWith('/api/products', {
        params: expect.objectContaining({ search: 'Test' }),
      });
    });

    it('should filter products by category', async () => {
      (productClient.get as jest.Mock).mockResolvedValue({ data: { data: { products: [] } } });

      await productResolvers.Query.products(
        null,
        { category: 'electronics' },
        mockContext
      );

      expect(productClient.get).toHaveBeenCalledWith('/api/products', {
        params: expect.objectContaining({ category: 'electronics' }),
      });
    });

    it('should filter products by price range', async () => {
      (productClient.get as jest.Mock).mockResolvedValue({ data: { data: { products: [] } } });

      await productResolvers.Query.products(
        null,
        { minPrice: 100, maxPrice: 500 },
        mockContext
      );

      expect(productClient.get).toHaveBeenCalledWith('/api/products', {
        params: expect.objectContaining({ minPrice: 100, maxPrice: 500 }),
      });
    });

    it('should sort featured products by reviewCount descending', async () => {
      (productClient.get as jest.Mock).mockResolvedValue({ data: { data: { products: [] } } });

      await productResolvers.Query.products(
        null,
        { featured: true },
        mockContext
      );

      expect(productClient.get).toHaveBeenCalledWith('/api/products', {
        params: expect.objectContaining({ sortBy: 'reviewCount', sortOrder: 'desc' }),
      });
    });
  });

  describe('Query.product', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        data: {
          data: { _id: '1', name: 'Product 1', price: 100 },
        },
      };

      (productClient.get as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productResolvers.Query.product(null, { id: '1' }, mockContext);

      expect(result).toEqual(mockProduct.data.data);
      expect(productClient.get).toHaveBeenCalledWith('/api/products/1');
    });
  });

  describe('Query.productsBySeller', () => {
    it('should return products by seller ID', async () => {
      const mockProducts = {
        data: {
          data: {
            products: [{ _id: '1', name: 'Product 1', sellerId: 'seller123' }],
          },
        },
      };

      (productClient.get as jest.Mock).mockResolvedValue(mockProducts);

      const result = await productResolvers.Query.productsBySeller(
        null,
        { sellerId: 'seller123' },
        mockContext
      );

      expect(result).toEqual(mockProducts.data.data.products);
    });

    it('should return empty array when no products found', async () => {
      (productClient.get as jest.Mock).mockResolvedValue({ data: { data: {} } });

      const result = await productResolvers.Query.productsBySeller(
        null,
        { sellerId: 'seller123' },
        mockContext
      );

      expect(result).toEqual([]);
    });
  });

  describe('Product field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'product123', name: 'Test' };
      expect(productResolvers.Product.id(parent)).toBe('product123');
    });

    it('should resolve id from id field', () => {
      const parent = { id: 'product456', name: 'Test' };
      expect(productResolvers.Product.id(parent)).toBe('product456');
    });

    it('should resolve seller from sellerId', async () => {
      const parent = { _id: 'product123', sellerId: 'seller123' };
      const mockUser = {
        data: {
          data: {
            user: { _id: 'seller123', name: 'Seller Name', email: 'seller@test.com' },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);

      const result = await productResolvers.Product.seller(parent);

      expect(result).toEqual({
        id: 'seller123',
        name: 'Seller Name',
        email: 'seller@test.com',
      });
    });

    it('should return null seller when no sellerId', async () => {
      const parent = { _id: 'product123' };
      const result = await productResolvers.Product.seller(parent);
      expect(result).toBeNull();
    });

    it('should return minimal seller info when auth fails', async () => {
      const parent = { _id: 'product123', sellerId: 'seller123' };
      (authClient.get as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const result = await productResolvers.Product.seller(parent);

      expect(result).toEqual({
        id: 'seller123',
        name: 'Seller',
        email: null,
      });
    });
  });

  describe('Mutation.createProduct', () => {
    it('should create product with valid token', async () => {
      const input = { name: 'New Product', price: 100 };
      const mockProduct = {
        data: {
          data: { product: { _id: 'new123', ...input } },
        },
      };

      (productClient.post as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productResolvers.Mutation.createProduct(
        null,
        { input },
        mockContext
      );

      expect(result).toEqual(mockProduct.data.data.product);
      expect(productClient.post).toHaveBeenCalledWith(
        '/api/products',
        input,
        expect.any(Object)
      );
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        productResolvers.Mutation.createProduct(null, { input: {} }, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.updateProduct', () => {
    it('should update product with valid token', async () => {
      const input = { name: 'Updated Product' };
      const mockProduct = {
        data: {
          data: { product: { _id: 'product123', ...input } },
        },
      };

      (productClient.put as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productResolvers.Mutation.updateProduct(
        null,
        { id: 'product123', input },
        mockContext
      );

      expect(result).toEqual(mockProduct.data.data.product);
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        productResolvers.Mutation.updateProduct(null, { id: '123', input: {} }, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Mutation.deleteProduct', () => {
    it('should delete product and return true', async () => {
      (productClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await productResolvers.Mutation.deleteProduct(
        null,
        { id: 'product123' },
        mockContext
      );

      expect(result).toBe(true);
      expect(productClient.delete).toHaveBeenCalledWith('/api/products/product123', expect.any(Object));
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        productResolvers.Mutation.deleteProduct(null, { id: '123' }, mockContextNoToken)
      ).rejects.toThrow(GraphQLError);
    });
  });
});
