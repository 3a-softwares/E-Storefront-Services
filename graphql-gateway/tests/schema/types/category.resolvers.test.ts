import axios from 'axios';
import { categoryResolvers } from '../../../src/schema/types/category/resolvers';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Category Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.categories', () => {
    it('should return categories with proper structure', async () => {
      const mockCategories = {
        data: {
          success: true,
          message: 'Categories fetched',
          data: {
            categories: [
              { _id: '1', name: 'Electronics', slug: 'electronics', isActive: true },
              { _id: '2', name: 'Clothing', slug: 'clothing', isActive: true },
            ],
            count: 2,
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockCategories);

      const result = await categoryResolvers.Query.categories(null, {});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should filter by search', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: { categories: [], count: 0 },
        },
      });

      await categoryResolvers.Query.categories(null, { filter: { search: 'elec' } });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search=elec')
      );
    });

    it('should filter by isActive', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          data: { categories: [], count: 0 },
        },
      });

      await categoryResolvers.Query.categories(null, { filter: { isActive: true } });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('isActive=true')
      );
    });

    it('should return empty data on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Service unavailable'));

      const result = await categoryResolvers.Query.categories(null, {});

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('Query.category', () => {
    it('should return category by ID', async () => {
      const mockCategory = {
        data: {
          data: { _id: '1', name: 'Electronics', slug: 'electronics' },
        },
      };

      mockedAxios.get.mockResolvedValue(mockCategory);

      const result = await categoryResolvers.Query.category(null, { id: '1' });

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Not found'));

      const result = await categoryResolvers.Query.category(null, { id: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('Category field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'cat123' };
      expect(categoryResolvers.Category.id(parent)).toBe('cat123');
    });

    it('should resolve id from id field', () => {
      const parent = { id: 'cat456' };
      expect(categoryResolvers.Category.id(parent)).toBe('cat456');
    });

    it('should resolve createdAt', () => {
      const date = new Date('2024-01-01').toISOString();
      const parent = { createdAt: date };
      expect(categoryResolvers.Category.createdAt(parent)).toBe(date);
    });

    it('should return current date for missing createdAt', () => {
      const parent = {};
      const result = categoryResolvers.Category.createdAt(parent);
      expect(new Date(result)).toBeInstanceOf(Date);
    });

    it('should resolve updatedAt', () => {
      const date = new Date('2024-01-02').toISOString();
      const parent = { updatedAt: date };
      expect(categoryResolvers.Category.updatedAt(parent)).toBe(date);
    });
  });

  describe('Mutation.createCategory', () => {
    it('should create category successfully', async () => {
      const input = { name: 'New Category', slug: 'new-category' };
      const mockResponse = {
        data: {
          success: true,
          data: { _id: 'newcat123', ...input },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await categoryResolvers.Mutation.createCategory(null, { input });

      expect(result).toEqual(mockResponse.data);
    });

    it('should return error on failure', async () => {
      mockedAxios.post.mockRejectedValue({
        response: { data: { message: 'Category already exists' } },
      });

      const result = await categoryResolvers.Mutation.createCategory(
        null,
        { input: { name: 'Existing' } }
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Category already exists');
    });
  });

  describe('Mutation.updateCategory', () => {
    it('should update category successfully', async () => {
      const input = { name: 'Updated Category' };
      const mockResponse = {
        data: {
          success: true,
          data: { _id: 'cat123', name: 'Updated Category' },
        },
      };

      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await categoryResolvers.Mutation.updateCategory(
        null,
        { id: 'cat123', input }
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should return error on failure', async () => {
      mockedAxios.put.mockRejectedValue({
        response: { data: { message: 'Category not found' } },
      });

      const result = await categoryResolvers.Mutation.updateCategory(
        null,
        { id: 'nonexistent', input: {} }
      );

      expect(result.success).toBe(false);
    });
  });
});
