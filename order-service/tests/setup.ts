// Jest setup file for order-service
import { jest } from '@jest/globals';

// Set environment variables for testing
process.env.MONGODB_URL = 'mongodb://localhost:27017/ecommerce';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.PORT = '3015';

// Increase timeout for async tests
jest.setTimeout(10000);

// Mock console methods to reduce test noise
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

afterAll(async () => {
  jest.clearAllMocks();
});
