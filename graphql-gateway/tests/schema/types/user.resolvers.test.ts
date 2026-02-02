import { userResolvers } from '../../../src/schema/types/user/resolvers';
import { authClient } from '../../../src/clients/serviceClients';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  authClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  addAuthHeader: jest.fn((token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

// Mock the Logger
jest.mock('@3asoftwares/utils/server', () => ({
  Logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('User Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.me', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        data: {
          data: {
            user: {
              _id: 'user123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'customer',
            },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUser);

      const result = await userResolvers.Query.me(null, {}, mockContext);

      expect(result).toEqual(mockUser.data.data.user);
      expect(authClient.get).toHaveBeenCalledWith('/api/auth/me', {
        headers: { Authorization: 'Bearer test-token' },
      });
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        userResolvers.Query.me(null, {}, mockContextNoToken)
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Query.users', () => {
    it('should return paginated users', async () => {
      const mockUsers = {
        data: {
          data: {
            users: [
              { _id: '1', email: 'user1@test.com' },
              { _id: '2', email: 'user2@test.com' },
            ],
            pagination: { page: 1, limit: 10, total: 2, pages: 1 },
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockUsers);

      const result = await userResolvers.Query.users(
        null,
        { page: 1, limit: 10 },
        mockContext
      );

      expect(result).toEqual(mockUsers.data.data);
    });

    it('should filter by search and role', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({ data: { data: { users: [] } } });

      await userResolvers.Query.users(
        null,
        { search: 'test', role: 'seller' },
        mockContext
      );

      expect(authClient.get).toHaveBeenCalledWith('/api/users', {
        params: { search: 'test', role: 'seller' },
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  describe('Query.getUserById', () => {
    it('should return user by ID with tokens', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              _id: 'user123',
              email: 'test@example.com',
              name: 'Test User',
              role: 'customer',
              isActive: true,
              emailVerified: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              lastLogin: '2024-01-10T00:00:00.000Z',
            },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            tokenExpiry: 3600,
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userResolvers.Query.getUserById(null, { id: 'user123' });

      expect(result.user.id).toBe('user123');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should return null when user not found', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({
        data: { success: false },
      });

      const result = await userResolvers.Query.getUserById(null, { id: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValue(new Error('Service error'));

      const result = await userResolvers.Query.getUserById(null, { id: 'user123' });

      expect(result).toBeNull();
    });
  });

  describe('Query.validateResetToken', () => {
    it('should validate reset token successfully', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          message: 'Token is valid',
          email: 'test@example.com',
        },
      });

      const result = await userResolvers.Query.validateResetToken(
        null,
        { token: 'valid-token' }
      );

      expect(result).toEqual({
        success: true,
        message: 'Token is valid',
        email: 'test@example.com',
      });
    });

    it('should return error for invalid token', async () => {
      (authClient.get as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Token expired' } },
      });

      const result = await userResolvers.Query.validateResetToken(
        null,
        { token: 'invalid-token' }
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token expired');
    });
  });

  describe('Query.validateEmailToken', () => {
    it('should validate email token successfully', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          message: 'Email verified',
          email: 'test@example.com',
        },
      });

      const result = await userResolvers.Query.validateEmailToken(
        null,
        { token: 'valid-token' }
      );

      expect(result).toEqual({
        success: true,
        message: 'Email verified',
        email: 'test@example.com',
      });
    });
  });

  describe('User field resolvers', () => {
    it('should resolve id from _id', () => {
      const parent = { _id: 'user123' };
      expect(userResolvers.User.id(parent)).toBe('user123');
    });

    it('should resolve id from id field', () => {
      const parent = { id: 'user456' };
      expect(userResolvers.User.id(parent)).toBe('user456');
    });

    it('should resolve createdAt to ISO string', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const parent = { createdAt: date };
      expect(userResolvers.User.createdAt(parent)).toBe(date.toISOString());
    });

    it('should return null for missing createdAt', () => {
      const parent = {};
      expect(userResolvers.User.createdAt(parent)).toBeNull();
    });
  });

  describe('Mutation.login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            _id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'customer',
            isActive: true,
            emailVerified: false,
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (authClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userResolvers.Mutation.login(
        null,
        { input: { email: 'test@example.com', password: 'password' } }
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
    });

    it('should throw error on failed login', async () => {
      (authClient.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      await expect(
        userResolvers.Mutation.login(
          null,
          { input: { email: 'test@example.com', password: 'wrong' } }
        )
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error when response is not successful', async () => {
      (authClient.post as jest.Mock).mockResolvedValue({
        data: { success: false, message: 'Account locked' },
      });

      await expect(
        userResolvers.Mutation.login(
          null,
          { input: { email: 'test@example.com', password: 'password' } }
        )
      ).rejects.toThrow('Account locked');
    });
  });

  describe('Mutation.register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            _id: 'newuser123',
            email: 'new@example.com',
            name: 'New User',
            role: 'customer',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (authClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userResolvers.Mutation.register(
        null,
        { input: { email: 'new@example.com', password: 'password', name: 'New User' } }
      );

      expect(result.user.email).toBe('new@example.com');
    });

    it('should throw error when email already exists', async () => {
      (authClient.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Email already exists' } },
      });

      await expect(
        userResolvers.Mutation.register(
          null,
          { input: { email: 'existing@example.com', password: 'password' } }
        )
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Mutation.googleAuth', () => {
    it('should authenticate with Google successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            _id: 'googleuser123',
            email: 'google@example.com',
            name: 'Google User',
            role: 'customer',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (authClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userResolvers.Mutation.googleAuth(
        null,
        { input: { idToken: 'google-id-token' } }
      );

      expect(result.user.email).toBe('google@example.com');
    });
  });
});
