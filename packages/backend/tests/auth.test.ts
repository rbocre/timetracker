import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Unit tests for auth validator
describe('Auth Validators', () => {
  // Dynamic imports to handle ESM
  let registerSchema: typeof import('../src/modules/auth/auth.validator').registerSchema;
  let loginSchema: typeof import('../src/modules/auth/auth.validator').loginSchema;

  beforeAll(async () => {
    const mod = await import('../src/modules/auth/auth.validator.js');
    registerSchema = mod.registerSchema;
    loginSchema = mod.loginSchema;
  });

  describe('registerSchema', () => {
    it('should validate a correct registration input', () => {
      const input = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User',
        locale: 'de' as const,
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        email: 'not-an-email',
        password: 'securepassword123',
        name: 'Test User',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const input = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const input = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: '',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should default locale to de', () => {
      const input = {
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.locale).toBe('de');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login input', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject missing password', () => {
      const input = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

// Unit tests for AppError
describe('AppError', () => {
  let AppError: typeof import('../src/shared/app-error').AppError;

  beforeAll(async () => {
    const mod = await import('../src/shared/app-error.js');
    AppError = mod.AppError;
  });

  it('should create a bad request error', () => {
    const error = AppError.badRequest('Bad input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad input');
    expect(error.isOperational).toBe(true);
  });

  it('should create an unauthorized error', () => {
    const error = AppError.unauthorized('No access');
    expect(error.statusCode).toBe(401);
  });

  it('should create a not found error', () => {
    const error = AppError.notFound('Missing');
    expect(error.statusCode).toBe(404);
  });

  it('should create an internal error (non-operational)', () => {
    const error = AppError.internal('Server crash');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(false);
  });
});
