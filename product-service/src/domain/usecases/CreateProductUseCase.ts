/**
 * Create Product Use Case
 * Handles the business logic for creating a new product
 */

import { Product, CreateProductDTO } from '../entities/Product';
import { IProductRepository } from '../repositories/IProductRepository';
import { UseCase, UseCaseResult, UseCaseError } from './UseCase';

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  tags?: string[];
}

export interface CreateProductOutput {
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

export class CreateProductUseCase implements UseCase<
  CreateProductInput,
  UseCaseResult<CreateProductOutput>
> {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<UseCaseResult<CreateProductOutput>> {
    try {
      // Create domain entity (validates input)
      const productDTO: CreateProductDTO = {
        name: input.name,
        description: input.description,
        price: input.price,
        category: input.category,
        stock: input.stock,
        imageUrl: input.imageUrl,
        sellerId: input.sellerId,
        tags: input.tags,
      };

      const product = Product.create(productDTO);

      // Persist the product
      const savedProduct = await this.productRepository.save(product);

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
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string; field?: string };
      if (err.name === 'ProductValidationError') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: err.message || 'Validation error',
            field: err.field,
          },
        };
      }

      const message = err instanceof Error ? err.message : 'Failed to create product';
      throw new UseCaseError(message, 'CREATE_PRODUCT_ERROR');
    }
  }
}
