/**
 * Delete Product Use Case
 * Handles the business logic for deleting (soft delete) a product
 */

import { IProductRepository } from '../repositories/IProductRepository';
import { UseCase, UseCaseResult, UseCaseError } from './UseCase';

export interface DeleteProductInput {
  id: string;
  sellerId?: string; // For authorization
  hardDelete?: boolean;
}

export interface DeleteProductOutput {
  deleted: boolean;
  message: string;
}

export class DeleteProductUseCase
  implements UseCase<DeleteProductInput, UseCaseResult<DeleteProductOutput>>
{
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: DeleteProductInput): Promise<UseCaseResult<DeleteProductOutput>> {
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
            message: 'You are not authorized to delete this product',
          },
        };
      }

      let deleted: boolean;
      if (input.hardDelete) {
        deleted = await this.productRepository.hardDelete(input.id);
      } else {
        deleted = await this.productRepository.delete(input.id);
      }

      if (!deleted) {
        return {
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete product',
          },
        };
      }

      return {
        success: true,
        data: {
          deleted: true,
          message: input.hardDelete
            ? 'Product permanently deleted'
            : 'Product deleted successfully',
        },
      };
    } catch (error: any) {
      throw new UseCaseError(error.message || 'Failed to delete product', 'DELETE_PRODUCT_ERROR');
    }
  }
}
