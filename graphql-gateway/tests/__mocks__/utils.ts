// Mock for @3asoftwares/utils
export const SERVICE_URLS = {
  AUTH_SERVICE: 'http://localhost:4001',
  PRODUCT_SERVICE: 'http://localhost:4002',
  ORDER_SERVICE: 'http://localhost:4003',
  CATEGORY_SERVICE: 'http://localhost:4004',
  COUPON_SERVICE: 'http://localhost:4005',
  TICKET_SERVICE: 'http://localhost:4006',
};

export const PORT_CONFIG = {
  GRAPHQL: 4000,
  AUTH: 4001,
  PRODUCT: 4002,
  ORDER: 4003,
  CATEGORY: 4004,
  COUPON: 4005,
};

export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

export const Logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  configure: jest.fn(),
};

export default {
  SERVICE_URLS,
  PORT_CONFIG,
  DEFAULT_CORS_ORIGINS,
  Logger,
};
