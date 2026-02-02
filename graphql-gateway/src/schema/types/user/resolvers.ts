import { authClient, addAuthHeader } from '../../../clients/serviceClients';
import { Logger } from '@3asoftwares/utils/server';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.get('/api/auth/me', { headers: authHeader.headers });
      return response.data.data.user;
    },

    users: async (_: any, args: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const { page, limit, search, role } = args;
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.get('/api/users', {
        params: { page, limit, search, role },
        headers: authHeader.headers,
      });
      return response.data.data;
    },

    /**
     * Get user by ID with fresh tokens - used for micro-frontend authentication
     * This is a public endpoint (no auth required) for MFE handoff
     */
    getUserById: async (_: any, { id }: any) => {
      try {
        const response = await authClient.get(`/api/auth/user/${id}`);

        if (!response.data || !response.data.success) {
          return null;
        }

        const { user, accessToken, refreshToken, tokenExpiry } = response.data.data;

        return {
          user: {
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive !== undefined ? user.isActive : true,
            emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
          },
          accessToken,
          refreshToken,
          tokenExpiry,
        };
      } catch (error: any) {
        Logger.error('getUserById error', error, 'UserResolver');
        return null;
      }
    },

    validateResetToken: async (_: any, { token }: { token: string }) => {
      try {
        const response = await authClient.get(`/api/auth/validate-reset-token/${token}`);
        return {
          success: response.data.success,
          message: response.data.message,
          email: response.data.email || null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Invalid or expired reset token',
          email: null,
        };
      }
    },

    validateEmailToken: async (_: any, { token }: { token: string }) => {
      try {
        const response = await authClient.get(`/api/auth/validate-email-token/${token}`);
        return {
          success: response.data.success,
          message: response.data.message,
          email: response.data.email || null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Invalid or expired email verification token',
          email: null,
        };
      }
    },
  },

  User: {
    id: (parent: any) => parent._id || parent.id,
    createdAt: (parent: any) => {
      if (parent.createdAt) {
        return new Date(parent.createdAt).toISOString();
      }
      return null;
    },
  },

  Mutation: {
    login: async (_: any, { input }: any) => {
      try {
        const response = await authClient.post('/api/auth/login', input);

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Login failed');
        }

        const { user, accessToken, refreshToken } = response.data;

        if (!user || !accessToken || !refreshToken) {
          throw new Error('Invalid response from authentication service');
        }

        return {
          user: {
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive !== undefined ? user.isActive : true,
            emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
          },
          accessToken,
          refreshToken,
        };
      } catch (error: any) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error(error.message || 'Login failed');
      }
    },

    register: async (_: any, { input }: any) => {
      try {
        const response = await authClient.post('/api/auth/register', input);

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Registration failed');
        }

        const { user, accessToken, refreshToken } = response.data;

        if (!user || !accessToken || !refreshToken) {
          throw new Error('Invalid response from authentication service');
        }

        return {
          user: {
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive !== undefined ? user.isActive : true,
            emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
          },
          accessToken,
          refreshToken,
        };
      } catch (error: any) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error(error.message || 'Registration failed');
      }
    },

    googleAuth: async (_: any, { input }: any) => {
      try {
        const response = await authClient.post('/api/auth/google', { idToken: input.idToken });

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Google authentication failed');
        }

        const { user, accessToken, refreshToken } = response.data;

        if (!user || !accessToken || !refreshToken) {
          throw new Error('Invalid response from authentication service');
        }

        return {
          user: {
            id: user._id || user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive !== undefined ? user.isActive : true,
            emailVerified: user.emailVerified !== undefined ? user.emailVerified : false,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : null,
            profilePicture: user.profilePicture || null,
          },
          accessToken,
          refreshToken,
        };
      } catch (error: any) {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        }
        throw new Error(error.message || 'Google authentication failed');
      }
    },

    logout: async (_: any, __: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      await authClient.post('/api/auth/logout', {}, addAuthHeader(context.token));
      return true;
    },

    updateProfile: async (_: any, { input }: { input: { name?: string; phone?: string } }, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      try {
        const authHeader = addAuthHeader(context.token);
        const updateData: { name?: string; phone?: string } = {};
        if (input.name) updateData.name = input.name;
        if (input.phone !== undefined) updateData.phone = input.phone;
        
        const response = await authClient.put(
          '/api/auth/me',
          updateData,
          { headers: authHeader.headers }
        );
        const user = response.data.data?.user;
        return {
          success: response.data.success,
          message: response.data.message,
          user: user
            ? {
                id: user.id || user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
              }
            : null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update profile',
          user: null,
        };
      }
    },

    changePassword: async (
      _: any,
      { input }: { input: { currentPassword: string; newPassword: string } },
      context: any
    ) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      try {
        const authHeader = addAuthHeader(context.token);
        const response = await authClient.post(
          '/api/auth/change-password',
          { currentPassword: input.currentPassword, newPassword: input.newPassword },
          { headers: authHeader.headers }
        );
        return {
          success: response.data.success,
          message: response.data.message,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to change password',
        };
      }
    },

    updateUserRole: async (_: any, { id, role }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      const response = await authClient.patch(
        `/api/users/${id}/role`,
        { role },
        { headers: authHeader.headers }
      );
      return response.data.data.user;
    },

    deleteUser: async (_: any, { id }: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      const authHeader = addAuthHeader(context.token);
      await authClient.delete(`/api/users/${id}`, { headers: authHeader.headers });
      return true;
    },

    sendVerificationEmail: async (_: any, { source }: { source?: string }, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      try {
        const authHeader = addAuthHeader(context.token);
        const response = await authClient.post(
          '/api/auth/send-verification-email',
          { source: source || 'storefront' },
          { headers: authHeader.headers }
        );
        return {
          success: response.data.success,
          message: response.data.message,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to send verification email',
        };
      }
    },

    verifyEmail: async (_: any, __: any, context: any) => {
      if (!context.token) {
        throw new Error('Not authenticated');
      }
      try {
        const authHeader = addAuthHeader(context.token);
        const response = await authClient.post(
          '/api/auth/verify-email',
          {},
          { headers: authHeader.headers }
        );
        const user = response.data.data?.user;
        return {
          success: response.data.success,
          message: response.data.message,
          user: user
            ? {
                id: user.id || user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
              }
            : null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to verify email',
          user: null,
        };
      }
    },

    verifyEmailByToken: async (_: any, { token }: { token: string }) => {
      try {
        const response = await authClient.post('/api/auth/verify-email-token', { token });
        const user = response.data.data?.user;
        return {
          success: response.data.success,
          message: response.data.message,
          user: user
            ? {
                id: user.id || user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
              }
            : null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to verify email',
          user: null,
        };
      }
    },

    forgotPassword: async (_: any, { email, domain }: { email: string; domain: string }) => {
      try {
        const response = await authClient.post('/api/auth/forgot-password', { email, domain });
        return {
          success: response.data.success,
          message: response.data.message,
          resetToken: response.data.resetToken || null,
          resetUrl: response.data.resetUrl || null,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to process password reset request',
          resetToken: null,
          resetUrl: null,
        };
      }
    },

    resetPassword: async (
      _: any,
      {
        token,
        password,
        confirmPassword,
      }: { token: string; password: string; confirmPassword: string }
    ) => {
      try {
        const response = await authClient.post('/api/auth/reset-password', {
          token,
          password,
          confirmPassword,
        });
        return {
          success: response.data.success,
          message: response.data.message,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to reset password',
        };
      }
    },
  },
};
