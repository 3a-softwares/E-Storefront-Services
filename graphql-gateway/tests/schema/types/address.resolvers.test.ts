import { addressResolvers } from '../../../src/schema/types/address';
import { authClient, addAuthHeader } from '../../../src/clients/serviceClients';

// Mock the service clients
jest.mock('../../../src/clients/serviceClients', () => ({
  authClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  addAuthHeader: jest.fn((token) => ({
    headers: { Authorization: `Bearer ${token}` },
  })),
}));

describe('Address Resolvers', () => {
  const mockContext = { token: 'test-token' };
  const mockContextNoToken = { token: '' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.myAddresses', () => {
    it('should return user addresses', async () => {
      const mockAddresses = {
        data: {
          data: {
            addresses: [
              { _id: '1', street: '123 Main St', city: 'NYC', isDefault: true },
              { _id: '2', street: '456 Oak Ave', city: 'LA', isDefault: false },
            ],
          },
        },
      };

      (authClient.get as jest.Mock).mockResolvedValue(mockAddresses);

      const result = await addressResolvers.Query.myAddresses(
        null,
        {},
        mockContext
      );

      expect(result.addresses).toHaveLength(2);
      expect(authClient.get).toHaveBeenCalledWith('/api/addresses', expect.any(Object));
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        addressResolvers.Query.myAddresses(null, {}, mockContextNoToken)
      ).rejects.toThrow('Not authenticated');
    });

    it('should return empty addresses array on empty data', async () => {
      (authClient.get as jest.Mock).mockResolvedValue({
        data: { data: {} },
      });

      const result = await addressResolvers.Query.myAddresses(
        null,
        {},
        mockContext
      );

      expect(result.addresses).toEqual([]);
    });
  });

  describe('Mutation.addAddress', () => {
    const addressInput = {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
      isDefault: false,
    };

    it('should add address successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Address added',
          data: { address: { _id: 'address123', ...addressInput } },
        },
      };

      (authClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.addAddress(
        null,
        { input: addressInput },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
      expect(result.address.id).toBe('address123');
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        addressResolvers.Mutation.addAddress(
          null,
          { input: addressInput },
          mockContextNoToken
        )
      ).rejects.toThrow('Not authenticated');
    });

    it('should handle missing address in response', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Address added',
          data: {},
        },
      };

      (authClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.addAddress(
        null,
        { input: addressInput },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeNull();
    });
  });

  describe('Mutation.updateAddress', () => {
    const updateInput = {
      street: '456 Oak Ave',
      city: 'Los Angeles',
    };

    it('should update address successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Address updated',
          data: { address: { _id: 'address123', ...updateInput } },
        },
      };

      (authClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.updateAddress(
        null,
        { id: 'address123', input: updateInput },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeDefined();
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        addressResolvers.Mutation.updateAddress(
          null,
          { id: 'address123', input: updateInput },
          mockContextNoToken
        )
      ).rejects.toThrow('Not authenticated');
    });

    it('should handle missing address in response', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Address updated',
          data: {},
        },
      };

      (authClient.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.updateAddress(
        null,
        { id: 'address123', input: updateInput },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeNull();
    });
  });

  describe('Mutation.deleteAddress', () => {
    it('should delete address successfully', async () => {
      (authClient.delete as jest.Mock).mockResolvedValue({
        data: { success: true, message: 'Address deleted' },
      });

      const result = await addressResolvers.Mutation.deleteAddress(
        null,
        { id: 'address123' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Address deleted');
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        addressResolvers.Mutation.deleteAddress(
          null,
          { id: 'address123' },
          mockContextNoToken
        )
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('Mutation.setDefaultAddress', () => {
    it('should set default address successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Default address set',
          data: { address: { _id: 'address123', isDefault: true } },
        },
      };

      (authClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.setDefaultAddress(
        null,
        { id: 'address123' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address.isDefault).toBe(true);
    });

    it('should throw error when not authenticated', async () => {
      await expect(
        addressResolvers.Mutation.setDefaultAddress(
          null,
          { id: 'address123' },
          mockContextNoToken
        )
      ).rejects.toThrow('Not authenticated');
    });

    it('should handle missing address in response', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Default set',
          data: {},
        },
      };

      (authClient.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addressResolvers.Mutation.setDefaultAddress(
        null,
        { id: 'address123' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.address).toBeNull();
    });
  });
});
