// Jest setup file
import { jest } from '@jest/globals';

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MONGODB_URL = 'mongodb://localhost:27017/ticket-test';
process.env.PORT = '3007';
process.env.NODE_ENV = 'test';

// Increase timeout for async tests
jest.setTimeout(10000);

// Global teardown
afterAll(async () => {
  // Clean up any remaining connections
  jest.clearAllMocks();
});
