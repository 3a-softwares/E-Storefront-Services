/**
 * List Products Use Case
 * Handles the business logic for listing products with filters and pagination
 */

import {
  IProductRepository,
  ProductFilterOptions,
  PaginationOptions,
} from '../repositories/IProductRepository';
import { UseCase, UseCaseResult, UseCaseError } from './UseCase';

export interface ListProductsInput {
  filters?: {
    search?: string;
    category?: string;
    sellerId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    featured?: boolean;
    tags?: string[];
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface ProductSummary {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  isActive: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsOutput {
  products: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ListProductsUseCase implements UseCase<
  ListProductsInput,
  UseCaseResult<ListProductsOutput>
> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: ListProductsInput): Promise<UseCaseResult<ListProductsOutput>> {
    try {
      const page = input.pagination?.page ?? 1;
      const limit = Math.min(input.pagination?.limit ?? 20, 100); // Max 100 items per page

      if (page < 1) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Page must be at least 1',
            field: 'page',
          },
        };
      }

      if (limit < 1) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Limit must be at least 1',
            field: 'limit',
          },
        };
      }

      const filters: ProductFilterOptions = {
        search: input.filters?.search,
        category: input.filters?.category,
        sellerId: input.filters?.sellerId,
        minPrice: input.filters?.minPrice,
        maxPrice: input.filters?.maxPrice,
        isActive: input.filters?.isActive ?? true, // Default to active products
        featured: input.filters?.featured,
        tags: input.filters?.tags,
      };

      const pagination: PaginationOptions = {
        page,
        limit,
        sortBy: input.pagination?.sortBy ?? 'createdAt',
        sortOrder: input.pagination?.sortOrder ?? 'desc',
      };

      const result = await this.productRepository.findAll(filters, pagination);

      return {
        success: true,
        data: {
          products: result.items.map((product) => ({
            id: product.id!,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            imageUrl: product.imageUrl,
            sellerId: product.sellerId,
            isActive: product.isActive,
            tags: product.tags,
            rating: product.rating,
            reviewCount: product.reviewCount,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          })),
          pagination: result.pagination,
        },
      };
    } catch (error: any) {
      throw new UseCaseError(error.message || 'Failed to list products', 'LIST_PRODUCTS_ERROR');
    }
  }
}
