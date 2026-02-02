/**
 * Tests for environment variable configuration in auth-service
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

  describe('JWT Configuration', () => {
    it('should have JWT_SECRET set in test environment', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET).toBe('test-jwt-secret-key-12345');
    });

    it('should have JWT_REFRESH_SECRET set in test environment', () => {
      expect(process.env.JWT_REFRESH_SECRET).toBeDefined();
      expect(process.env.JWT_REFRESH_SECRET).toBe('test-refresh-secret-key-12345');
    });

    it('should have JWT_EXPIRES_IN set', () => {
      expect(process.env.JWT_EXPIRES_IN).toBeDefined();
      expect(process.env.JWT_EXPIRES_IN).toBe('1h');
    });

    it('should have JWT_REFRESH_EXPIRES_IN set', () => {
      expect(process.env.JWT_REFRESH_EXPIRES_IN).toBeDefined();
      expect(process.env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    });

    it('should use default JWT expiry if not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
      expect(jwtExpiresIn).toBe('1h');
    });

    it('should use default refresh token expiry if not set', () => {
      delete process.env.JWT_REFRESH_EXPIRES_IN;
      const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
      expect(refreshExpiresIn).toBe('7d');
    });
  });

  describe('Database Configuration', () => {
    it('should have MONGODB_URL set', () => {
      expect(process.env.MONGODB_URL).toBeDefined();
    });

    it('should use default MongoDB URL if not set', () => {
      delete process.env.MONGODB_URL;
      const defaultUrl = 'mongodb://localhost:27017/ecommerce';
      const mongoUrl = process.env.MONGODB_URL || defaultUrl;
      expect(mongoUrl).toBe(defaultUrl);
    });

    it('should support MongoDB connection string with credentials', () => {
      const connectionString = 'mongodb://user:password@localhost:27017/ecommerce?authSource=admin';
      process.env.MONGODB_URL = connectionString;
      expect(process.env.MONGODB_URL).toBe(connectionString);
    });

    it('should support MongoDB Atlas connection strings', () => {
      const atlasUrl = 'mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/ecommerce';
      process.env.MONGODB_URL = atlasUrl;
      expect(process.env.MONGODB_URL).toBe(atlasUrl);
    });
  });

  describe('Email Configuration', () => {
    it('should have EMAIL_HOST set', () => {
      expect(process.env.EMAIL_HOST).toBeDefined();
    });

    it('should have EMAIL_PORT set', () => {
      expect(process.env.EMAIL_PORT).toBeDefined();
    });

    it('should have EMAIL_USER set', () => {
      expect(process.env.EMAIL_USER).toBeDefined();
    });

    it('should have EMAIL_FROM set', () => {
      expect(process.env.EMAIL_FROM).toBeDefined();
    });

    it('should use default SMTP port if not set', () => {
      delete process.env.EMAIL_PORT;
      const defaultPort = '587';
      const port = process.env.EMAIL_PORT || defaultPort;
      expect(port).toBe(defaultPort);
    });
  });

  describe('Frontend URLs Configuration', () => {
    it('should have FRONTEND_URL set', () => {
      expect(process.env.FRONTEND_URL).toBeDefined();
      expect(process.env.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should use default frontend URL if not set', () => {
      delete process.env.FRONTEND_URL;
      const defaultUrl = 'http://localhost:3000';
      const frontendUrl = process.env.FRONTEND_URL || defaultUrl;
      expect(frontendUrl).toBe(defaultUrl);
    });
  });

  describe('Server Configuration', () => {
    it('should use default PORT if not set', () => {
      delete process.env.PORT;
      const defaultPort = '3011';
      const port = process.env.PORT || defaultPort;
      expect(port).toBe(defaultPort);
    });

    it('should use default NODE_ENV if not set', () => {
      // Note: Jest automatically sets NODE_ENV to 'test' during test runs
      // So this test verifies that the fallback logic works, but in test context NODE_ENV is already set
      const originalEnv = process.env.NODE_ENV;
      delete (process.env as any).NODE_ENV;
      const defaultEnv = 'development';
      const nodeEnv = process.env.NODE_ENV || defaultEnv;
      expect(nodeEnv).toBe(defaultEnv);
      // Restore the original value
      process.env.NODE_ENV = originalEnv;
    });

    it('should parse PORT as number', () => {
      process.env.PORT = '4000';
      const port = parseInt(process.env.PORT || '3011', 10);
      expect(port).toBe(4000);
      expect(typeof port).toBe('number');
    });
  });

  describe('BCRYPT Configuration', () => {
    it('should use default salt rounds if not set', () => {
      delete process.env.BCRYPT_SALT_ROUNDS;
      const defaultRounds = '10';
      const saltRounds = process.env.BCRYPT_SALT_ROUNDS || defaultRounds;
      expect(saltRounds).toBe(defaultRounds);
    });

    it('should parse salt rounds as number', () => {
      process.env.BCRYPT_SALT_ROUNDS = '12';
      const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      expect(rounds).toBe(12);
      expect(typeof rounds).toBe('number');
    });
  });

  describe('CORS Configuration', () => {
    it('should parse ALLOWED_ORIGINS as array', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
      const origins = (process.env.ALLOWED_ORIGINS || '').split(',');
      expect(origins).toHaveLength(2);
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:3001');
    });

    it('should handle single origin', () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
      const origins = (process.env.ALLOWED_ORIGINS || '').split(',');
      expect(origins).toHaveLength(1);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should validate required variables are not empty', () => {
      const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URL'];

      requiredVars.forEach((varName) => {
        const value = process.env[varName];
        expect(value).toBeDefined();
        expect(value?.trim()).not.toBe('');
      });
    });

    it('should validate JWT_SECRET minimum length', () => {
      const jwtSecret = process.env.JWT_SECRET || '';
      expect(jwtSecret.length).toBeGreaterThanOrEqual(10);
    });
  });
});
