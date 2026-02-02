import Redis from 'ioredis';
import dotenv from 'dotenv';
import { DATABASE_CONFIG } from '@3asoftwares/utils';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || DATABASE_CONFIG.REDIS_URL;

export const redisClient = new Redis(REDIS_URL, {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis server');
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('CacheService get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  static async delete(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      return await redisClient.del(...keys);
    } catch (error) {
      return 0;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  static async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      return -1;
    }
  }

  static async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await redisClient.incrby(key, amount);
    } catch (error) {
      return 0;
    }
  }
}

export const CacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number) => `products:${page}:${limit}`,
  productsByCategory: (category: string) => `products:category:${category}`,
  categories: () => `categories:all`,
  order: (id: string) => `order:${id}`,
  orders: (page: number, limit: number) => `orders:${page}:${limit}`,
  user: (id: string) => `user:${id}`,
  users: (page: number, limit: number) => `users:${page}:${limit}`,
  session: (userId: string) => `session:${userId}`,
  cart: (userId: string) => `cart:${userId}`,
  dashboardStats: () => 'dashboard:stats',
  sellerStats: (sellerId: string) => `seller:${sellerId}:stats`,
};

export const CacheTTL = {
  PRODUCTS: 3600, 
  PRODUCT_DETAIL: 1800, 
  CATEGORIES: 7200, 
  ORDERS: 300, 
  USERS: 1800, 
  SESSION: 86400, 
  CART: 604800, 
  STATS: 300, 
};
