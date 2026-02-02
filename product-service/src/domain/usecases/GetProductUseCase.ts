/**
 * Get Product Use Case
 * Handles the business logic for retrieving a product by ID
 */

import { IProductRepository } from '../repositories/IProductRepository';
import { UseCase, UseCaseResult, UseCaseError } from './UseCase';

export interface GetProductInput {
  id: string;
}

export interface GetProductOutput {
  product: {
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
  };
}

export class GetProductUseCase implements UseCase<
  GetProductInput,
  UseCaseResult<GetProductOutput>
> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: GetProductInput): Promise<UseCaseResult<GetProductOutput>> {
    try {
      if (!input.id || input.id.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Product ID is required',
            field: 'id',
          },
        };
      }

      const product = await this.productRepository.findById(input.id);

      if (!product) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      if (!product.isActive) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      return {
        success: true,
        data: {
          product: {
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
          },
        },
      };
    } catch (error: any) {
      throw new UseCaseError(error.message || 'Failed to get product', 'GET_PRODUCT_ERROR');
    }
  }
}
