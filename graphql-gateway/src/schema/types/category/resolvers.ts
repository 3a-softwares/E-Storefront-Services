import axios from 'axios';
import { SERVICE_URLS } from '@3asoftwares/utils';

const CATEGORY_SERVICE_URL = process.env.CATEGORY_SERVICE_URL || SERVICE_URLS.CATEGORY_SERVICE;

// Helper to normalize category data with proper id and timestamps
const normalizeCategory = (category: any) => {
  if (!category) return null;
  return {
    ...category,
    id: category.id || category._id?.toString() || category._id,
    createdAt: category.createdAt || new Date().toISOString(),
    updatedAt: category.updatedAt || new Date().toISOString(),
  };
};

export const categoryResolvers = {
  // Field resolvers for Category type to ensure proper field mapping
  Category: {
    id: (parent: any) => parent.id || parent._id?.toString() || parent._id,
    createdAt: (parent: any) => parent.createdAt || new Date().toISOString(),
    updatedAt: (parent: any) => parent.updatedAt || new Date().toISOString(),
  },

  Query: {
    categories: async (_: any, { filter }: any) => {
      try {
        let url = `${CATEGORY_SERVICE_URL}/api/categories`;
        const params = new URLSearchParams();

        if (filter?.search) {
          params.append('search', filter.search);
        }

        if (filter?.isActive !== undefined) {
          params.append('isActive', filter.isActive);
        }

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await axios.get(url);
        // Extract categories array from nested data structure
        const { success, data, message } = response.data;
        const categories = (data?.categories || []).map(normalizeCategory);
        return {
          success,
          message: message || 'Categories fetched successfully',
          data: categories,
          count: data?.count || 0,
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to fetch categories',
          data: [],
          count: 0,
        };
      }
    },

    category: async (_: any, { id }: any) => {
      try {
        const response = await axios.get(`${CATEGORY_SERVICE_URL}/categories/${id}`);
        return normalizeCategory(response.data.data);
      } catch (error: any) {
        return null;
      }
    },
  },

  Mutation: {
    createCategory: async (_: any, { input }: any) => {
      try {
        const response = await axios.post(`${CATEGORY_SERVICE_URL}/categories`, input);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to create category',
          data: null,
        };
      }
    },

    updateCategory: async (_: any, { id, input }: any) => {
      try {
        const response = await axios.put(`${CATEGORY_SERVICE_URL}/categories/${id}`, input);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update category',
          data: null,
        };
      }
    },

    deleteCategory: async (_: any, { id }: any) => {
      try {
        const response = await axios.delete(`${CATEGORY_SERVICE_URL}/categories/${id}`);
        return response.data;
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to delete category',
          data: null,
        };
      }
    },
  },
};
