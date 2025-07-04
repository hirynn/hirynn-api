import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Access token configuration
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h', // 1 hour
    algorithm: 'HS256',
  },

  // Refresh token configuration
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d', // 7 days
    algorithm: 'HS256',
  },

  // Reset token configuration
  resetToken: {
    secret: process.env.RESET_TOKEN_SECRET || 'your-reset-token-secret',
    expiresIn: process.env.RESET_TOKEN_EXPIRY || '15m', // 15 minutes
    algorithm: 'HS256',
  },
}));

// Helper function to get JWT configuration for access tokens
export const getAccessTokenConfig = () => ({
  secret: process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
  signOptions: {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h',
    algorithm: 'HS256' as const,
  },
});

// Helper function to get refresh token configuration
export const getRefreshTokenConfig = () => ({
  secret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret',
  signOptions: {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    algorithm: 'HS256' as const,
  },
});

// Validation function for JWT configuration
export const validateJwtConfig = (config: Record<string, any>) => {
  const requiredEnvVars = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];

  const missingVars = requiredEnvVars.filter((varName) => !config[varName]);

  if (missingVars.length > 0 && config.NODE_ENV === 'production') {
    throw new Error(
      `Missing required JWT environment variables: ${missingVars.join(', ')}`,
    );
  }

  // Validate token expiration formats
  const timeFormatRegex = /^\d+[smhdw]$/;
  const expirationVars = ['ACCESS_TOKEN_EXPIRY', 'REFRESH_TOKEN_EXPIRY'];

  expirationVars.forEach((varName) => {
    const value = config[varName] as string;
    if (value && !timeFormatRegex.test(value)) {
      throw new Error(
        `Invalid time format for ${varName}. Use format like '15m', '1h', '7d'`,
      );
    }
  });

  return config; // ✅ MUST return the validated config object
};