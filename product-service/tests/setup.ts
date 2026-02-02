// Jest setup file for product-service
import { jest } from '@jest/globals';

process.env.MONGODB_URL = 'mongodb://localhost:27017/ecommerce';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.PORT = '3014';
process.env.REDIS_URL = 'redis://localhost:6379';

jest.setTimeout(10000);

afterAll(async () => {
  jest.clearAllMocks();
});
