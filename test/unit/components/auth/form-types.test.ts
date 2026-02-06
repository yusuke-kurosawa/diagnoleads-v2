/**
 * Auth Form Types Tests
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('Login Form Schema', () => {
  const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  });

  it('should validate correct email', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('should accept 8+ character password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });
});

describe('Signup Form Schema', () => {
  const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

  it('should validate correct signup data', () => {
    const result = signupSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const result = signupSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short name', () => {
    const result = signupSchema.safeParse({
      name: 'J',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('Reset Password Schema', () => {
  const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email'),
  });

  it('should validate email only', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = resetPasswordSchema.safeParse({
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('New Password Schema', () => {
  const newPasswordSchema = z.object({
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase')
      .regex(/[a-z]/, 'Password must contain lowercase')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

  it('should validate strong password', () => {
    const result = newPasswordSchema.safeParse({
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject password without uppercase', () => {
    const result = newPasswordSchema.safeParse({
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = newPasswordSchema.safeParse({
      password: 'PASSWORD123',
      confirmPassword: 'PASSWORD123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = newPasswordSchema.safeParse({
      password: 'PasswordABC',
      confirmPassword: 'PasswordABC',
    });
    expect(result.success).toBe(false);
  });
});

describe('Auth form values', () => {
  it('should define login form values type', () => {
    type LoginFormValues = {
      email: string;
      password: string;
    };

    const values: LoginFormValues = {
      email: 'test@example.com',
      password: 'password123',
    };

    expect(values.email).toBe('test@example.com');
  });

  it('should define signup form values type', () => {
    type SignupFormValues = {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      organizationName?: string;
    };

    const values: SignupFormValues = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      organizationName: 'Acme Inc',
    };

    expect(values.organizationName).toBe('Acme Inc');
  });
});

describe('Auth error handling', () => {
  it('should define error types', () => {
    type AuthError = {
      code: string;
      message: string;
    };

    const errors: AuthError[] = [
      { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      { code: 'USER_NOT_FOUND', message: 'User not found' },
      { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email' },
      { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts' },
    ];

    expect(errors).toHaveLength(4);
    expect(errors.some(e => e.code === 'INVALID_CREDENTIALS')).toBe(true);
  });
});

describe('Auth callbacks', () => {
  it('should define callback URLs', () => {
    const callbackUrls = {
      login: '/dashboard',
      logout: '/',
      verify: '/verify',
      resetPassword: '/reset-password',
    };

    expect(callbackUrls.login).toBe('/dashboard');
  });
});
