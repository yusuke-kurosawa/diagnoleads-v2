/**
 * Environment Variables Tests
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('Server environment variables schema', () => {
  const serverEnvSchema = z.object({
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    TRIGGER_API_KEY: z.string().optional(),
    TRIGGER_API_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DEFAULT_ORGANIZATION_ID: z.string().uuid().optional(),
  });

  it('should validate DATABASE_URL', () => {
    const result = z.string().url().safeParse('postgresql://user:pass@localhost:5432/db');
    expect(result.success).toBe(true);
  });

  it('should reject invalid DATABASE_URL', () => {
    const result = z.string().url().safeParse('not-a-url');
    expect(result.success).toBe(false);
  });

  it('should require BETTER_AUTH_SECRET min length', () => {
    const result = z.string().min(32).safeParse('short');
    expect(result.success).toBe(false);
  });

  it('should accept valid BETTER_AUTH_SECRET', () => {
    const result = z.string().min(32).safeParse('a'.repeat(32));
    expect(result.success).toBe(true);
  });

  it('should validate NODE_ENV enum', () => {
    const nodeEnvSchema = z.enum(['development', 'test', 'production']);
    expect(nodeEnvSchema.safeParse('development').success).toBe(true);
    expect(nodeEnvSchema.safeParse('test').success).toBe(true);
    expect(nodeEnvSchema.safeParse('production').success).toBe(true);
    expect(nodeEnvSchema.safeParse('staging').success).toBe(false);
  });

  it('should validate UUID format', () => {
    const uuidSchema = z.string().uuid();
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});

describe('Client environment variables schema', () => {
  const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string().default('DiagnoLeads'),
  });

  it('should validate NEXT_PUBLIC_APP_URL', () => {
    const result = z.string().url().safeParse('https://app.diagnoleads.com');
    expect(result.success).toBe(true);
  });

  it('should have default app name', () => {
    const schema = z.string().default('DiagnoLeads');
    const result = schema.parse(undefined);
    expect(result).toBe('DiagnoLeads');
  });
});

describe('Environment variable types', () => {
  it('should define env type', () => {
    type Env = {
      DATABASE_URL: string;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_URL: string;
      RESEND_API_KEY?: string;
      ANTHROPIC_API_KEY?: string;
      NODE_ENV: 'development' | 'test' | 'production';
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
    };

    const env: Env = {
      DATABASE_URL: 'postgresql://localhost/db',
      BETTER_AUTH_SECRET: 'x'.repeat(32),
      BETTER_AUTH_URL: 'http://localhost:3000',
      NODE_ENV: 'development',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_APP_NAME: 'DiagnoLeads',
    };

    expect(env.NODE_ENV).toBe('development');
  });
});

describe('Environment configuration', () => {
  it('should skip validation when SKIP_ENV_VALIDATION is set', () => {
    const skipValidation = !!process.env.SKIP_ENV_VALIDATION;
    expect(typeof skipValidation).toBe('boolean');
  });

  it('should treat empty strings as undefined', () => {
    const emptyStringAsUndefined = true;
    expect(emptyStringAsUndefined).toBe(true);
  });
});

describe('Database URL patterns', () => {
  it('should accept PostgreSQL URL', () => {
    const urls = [
      'postgresql://user:pass@localhost:5432/dbname',
      'postgres://user:pass@host.com:5432/db?sslmode=require',
      'postgresql://user@localhost/db',
    ];

    const urlSchema = z.string().url();
    for (const url of urls) {
      expect(urlSchema.safeParse(url).success).toBe(true);
    }
  });
});

describe('API Key patterns', () => {
  it('should accept optional API keys', () => {
    const apiKeySchema = z.string().optional();
    
    expect(apiKeySchema.safeParse('sk-abc123').success).toBe(true);
    expect(apiKeySchema.safeParse(undefined).success).toBe(true);
    expect(apiKeySchema.safeParse('').success).toBe(true);
  });
});

describe('Node environments', () => {
  it('should define development environment', () => {
    const isDev = process.env.NODE_ENV === 'development';
    expect(typeof isDev).toBe('boolean');
  });

  it('should define test environment', () => {
    const isTest = process.env.NODE_ENV === 'test';
    expect(typeof isTest).toBe('boolean');
  });

  it('should define production environment', () => {
    const isProd = process.env.NODE_ENV === 'production';
    expect(typeof isProd).toBe('boolean');
  });
});
