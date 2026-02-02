import {
  authClient,
  productClient,
  orderClient,
  categoryClient,
  couponClient,
  addAuthHeader,
} from '../../src/clients/serviceClients';

describe('Service Clients', () => {
  describe('authClient', () => {
    it('should be configured with correct base URL', () => {
      expect(authClient.defaults.baseURL).toBeDefined();
      expect(authClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should be an axios instance', () => {
      expect(typeof authClient.get).toBe('function');
      expect(typeof authClient.post).toBe('function');
      expect(typeof authClient.put).toBe('function');
      expect(typeof authClient.delete).toBe('function');
    });
  });

  describe('productClient', () => {
    it('should be configured with correct base URL', () => {
      expect(productClient.defaults.baseURL).toBeDefined();
      expect(productClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('orderClient', () => {
    it('should be configured with correct base URL', () => {
      expect(orderClient.defaults.baseURL).toBeDefined();
      expect(orderClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('categoryClient', () => {
    it('should be configured with correct base URL', () => {
      expect(categoryClient.defaults.baseURL).toBeDefined();
      expect(categoryClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('couponClient', () => {
    it('should be configured with correct base URL', () => {
      expect(couponClient.defaults.baseURL).toBeDefined();
      expect(couponClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('addAuthHeader', () => {
    it('should return correct authorization header', () => {
      const token = 'test-token-123';
      const result = addAuthHeader(token);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    it('should handle empty token', () => {
      const result = addAuthHeader('');

      expect(result).toEqual({
        headers: { Authorization: 'Bearer ' },
      });
    });

    it('should handle token with special characters', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const result = addAuthHeader(token);

      expect(result).toEqual({
        headers: { Authorization: `Bearer ${token}` },
      });
    });
  });
});
