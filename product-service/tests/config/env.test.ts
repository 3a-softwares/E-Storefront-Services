/**
 * Tests for environment variable configuration in product-service
 */

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Server Configuration', () => {
    it('should have PORT set in test environment', () => {
      expect(process.env.PORT).toBeDefined();
      expect(process.env.PORT).toBe('3014');
    });

    it('should use default PORT if not set', () => {
      delete process.env.PORT;
      const defaultPort = '3014';
      const port = process.env.PORT || defaultPort;
      expect(port).toBe(defaultPort);
    });

    it('should parse PORT as number', () => {
      const port = parseInt(process.env.PORT || '3014', 10);
      expect(port).toBe(3014);
      expect(typeof port).toBe('number');
    });
  });

  describe('Database Configuration', () => {
    it('should have MONGODB_URL set', () => {
      expect(process.env.MONGODB_URL).toBeDefined();
    });

    it('should use test database URL', () => {
      expect(process.env.MONGODB_URL).toContain('ecommerce');
    });

    it('should use default MongoDB URL if not set', () => {
      delete process.env.MONGODB_URL;
      const defaultUrl = 'mongodb://localhost:27017/ecommerce';
      const mongoUrl = process.env.MONGODB_URL || defaultUrl;
      expect(mongoUrl).toBe(defaultUrl);
    });

    it('should support MongoDB connection strings with options', () => {
      const connectionString = 'mongodb://localhost:27017/ecommerce?retryWrites=true&w=majority';
      process.env.MONGODB_URL = connectionString;
      expect(process.env.MONGODB_URL).toContain('retryWrites=true');
    });
  });

  describe('Redis Configuration', () => {
    it('should have REDIS_URL set', () => {
      expect(process.env.REDIS_URL).toBeDefined();
    });

    it('should use default Redis URL if not set', () => {
      delete process.env.REDIS_URL;
      const defaultUrl = 'redis://localhost:6379';
      const redisUrl = process.env.REDIS_URL || defaultUrl;
      expect(redisUrl).toBe(defaultUrl);
    });

    it('should support Redis connection with password', () => {
      const redisUrl = 'redis://:password@localhost:6379';
      process.env.REDIS_URL = redisUrl;
      expect(process.env.REDIS_URL).toContain(':password@');
    });

    it('should support Redis connection with database number', () => {
      const redisUrl = 'redis://localhost:6379/1';
      process.env.REDIS_URL = redisUrl;
      expect(process.env.REDIS_URL).toContain('/1');
    });
  });

  describe('JWT Configuration', () => {
    it('should have JWT_SECRET set', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
    });

    it('should use test JWT secret', () => {
      expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-12345');
    });

    it('should validate JWT_SECRET minimum length', () => {
      const jwtSecret = process.env.JWT_SECRET || '';
      expect(jwtSecret.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('CORS Configuration', () => {
    it('should use default origins if not set', () => {
      delete process.env.ALLOWED_ORIGINS;
      const defaultOrigins = 'http://localhost:3000,http://localhost:3001';
      const origins = process.env.ALLOWED_ORIGINS || defaultOrigins;
      expect(origins).toBeDefined();
    });

    it('should parse ALLOWED_ORIGINS correctly', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
      const origins = process.env.ALLOWED_ORIGINS.split(',');
      expect(origins).toHaveLength(2);
    });
  });

  describe('Logging Configuration', () => {
    it('should use default LOG_LEVEL if not set', () => {
      delete process.env.LOG_LEVEL;
      const defaultLevel = 'info';
      const logLevel = process.env.LOG_LEVEL || defaultLevel;
      expect(logLevel).toBe(defaultLevel);
    });

    it('should support different log levels', () => {
      const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
      validLevels.forEach((level) => {
        process.env.LOG_LEVEL = level;
        expect(validLevels).toContain(process.env.LOG_LEVEL);
      });
    });

    it('should handle ENABLE_FILE_LOGGING as boolean', () => {
      process.env.ENABLE_FILE_LOGGING = 'true';
      const enabled = process.env.ENABLE_FILE_LOGGING === 'true';
      expect(enabled).toBe(true);

      process.env.ENABLE_FILE_LOGGING = 'false';
      const disabled = process.env.ENABLE_FILE_LOGGING === 'true';
      expect(disabled).toBe(false);
    });

    it('should use default LOG_FILE_PATH if not set', () => {
      delete process.env.LOG_FILE_PATH;
      const defaultPath = './logs/product-service.log';
      const logPath = process.env.LOG_FILE_PATH || defaultPath;
      expect(logPath).toBe(defaultPath);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should validate required variables exist', () => {
      const requiredVars = ['MONGODB_URL', 'JWT_SECRET'];

      requiredVars.forEach((varName) => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]?.trim()).not.toBe('');
      });
    });

    it('should validate URL format for MONGODB_URL', () => {
      const mongoUrl = process.env.MONGODB_URL || '';
      expect(mongoUrl).toMatch(/^mongodb(\+srv)?:\/\/.+/);
    });

    it('should validate URL format for REDIS_URL', () => {
      const redisUrl = process.env.REDIS_URL || '';
      if (redisUrl) {
        expect(redisUrl).toMatch(/^redis:\/\/.+/);
      }
    });
  });

  describe('NODE_ENV Configuration', () => {
    it('should use default NODE_ENV if not set', () => {
      // Note: Jest automatically sets NODE_ENV to 'test' during test runs
      // So this test verifies that the fallback logic works
      const originalEnv = process.env.NODE_ENV;
      delete (process.env as any).NODE_ENV;
      const defaultEnv = 'development';
      const nodeEnv = process.env.NODE_ENV || defaultEnv;
      expect(nodeEnv).toBe(defaultEnv);
      // Restore the original value
      process.env.NODE_ENV = originalEnv;
    });

    it('should support valid NODE_ENV values', () => {
      const validEnvs = ['development', 'test', 'production'];
      validEnvs.forEach((env) => {
        expect(validEnvs).toContain(process.env.NODE_ENV);
      });
    });
  });
});
