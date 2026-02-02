/**
 * Update Product Use Case
 * Handles the business logic for updating an existing product
 */

import { UpdateProductDTO } from '../entities/Product';
import { IProductRepository } from '../repositories/IProductRepository';
import { UseCase, UseCaseResult, UseCaseError } from './UseCase';

export interface UpdateProductInput {
  id: string;
  sellerId?: string; // For authorization
  data: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    stock?: number;
    imageUrl?: string;
    tags?: string[];
    isActive?: boolean;
  };
}

export interface UpdateProductOutput {
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

export class UpdateProductUseCase implements UseCase<
  UpdateProductInput,
  UseCaseResult<UpdateProductOutput>
> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: UpdateProductInput): Promise<UseCaseResult<UpdateProductOutput>> {
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

      // Find existing product
      const existingProduct = await this.productRepository.findById(input.id);

      if (!existingProduct) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      // Check authorization if sellerId is provided
      if (input.sellerId && !existingProduct.belongsToSeller(input.sellerId)) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You are not authorized to update this product',
          },
        };
      }

      // Update the product domain entity
      const updateDTO: UpdateProductDTO = {
        name: input.data.name,
        description: input.data.description,
        price: input.data.price,
        category: input.data.category,
        stock: input.data.stock,
        imageUrl: input.data.imageUrl,
        tags: input.data.tags,
        isActive: input.data.isActive,
      };

      const updatedProduct = existingProduct.update(updateDTO);

      // Persist the updated product
      const savedProduct = await this.productRepository.update(input.id, updatedProduct);

      if (!savedProduct) {
        return {
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update product',
          },
        };
      }

      return {
        success: true,
        data: {
          product: {
            id: savedProduct.id!,
            name: savedProduct.name,
            description: savedProduct.description,
            price: savedProduct.price,
            category: savedProduct.category,
            stock: savedProduct.stock,
            imageUrl: savedProduct.imageUrl,
            sellerId: savedProduct.sellerId,
            isActive: savedProduct.isActive,
            tags: savedProduct.tags,
            rating: savedProduct.rating,
            reviewCount: savedProduct.reviewCount,
            createdAt: savedProduct.createdAt,
            updatedAt: savedProduct.updatedAt,
          },
        },
      };
    } catch (error: any) {
      if (error.name === 'ProductValidationError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            field: error.field,
          },
        };
      }

      throw new UseCaseError(error.message || 'Failed to update product', 'UPDATE_PRODUCT_ERROR');
    }
  }
}
