// Test environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.AUTH_SERVICE_URL = 'http://localhost:4001';
process.env.PRODUCT_SERVICE_URL = 'http://localhost:4002';
process.env.ORDER_SERVICE_URL = 'http://localhost:4003';
process.env.CATEGORY_SERVICE_URL = 'http://localhost:4004';
process.env.COUPON_SERVICE_URL = 'http://localhost:4005';

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Global timeout
jest.setTimeout(10000);
