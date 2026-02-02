/**
 * Product Repository Interface
 * Defines the contract for product data access
 */

import { Product, ProductProps } from '../entities/Product';

export interface ProductFilterOptions {
  search?: string;
  category?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  featured?: boolean;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IProductRepository {
  /**
   * Find a product by its ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find all products with optional filtering and pagination
   */
  findAll(
    filters?: ProductFilterOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /**
   * Find products by seller ID
   */
  findBySellerId(
    sellerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /**
   * Find products by category
   */
  findByCategory(
    category: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;

  /**
   * Save a new product
   */
  save(product: Product): Promise<Product>;

  /**
   * Update an existing product
   */
  update(id: string, product: Product): Promise<Product | null>;

  /**
   * Delete a product (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Hard delete a product
   */
  hardDelete(id: string): Promise<boolean>;

  /**
   * Count products with optional filters
   */
  count(filters?: ProductFilterOptions): Promise<number>;

  /**
   * Check if a product exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Bulk update products
   */
  bulkUpdate(ids: string[], update: Partial<ProductProps>): Promise<number>;

  /**
   * Get featured products
   */
  findFeatured(limit?: number): Promise<Product[]>;

  /**
   * Search products by text
   */
  search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
}
