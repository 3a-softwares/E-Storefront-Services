/**
 * MongoDB Product Repository Implementation
 */

import ProductModel from '../../models/Product';
import { Product, ProductProps } from '../../domain/entities/Product';
import {
  IProductRepository,
  ProductFilterOptions,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/IProductRepository';

export class MongoProductRepository implements IProductRepository {
  private toEntity(doc: Record<string, unknown>): Product {
    return Product.fromPersistence({
      id: String(doc._id),
      name: String(doc.name),
      description: String(doc.description),
      price: Number(doc.price),
      category: String(doc.category),
      stock: Number(doc.stock),
      imageUrl: String(doc.imageUrl),
      sellerId: String(doc.sellerId),
      isActive: Boolean(doc.isActive),
      tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
      rating: Number(doc.rating),
      reviewCount: Number(doc.reviewCount),
      createdAt: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(),
    });
  }

  private toPersistence(product: Product): Record<string, unknown> {
    const props = product.toPersistence();
    return {
      name: props.name,
      description: props.description,
      price: props.price,
      category: props.category,
      stock: props.stock,
      imageUrl: props.imageUrl,
      sellerId: props.sellerId,
      isActive: props.isActive,
      tags: props.tags,
      rating: props.rating,
      reviewCount: props.reviewCount,
    };
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const doc = await ProductModel.findById(id).lean();
      if (!doc) return null;
      return this.toEntity(doc);
    } catch {
      return null;
    }
  }

  async findAll(
    filters: ProductFilterOptions = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    const query: Record<string, unknown> = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ];
    }

    if (filters.category) {
      query.category = { $regex: new RegExp(`^${filters.category}$`, 'i') };
    }

    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceQuery: Record<string, number> = {};
      if (filters.minPrice !== undefined) priceQuery.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceQuery.$lte = filters.maxPrice;
      query.price = priceQuery;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      ProductModel.find(query)
        .sort({ [sortBy]: sortOrder } as Record<string, 1 | -1>)
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ProductModel.countDocuments(query),
    ]);

    return {
      items: docs.map((doc) => this.toEntity(doc)),
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
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ sellerId, isActive: true }, pagination);
  }

  async findByCategory(
    category: string,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ category, isActive: true }, pagination);
  }

  async save(product: Product): Promise<Product> {
    const doc = new ProductModel(this.toPersistence(product));
    const saved = await doc.save();
    return this.toEntity(saved.toObject() as unknown as Record<string, unknown>);
  }

  async update(id: string, product: Product): Promise<Product | null> {
    const updated = await ProductModel.findByIdAndUpdate(id, this.toPersistence(product), {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return null;
    return this.toEntity(updated as Record<string, unknown>);
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
    return result !== null;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return result !== null;
  }

  async count(filters: ProductFilterOptions = {}): Promise<number> {
    const query: Record<string, unknown> = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.category) {
      query.category = { $regex: new RegExp(`^${filters.category}$`, 'i') };
    }

    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }

    return ProductModel.countDocuments(query);
  }

  async exists(id: string): Promise<boolean> {
    const count = await ProductModel.countDocuments({ _id: id });
    return count > 0;
  }

  async bulkUpdate(ids: string[], update: Partial<ProductProps>): Promise<number> {
    const result = await ProductModel.updateMany(
      { _id: { $in: ids } },
      { ...update, updatedAt: new Date() }
    );
    return result.modifiedCount;
  }

  async findFeatured(limit: number = 10): Promise<Product[]> {
    const docs = await ProductModel.find({ isActive: true })
      .sort({ reviewCount: -1, rating: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => this.toEntity(doc));
  }

  async search(
    query: string,
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ search: query, isActive: true }, pagination);
  }
}

// Singleton instance
export const productRepository = new MongoProductRepository();
