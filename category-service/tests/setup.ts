// Jest setup file for category-service
import { jest } from '@jest/globals';

process.env.MONGODB_URL = 'mongodb://localhost:27017/ecommerce';
process.env.PORT = '3012';

jest.setTimeout(10000);

afterAll(async () => {
  jest.clearAllMocks();
});
