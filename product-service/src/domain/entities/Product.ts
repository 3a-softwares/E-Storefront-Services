/**
 * Product Entity - Domain Model
 * This represents the core business logic for a Product
 */

export interface ProductProps {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  isActive?: boolean;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  tags?: string[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  stock?: number;
  imageUrl?: string;
  tags?: string[];
  isActive?: boolean;
}

export class ProductValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ProductValidationError';
  }
}

export class Product {
  private readonly props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = {
      ...props,
      isActive: props.isActive ?? true,
      tags: props.tags ?? [],
      rating: props.rating ?? 0,
      reviewCount: props.reviewCount ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  // Factory method for creating a new product
  static create(dto: CreateProductDTO): Product {
    Product.validateName(dto.name);
    Product.validateDescription(dto.description);
    Product.validatePrice(dto.price);
    Product.validateCategory(dto.category);
    Product.validateStock(dto.stock);
    Product.validateSellerId(dto.sellerId);

    return new Product({
      name: dto.name.trim(),
      description: dto.description.trim(),
      price: dto.price,
      category: dto.category.trim(),
      stock: dto.stock,
      imageUrl: dto.imageUrl,
      sellerId: dto.sellerId,
      tags: dto.tags ?? [],
    });
  }

  // Factory method for reconstituting from persistence
  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // Validation methods
  private static validateName(name: string): void {
    if (!name || name.trim().length < 3) {
      throw new ProductValidationError('Product name must be at least 3 characters', 'name');
    }
    if (name.trim().length > 200) {
      throw new ProductValidationError('Product name cannot exceed 200 characters', 'name');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new ProductValidationError('Description must be at least 10 characters', 'description');
    }
    if (description.trim().length > 2000) {
      throw new ProductValidationError('Description cannot exceed 2000 characters', 'description');
    }
  }

  private static validatePrice(price: number): void {
    if (typeof price !== 'number' || isNaN(price)) {
      throw new ProductValidationError('Price must be a valid number', 'price');
    }
    if (price < 0) {
      throw new ProductValidationError('Price cannot be negative', 'price');
    }
  }

  private static validateCategory(category: string): void {
    if (!category || category.trim().length < 2) {
      throw new ProductValidationError('Category must be at least 2 characters', 'category');
    }
    if (category.trim().length > 100) {
      throw new ProductValidationError('Category cannot exceed 100 characters', 'category');
    }
  }

  private static validateStock(stock: number): void {
    if (typeof stock !== 'number' || isNaN(stock)) {
      throw new ProductValidationError('Stock must be a valid number', 'stock');
    }
    if (stock < 0) {
      throw new ProductValidationError('Stock cannot be negative', 'stock');
    }
    if (!Number.isInteger(stock)) {
      throw new ProductValidationError('Stock must be a whole number', 'stock');
    }
  }

  private static validateSellerId(sellerId: string): void {
    if (!sellerId || sellerId.trim().length === 0) {
      throw new ProductValidationError('Seller ID is required', 'sellerId');
    }
  }

  // Business methods
  update(dto: UpdateProductDTO): Product {
    if (dto.name !== undefined) {
      Product.validateName(dto.name);
    }
    if (dto.description !== undefined) {
      Product.validateDescription(dto.description);
    }
    if (dto.price !== undefined) {
      Product.validatePrice(dto.price);
    }
    if (dto.category !== undefined) {
      Product.validateCategory(dto.category);
    }
    if (dto.stock !== undefined) {
      Product.validateStock(dto.stock);
    }

    return new Product({
      ...this.props,
      ...dto,
      name: dto.name?.trim() ?? this.props.name,
      description: dto.description?.trim() ?? this.props.description,
      category: dto.category?.trim() ?? this.props.category,
      updatedAt: new Date(),
    });
  }

  deactivate(): Product {
    return new Product({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  activate(): Product {
    return new Product({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  updateStock(quantity: number): Product {
    const newStock = this.props.stock + quantity;
    if (newStock < 0) {
      throw new ProductValidationError('Insufficient stock', 'stock');
    }
    return new Product({
      ...this.props,
      stock: newStock,
      updatedAt: new Date(),
    });
  }

  decrementStock(quantity: number): Product {
    return this.updateStock(-quantity);
  }

  incrementStock(quantity: number): Product {
    return this.updateStock(quantity);
  }

  updateRating(newRating: number, newReviewCount: number): Product {
    if (newRating < 0 || newRating > 5) {
      throw new ProductValidationError('Rating must be between 0 and 5', 'rating');
    }
    return new Product({
      ...this.props,
      rating: newRating,
      reviewCount: newReviewCount,
      updatedAt: new Date(),
    });
  }

  isInStock(): boolean {
    return this.props.stock > 0;
  }

  hasEnoughStock(quantity: number): boolean {
    return this.props.stock >= quantity;
  }

  belongsToSeller(sellerId: string): boolean {
    return this.props.sellerId === sellerId;
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get price(): number {
    return this.props.price;
  }
  get category(): string {
    return this.props.category;
  }
  get stock(): number {
    return this.props.stock;
  }
  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }
  get sellerId(): string {
    return this.props.sellerId;
  }
  get isActive(): boolean {
    return this.props.isActive!;
  }
  get tags(): string[] {
    return [...this.props.tags!];
  }
  get rating(): number {
    return this.props.rating!;
  }
  get reviewCount(): number {
    return this.props.reviewCount!;
  }
  get createdAt(): Date {
    return this.props.createdAt!;
  }
  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  // Convert to plain object for persistence
  toPersistence(): ProductProps {
    return { ...this.props };
  }

  toJSON(): ProductProps {
    return this.toPersistence();
  }
}
