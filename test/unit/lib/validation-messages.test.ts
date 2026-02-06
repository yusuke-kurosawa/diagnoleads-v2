/**
 * Validation Messages Tests
 *
 * Unit tests for Zod validation i18n integration
 */

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  fieldNameMap,
  getZodErrorMessage,
  createZodErrorMap,
  formatZodErrors,
} from '@/lib/messages/validation';

describe('fieldNameMap', () => {
  it('should have lead field mappings', () => {
    expect(fieldNameMap.name).toBe('leads.name');
    expect(fieldNameMap.email).toBe('leads.email');
    expect(fieldNameMap.phone).toBe('leads.phone');
    expect(fieldNameMap.company).toBe('leads.company');
    expect(fieldNameMap.status).toBe('leads.status');
    expect(fieldNameMap.score).toBe('leads.score');
  });

  it('should have organization field mappings', () => {
    expect(fieldNameMap.organizationName).toBe('organization.name');
    expect(fieldNameMap.organizationSlug).toBe('organization.slug');
    expect(fieldNameMap.organizationDomain).toBe('organization.domain');
  });

  it('should have member field mappings', () => {
    expect(fieldNameMap.memberEmail).toBe('member.email');
    expect(fieldNameMap.memberRole).toBe('member.role');
  });

  it('should have common field mappings', () => {
    expect(fieldNameMap.title).toBe('common.title');
    expect(fieldNameMap.description).toBe('common.description');
    expect(fieldNameMap.url).toBe('common.url');
    expect(fieldNameMap.password).toBe('common.password');
  });
});

describe('getZodErrorMessage', () => {
  const mockT = vi.fn((key: string, params?: Record<string, string | number>) => {
    if (params) {
      return `${key}:${JSON.stringify(params)}`;
    }
    return key;
  });

  const mockTFields = vi.fn((key: string) => `Field:${key}`);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invalid_type errors', () => {
    it('should handle required field (undefined)', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'undefined',
        path: ['name'],
      };

      const message = getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.required', expect.any(Object));
    });

    it('should handle invalid type', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'number',
        path: ['email'],
      };

      const message = getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.invalid', expect.any(Object));
    });
  });

  describe('too_small errors', () => {
    it('should handle string min length', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.too_small,
        type: 'string',
        minimum: 5,
        inclusive: true,
        path: ['name'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.min', expect.objectContaining({ min: 5 }));
    });

    it('should handle number minimum', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.too_small,
        type: 'number',
        minimum: 0,
        inclusive: true,
        path: ['score'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.minNumber', expect.objectContaining({ min: 0 }));
    });
  });

  describe('too_big errors', () => {
    it('should handle string max length', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.too_big,
        type: 'string',
        maximum: 100,
        inclusive: true,
        path: ['name'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.max', expect.objectContaining({ max: 100 }));
    });

    it('should handle number maximum', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.too_big,
        type: 'number',
        maximum: 100,
        inclusive: true,
        path: ['score'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.maxNumber', expect.objectContaining({ max: 100 }));
    });
  });

  describe('invalid_string errors', () => {
    it('should handle invalid email', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_string,
        validation: 'email',
        path: ['email'],
      };

      getZodErrorMessage(issue, mockT);
      expect(mockT).toHaveBeenCalledWith('validation.email');
    });

    it('should handle invalid URL', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_string,
        validation: 'url',
        path: ['url'],
      };

      getZodErrorMessage(issue, mockT);
      expect(mockT).toHaveBeenCalledWith('validation.url');
    });

    it('should handle invalid regex pattern', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_string,
        validation: 'regex',
        path: ['slug'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.pattern', expect.any(Object));
    });
  });

  describe('custom errors', () => {
    it('should use custom message if provided', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.custom,
        path: ['field'],
        message: 'Custom error message',
      };

      const message = getZodErrorMessage(issue, mockT);
      expect(message).toBe('Custom error message');
    });

    it('should fall back to invalid if no custom message', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.custom,
        path: ['field'],
      };

      getZodErrorMessage(issue, mockT, mockTFields);
      expect(mockT).toHaveBeenCalledWith('validation.invalid', expect.any(Object));
    });
  });

  describe('without tFields', () => {
    it('should use path directly as field name', () => {
      const issue: z.ZodIssueOptionalMessage = {
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'number',
        path: ['customField'],
      };

      getZodErrorMessage(issue, mockT);
      expect(mockT).toHaveBeenCalledWith('validation.invalid', { field: 'customField' });
    });
  });
});

describe('createZodErrorMap', () => {
  const mockT = vi.fn((key: string) => `translated:${key}`);

  it('should return a Zod error map function', () => {
    const errorMap = createZodErrorMap(mockT);
    expect(typeof errorMap).toBe('function');
  });

  it('should use custom message if provided', () => {
    const errorMap = createZodErrorMap(mockT);
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.custom,
      path: [],
      message: 'Custom message',
    };

    const result = errorMap(issue, { defaultError: 'default', data: null });
    expect(result.message).toBe('Custom message');
  });

  it('should generate translated message for standard issues', () => {
    const errorMap = createZodErrorMap(mockT);
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_string,
      validation: 'email',
      path: ['email'],
    };

    const result = errorMap(issue, { defaultError: 'default', data: null });
    expect(result.message).toContain('translated:validation.email');
  });
});

describe('formatZodErrors', () => {
  const mockT = vi.fn((key: string, params?: Record<string, string | number>) => {
    return params ? `${key}:${params.field || ''}` : key;
  });

  it('should format single error', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const result = schema.safeParse({ email: 'invalid' });
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(formatted).toHaveProperty('email');
    }
  });

  it('should format multiple errors', () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    });

    const result = schema.safeParse({ name: 'a', email: 'invalid' });
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(Object.keys(formatted)).toHaveLength(2);
      expect(formatted).toHaveProperty('name');
      expect(formatted).toHaveProperty('email');
    }
  });

  it('should handle nested paths', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });

    const result = schema.safeParse({ user: { email: 'invalid' } });
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(formatted).toHaveProperty('user.email');
    }
  });

  it('should only include first error for each path', () => {
    const schema = z.object({
      password: z.string().min(8).max(100),
    });

    const result = schema.safeParse({ password: '' });
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      // Should only have one entry for password
      expect(Object.keys(formatted).filter((k) => k === 'password')).toHaveLength(1);
    }
  });
});

describe('Real-world Zod schema validation', () => {
  const mockT = vi.fn((key: string, params?: Record<string, string | number>) => {
    const messages: Record<string, string> = {
      'validation.required': `${params?.field || 'Field'} is required`,
      'validation.email': 'Invalid email address',
      'validation.min': `${params?.field || 'Field'} must be at least ${params?.min} characters`,
      'validation.max': `${params?.field || 'Field'} must be at most ${params?.max} characters`,
    };
    return messages[key] || key;
  });

  it('should validate lead creation schema', () => {
    const leadSchema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      company: z.string().optional(),
      phone: z.string().optional(),
    });

    const invalidData = {
      name: '',
      email: 'not-an-email',
    };

    const result = leadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(Object.keys(formatted).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should validate organization creation schema', () => {
    const orgSchema = z.object({
      name: z.string().min(2).max(255),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    });

    const invalidData = {
      name: 'a',
      slug: 'Invalid Slug',
    };

    const result = orgSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(Object.keys(formatted).length).toBe(2);
    }
  });
});
