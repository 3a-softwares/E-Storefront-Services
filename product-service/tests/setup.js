"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file for product-service
const globals_1 = require("@jest/globals");
process.env.MONGODB_URL = 'mongodb://localhost:27017/ecommerce';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.PORT = '3014';
process.env.REDIS_URL = 'redis://localhost:6379';
globals_1.jest.setTimeout(10000);
afterAll(async () => {
    globals_1.jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map