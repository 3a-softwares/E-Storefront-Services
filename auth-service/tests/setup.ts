// Jest setup file
import { jest } from '@jest/globals';

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MONGODB_URL = 'mongodb://localhost:27017/ecommerce';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'test-password';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Increase timeout for async tests
jest.setTimeout(10000);

// Global teardown
afterAll(async () => {
  // Clean up any remaining connections
  jest.clearAllMocks();
});
