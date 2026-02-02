/**
 * Mock Product Repository for Testing
 */

import { Product, ProductProps } from '../../src/domain/entities/Product';
import {
  IProductRepository,
  ProductFilterOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../src/domain/repositories/IProductRepository';

export class MockProductRepository implements IProductRepository {
  private products: Map<string, ProductProps> = new Map();
  private idCounter = 1;

  // Helper to reset state between tests
  reset(): void {
    this.products.clear();
    this.idCounter = 1;
  }

  // Helper to seed data
  seed(products: ProductProps[]): void {
    products.forEach((p) => {
      const id = p.id || `prod${this.idCounter++}`;
      this.products.set(id, { ...p, id });
    });
  }

  async findById(id: string): Promise<Product | null> {
    const props = this.products.get(id);
    if (!props) return null;
    return Product.fromPersistence(props);
  }

  async findAll(
    filters: ProductFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    let items = Array.from(this.products.values());

    // Apply filters
    if (filters.isActive !== undefined) {
      items = items.filter((p) => p.isActive === filters.isActive);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags?.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (filters.category) {
      items = items.filter((p) => p.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters.sellerId) {
      items = items.filter((p) => p.sellerId === filters.sellerId);
    }

    if (filters.minPrice !== undefined) {
      items = items.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      items = items.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.tags && filters.tags.length > 0) {
      items = items.filter((p) => filters.tags!.some((t) => p.tags?.includes(t)));
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;
    items.sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    const total = items.length;
    const start = (pagination.page - 1) * pagination.limit;
    const paginatedItems = items.slice(start, start + pagination.limit);

    return {
      items: paginatedItems.map((p) => Product.fromPersistence(p)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findBySellerId(
    sellerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ sellerId, isActive: true }, pagination);
  }

  async findByCategory(
    category: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ category, isActive: true }, pagination);
  }

  async save(product: Product): Promise<Product> {
    const id = `prod${this.idCounter++}`;
    const props: ProductProps = {
      ...product.toPersistence(),
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(id, props);
    return Product.fromPersistence(props);
  }

  async update(id: string, product: Product): Promise<Product | null> {
    if (!this.products.has(id)) return null;

    const existing = this.products.get(id)!;
    const updated: ProductProps = {
      ...existing,
      ...product.toPersistence(),
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return Product.fromPersistence(updated);
  }

  async delete(id: string): Promise<boolean> {
    const existing = this.products.get(id);
    if (!existing) return false;

    existing.isActive = false;
    this.products.set(id, existing);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async count(filters?: ProductFilterOptions): Promise<number> {
    const result = await this.findAll(filters, { page: 1, limit: 99999 });
    return result.pagination.total;
  }

  async exists(id: string): Promise<boolean> {
    return this.products.has(id);
  }

  async bulkUpdate(ids: string[], update: Partial<ProductProps>): Promise<number> {
    let count = 0;
    ids.forEach((id) => {
      const existing = this.products.get(id);
      if (existing) {
        this.products.set(id, {
          ...existing,
          ...update,
          updatedAt: new Date(),
        });
        count++;
      }
    });
    return count;
  }

  async findFeatured(limit: number = 10): Promise<Product[]> {
    const items = Array.from(this.products.values())
      .filter((p) => p.isActive)
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, limit);

    return items.map((p) => Product.fromPersistence(p));
  }

  async search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ search: query, isActive: true }, pagination);
  }
}
