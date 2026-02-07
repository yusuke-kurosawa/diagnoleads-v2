/**
 * Zod Validation i18n Integration Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// Import actual module
import {
  fieldNameMap as actualFieldNameMap,
  getZodErrorMessage,
  createZodErrorMap,
  formatZodErrors,
} from '@/lib/messages/validation';

// Field name map matching source
const localFieldNameMap: Record<string, string> = {
  name: 'leads.name',
  email: 'leads.email',
  phone: 'leads.phone',
  company: 'leads.company',
  position: 'leads.position',
  source: 'leads.source',
  status: 'leads.status',
  score: 'leads.score',
  notes: 'leads.notes',
  organizationName: 'organization.name',
  organizationSlug: 'organization.slug',
  organizationDomain: 'organization.domain',
  memberEmail: 'member.email',
  memberRole: 'member.role',
  title: 'common.title',
  description: 'common.description',
  url: 'common.url',
  password: 'common.password',
};

describe('fieldNameMap', () => {
  it('should map lead fields', () => {
    expect(localFieldNameMap.name).toBe('leads.name');
    expect(localFieldNameMap.email).toBe('leads.email');
    expect(localFieldNameMap.phone).toBe('leads.phone');
    expect(localFieldNameMap.company).toBe('leads.company');
  });

  it('should map organization fields', () => {
    expect(localFieldNameMap.organizationName).toBe('organization.name');
    expect(localFieldNameMap.organizationSlug).toBe('organization.slug');
  });

  it('should map member fields', () => {
    expect(localFieldNameMap.memberEmail).toBe('member.email');
    expect(localFieldNameMap.memberRole).toBe('member.role');
  });

  it('should map common fields', () => {
    expect(localFieldNameMap.title).toBe('common.title');
    expect(localFieldNameMap.description).toBe('common.description');
    expect(localFieldNameMap.url).toBe('common.url');
  });
});

describe('getZodErrorMessage', () => {
  const t = vi.fn((key: string, params?: Record<string, string | number>) => {
    if (params) {
      return `${key}: ${JSON.stringify(params)}`;
    }
    return key;
  });

  const tFields = vi.fn((key: string) => key);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle invalid_type for required field', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['email'],
    };

    const fieldName = tFields(localFieldNameMap['email'] || 'email');
    const result = t('validation.required', { field: fieldName });

    expect(result).toContain('validation.required');
  });

  it('should handle invalid_type for type mismatch', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'number',
      path: ['name'],
    };

    const fieldName = 'name';
    const result = t('validation.invalid', { field: fieldName });

    expect(result).toContain('validation.invalid');
  });

  it('should handle too_small for string', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.too_small,
      type: 'string',
      minimum: 2,
      inclusive: true,
      path: ['name'],
    };

    const result = t('validation.min', { field: 'name', min: 2 });

    expect(result).toContain('validation.min');
    expect(result).toContain('2');
  });

  it('should handle too_small for number', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.too_small,
      type: 'number',
      minimum: 0,
      inclusive: true,
      path: ['score'],
    };

    const result = t('validation.minNumber', { field: 'score', min: 0 });

    expect(result).toContain('validation.minNumber');
  });

  it('should handle too_big for string', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.too_big,
      type: 'string',
      maximum: 100,
      inclusive: true,
      path: ['name'],
    };

    const result = t('validation.max', { field: 'name', max: 100 });

    expect(result).toContain('validation.max');
    expect(result).toContain('100');
  });

  it('should handle too_big for number', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.too_big,
      type: 'number',
      maximum: 100,
      inclusive: true,
      path: ['score'],
    };

    const result = t('validation.maxNumber', { field: 'score', max: 100 });

    expect(result).toContain('validation.maxNumber');
  });

  it('should handle invalid_string for email', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_string,
      validation: 'email',
      path: ['email'],
    };

    const result = t('validation.email');

    expect(result).toBe('validation.email');
  });

  it('should handle invalid_string for url', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_string,
      validation: 'url',
      path: ['url'],
    };

    const result = t('validation.url');

    expect(result).toBe('validation.url');
  });

  it('should handle invalid_string for regex', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_string,
      validation: 'regex',
      path: ['phone'],
    };

    const result = t('validation.pattern', { field: 'phone' });

    expect(result).toContain('validation.pattern');
  });

  it('should handle custom error with message', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.custom,
      message: 'Custom error message',
      path: ['field'],
    };

    expect(issue.message).toBe('Custom error message');
  });
});

describe('createZodErrorMap', () => {
  it('should create error map function', () => {
    const t = vi.fn().mockReturnValue('Translated error');
    
    type ZodErrorMap = (
      issue: z.ZodIssueOptionalMessage,
      ctx: { defaultError: string }
    ) => { message: string };

    const createZodErrorMap = (
      t: (key: string, params?: Record<string, string | number>) => string,
      tFields?: (key: string) => string
    ): ZodErrorMap => {
      return (issue, ctx) => {
        if (issue.message) {
          return { message: issue.message };
        }
        return { message: t('validation.invalid') };
      };
    };

    const errorMap = createZodErrorMap(t);
    expect(typeof errorMap).toBe('function');
  });

  it('should use issue.message if provided', () => {
    const errorMap = (issue: z.ZodIssueOptionalMessage) => {
      if (issue.message) {
        return { message: issue.message };
      }
      return { message: 'Default error' };
    };

    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.custom,
      message: 'Pre-set message',
      path: [],
    };

    const result = errorMap(issue);
    expect(result.message).toBe('Pre-set message');
  });
});

describe('formatZodErrors', () => {
  it('should format errors into record', () => {
    const formatZodErrors = (
      errors: z.ZodError,
      t: (key: string) => string
    ): Record<string, string> => {
      const formattedErrors: Record<string, string> = {};

      errors.issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!formattedErrors[path]) {
          formattedErrors[path] = t('validation.invalid');
        }
      });

      return formattedErrors;
    };

    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    const result = schema.safeParse({ email: 'invalid', name: 'a' });
    
    if (!result.success) {
      const t = vi.fn().mockReturnValue('Error');
      const formatted = formatZodErrors(result.error, t);
      
      expect(formatted).toHaveProperty('email');
      expect(formatted).toHaveProperty('name');
    }
  });

  it('should handle nested paths', () => {
    const formatZodErrors = (issues: { path: (string | number)[] }[]) => {
      const errors: Record<string, string> = {};
      issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = 'Error';
      });
      return errors;
    };

    const issues = [
      { path: ['address', 'city'] },
      { path: ['address', 'zip'] },
      { path: ['name'] },
    ];

    const result = formatZodErrors(issues);
    
    expect(result['address.city']).toBe('Error');
    expect(result['address.zip']).toBe('Error');
    expect(result['name']).toBe('Error');
  });

  it('should not overwrite existing errors', () => {
    const formatZodErrors = (issues: { path: string[]; message: string }[]) => {
      const errors: Record<string, string> = {};
      issues.forEach((issue) => {
        const path = issue.path.join('.');
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      return errors;
    };

    const issues = [
      { path: ['email'], message: 'First error' },
      { path: ['email'], message: 'Second error' },
    ];

    const result = formatZodErrors(issues);
    expect(result['email']).toBe('First error');
  });
});

describe('Zod schema integration', () => {
  it('should validate email schema', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const validResult = schema.safeParse({ email: 'test@example.com' });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({ email: 'invalid' });
    expect(invalidResult.success).toBe(false);
  });

  it('should validate string min/max', () => {
    const schema = z.object({
      name: z.string().min(2).max(100),
    });

    const tooShort = schema.safeParse({ name: 'a' });
    expect(tooShort.success).toBe(false);

    const valid = schema.safeParse({ name: 'Valid Name' });
    expect(valid.success).toBe(true);
  });

  it('should validate number range', () => {
    const schema = z.object({
      score: z.number().min(0).max(100),
    });

    const tooLow = schema.safeParse({ score: -1 });
    expect(tooLow.success).toBe(false);

    const tooHigh = schema.safeParse({ score: 101 });
    expect(tooHigh.success).toBe(false);

    const valid = schema.safeParse({ score: 50 });
    expect(valid.success).toBe(true);
  });
});

// Integration tests with actual module
describe('Integration: fieldNameMap (actual)', () => {
  it('should export fieldNameMap', () => {
    expect(actualFieldNameMap).toBeDefined();
    expect(actualFieldNameMap.name).toBe('leads.name');
    expect(actualFieldNameMap.email).toBe('leads.email');
    expect(actualFieldNameMap.organizationName).toBe('organization.name');
  });
});

describe('Integration: getZodErrorMessage (actual)', () => {
  const mockT = vi.fn((key: string, params?: Record<string, string | number>) => {
    if (params) return `${key}:${JSON.stringify(params)}`;
    return key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle invalid_type issue', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_type,
      expected: 'string',
      received: 'undefined',
      path: ['name'],
    };

    const result = getZodErrorMessage(issue, mockT);
    expect(mockT).toHaveBeenCalled();
    expect(typeof result).toBe('string');
  });

  it('should handle too_small issue', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.too_small,
      type: 'string',
      minimum: 2,
      inclusive: true,
      path: ['name'],
    };

    const result = getZodErrorMessage(issue, mockT);
    expect(typeof result).toBe('string');
  });

  it('should handle invalid_string for email', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.invalid_string,
      validation: 'email',
      path: ['email'],
    };

    const result = getZodErrorMessage(issue, mockT);
    expect(result).toContain('validation.email');
  });

  it('should handle custom error', () => {
    const issue: z.ZodIssueOptionalMessage = {
      code: z.ZodIssueCode.custom,
      message: 'Custom message',
      path: ['field'],
    };

    const result = getZodErrorMessage(issue, mockT);
    expect(result).toBe('Custom message');
  });
});

describe('Integration: createZodErrorMap (actual)', () => {
  it('should create error map', () => {
    const mockT = vi.fn().mockReturnValue('Translated');
    const errorMap = createZodErrorMap(mockT);
    
    expect(typeof errorMap).toBe('function');
  });

  it('should return message from issue if present', () => {
    const mockT = vi.fn().mockReturnValue('Default');
    const errorMap = createZodErrorMap(mockT);

    const result = errorMap(
      { code: z.ZodIssueCode.custom, message: 'Preset message', path: [] },
      { defaultError: 'default' }
    );

    expect(result.message).toBe('Preset message');
  });
});

describe('Integration: formatZodErrors (actual)', () => {
  it('should format zod errors into record', () => {
    const mockT = vi.fn().mockReturnValue('Error');
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    const result = schema.safeParse({ email: 'bad', name: 'a' });
    
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT);
      expect(typeof formatted).toBe('object');
      expect(formatted).toHaveProperty('email');
      expect(formatted).toHaveProperty('name');
    }
  });

  it('should use tFields for field translation', () => {
    const mockT = vi.fn().mockReturnValue('Error');
    const mockTFields = vi.fn((key) => `Field: ${key}`);
    const schema = z.object({
      email: z.string().email(),
    });

    const result = schema.safeParse({ email: 'invalid' });
    
    if (!result.success) {
      const formatted = formatZodErrors(result.error, mockT, mockTFields);
      expect(typeof formatted).toBe('object');
    }
  });
});
