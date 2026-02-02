import { Request, Response } from 'express';
import Product from '../models/Product';
import { CacheService, CacheKeys, CacheTTL } from '../infrastructure/cache';
import { Logger } from '@3asoftwares/utils/server';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const sellerId = req.query.sellerId as string;
    const featured = req.query.featured === 'true' ? true : false;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

    Logger.debug('Fetching products', { page, limit, search, category, sellerId, featured }, 'ProductController');

    let sortBy = (req.query.sortBy as string) || 'createdAt';
    let sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    if (featured) {
      sortBy = 'reviewCount';
      sortOrder = -1;
    }

    const includeInactive = req.query.includeInactive === 'true' ? true : false;

    const skip = (page - 1) * limit;

    const cacheKey = CacheKeys.products(page, limit);
    const cached = await CacheService.get(cacheKey);
    const hasCustomSort = req.query.sortBy || req.query.sortOrder;
    if (
      cached &&
      !search &&
      !category &&
      !minPrice &&
      !maxPrice &&
      !hasCustomSort &&
      !sellerId &&
      !featured &&
      !includeInactive
    ) {
      Logger.debug('Returning cached products', { page, limit }, 'ProductController');
      res.status(200).json({
        success: true,
        data: cached,
        fromCache: true,
      });
      return;
    }

    const query: any = includeInactive ? {} : { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (category && category !== 'All') {
      // Case-insensitive category match (supports both name and slug)
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    Logger.debug('Executing product query', { query }, 'ProductController');

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder } as Record<string, 1 | -1>)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (!search && !category && !minPrice && !maxPrice) {
      await CacheService.set(cacheKey, result, CacheTTL.PRODUCTS);
    }

    Logger.info(`Fetched ${products.length} products`, { total, page }, 'ProductController');

    res.status(200).json({
      success: true,
      data: result,
      fromCache: false,
    });
  } catch (error: any) {
    Logger.error('Failed to get products', error, 'ProductController');
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: error.message,
    });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    Logger.debug('Fetching product by ID', { productId: id }, 'ProductController');

    const cacheKey = CacheKeys.product(id);
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      Logger.debug('Returning cached product', { productId: id }, 'ProductController');
      res.status(200).json({
        success: true,
        data: cached,
        fromCache: true,
      });
      return;
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      Logger.warn('Product not found', { productId: id }, 'ProductController');
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    await CacheService.set(cacheKey, product, CacheTTL.PRODUCT_DETAIL);

    Logger.debug('Product fetched successfully', { productId: id, name: product.name }, 'ProductController');

    res.status(200).json({
      success: true,
      data: product,
      fromCache: false,
    });
  } catch (error: any) {
    Logger.error('Failed to get product', error, 'ProductController');
    res.status(500).json({
      success: false,
      message: 'Failed to get product',
      error: error.message,
    });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    Logger.info('Creating new product', { name: req.body.name, sellerId: req.body.sellerId, image: req.body.image }, 'ProductController');

    const product = new Product(req.body);
    await product.save();

    await CacheService.deletePattern('products:*');

    Logger.info('Product created successfully', { productId: product._id, name: product.name }, 'ProductController');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  } catch (error: any) {
    Logger.error('Failed to create product', error, 'ProductController');
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    Logger.info('Updating product', { productId: id }, 'ProductController');

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      Logger.warn('Product not found for update', { productId: id }, 'ProductController');
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    await CacheService.delete(CacheKeys.product(id));
    await CacheService.deletePattern('products:*');

    Logger.info('Product updated successfully', { productId: id, name: product.name }, 'ProductController');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  } catch (error: any) {
    Logger.error('Failed to update product', error, 'ProductController');
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    Logger.info('Deleting product (soft delete)', { productId: id }, 'ProductController');

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      Logger.warn('Product not found for deletion', { productId: id }, 'ProductController');
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    Logger.info('Product deleted successfully', { productId: id, name: product.name }, 'ProductController');

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    Logger.error('Failed to delete product', error, 'ProductController');
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};

export const getProductsBySeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    Logger.debug('Fetching products by seller', { sellerId }, 'ProductController');

    const products = await Product.find({
      sellerId,
      isActive: true,
    }).sort({ createdAt: -1 });

    Logger.info(`Fetched ${products.length} products for seller`, { sellerId }, 'ProductController');

    res.status(200).json({
      success: true,
      data: { products, count: products.length },
    });
  } catch (error: any) {
    Logger.error('Failed to get seller products', error, 'ProductController');
    res.status(500).json({
      success: false,
      message: 'Failed to get seller products',
      error: error.message,
    });
  }
};