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
export declare class MockProductRepository implements IProductRepository {
  private products;
  private idCounter;
  reset(): void;
  seed(products: ProductProps[]): void;
  findById(id: string): Promise<Product | null>;
  findAll(
    filters?: ProductFilterOptions,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;
  findBySellerId(
    sellerId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;
  findByCategory(
    category: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  count(filters?: ProductFilterOptions): Promise<number>;
  exists(id: string): Promise<boolean>;
  bulkUpdate(ids: string[], update: Partial<ProductProps>): Promise<number>;
  findFeatured(limit?: number): Promise<Product[]>;
  search(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>>;
}
//# sourceMappingURL=MockProductRepository.d.ts.map
