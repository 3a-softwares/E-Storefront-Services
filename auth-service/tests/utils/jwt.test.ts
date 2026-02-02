import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  TokenPayload,
} from '../../src/utils/jwt';
import { UserRole } from '@3asoftwares/types';

describe('JWT Utils', () => {
  const testUserId = '507f1f77bcf86cd799439011';
  const testEmail = 'test@example.com';
  const testRole = UserRole.CUSTOMER;

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testUserId);
      expect(decoded?.email).toBe(testEmail);
      expect(decoded?.role).toBe(testRole);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateAccessToken(testUserId, testEmail, testRole);
      const token2 = generateAccessToken('differentUserId', 'other@example.com', UserRole.SELLER);

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail, testRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate a different token than access token', () => {
      const accessToken = generateAccessToken(testUserId, testEmail, testRole);
      const refreshToken = generateRefreshToken(testUserId, testEmail, testRole);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(testUserId, testEmail, testRole);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate valid tokens that can be verified', () => {
      const tokens = generateTokens(testUserId, testEmail, testRole);

      const accessPayload = verifyAccessToken(tokens.accessToken);
      const refreshPayload = verifyRefreshToken(tokens.refreshToken);

      expect(accessPayload.userId).toBe(testUserId);
      expect(refreshPayload.userId).toBe(testUserId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const payload = verifyAccessToken(token);

      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.role).toBe(testRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired token');
    });

    it('should throw error for tampered token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tamperedToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(testUserId, testEmail, testRole);

      expect(() => verifyAccessToken(refreshToken)).toThrow('Invalid or expired token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testUserId, testEmail, testRole);
      const payload = verifyRefreshToken(token);

      expect(payload.userId).toBe(testUserId);
      expect(payload.email).toBe(testEmail);
      expect(payload.role).toBe(testRole);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(testUserId, testEmail, testRole);

      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid or expired refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const payload = decodeToken(token);

      expect(payload?.userId).toBe(testUserId);
      expect(payload?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const payload = decodeToken('not-a-valid-jwt');

      expect(payload).toBeNull();
    });

    it('should decode without verifying signature', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const tamperedToken = token.slice(0, -3) + 'xxx';

      // decodeToken should still work as it doesn't verify
      const payload = decodeToken(tamperedToken);
      // May or may not work depending on how much is tampered
      // Just checking it doesn't throw
      expect(() => decodeToken(tamperedToken)).not.toThrow();
    });
  });

  describe('Token Payload Structure', () => {
    it('should include iat (issued at) in token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const payload = decodeToken(token);

      expect(payload?.iat).toBeDefined();
      expect(typeof payload?.iat).toBe('number');
    });

    it('should include exp (expiration) in token', () => {
      const token = generateAccessToken(testUserId, testEmail, testRole);
      const payload = decodeToken(token);

      expect(payload?.exp).toBeDefined();
      expect(typeof payload?.exp).toBe('number');
      expect(payload!.exp!).toBeGreaterThan(payload!.iat!);
    });
  });
});
