/**
 * Leads Schemas Tests
 *
 * Unit tests for lead type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  leadStatusEnum,
  leadSourceEnum,
  filterOperatorEnum,
  filterConditionSchema,
  createLeadSchema,
  updateLeadSchema,
  getLeadSchema,
  listLeadsSchema,
  deleteLeadSchema,
  bulkUpdateStatusSchema,
  type LeadStatus,
  type LeadSource,
  type FilterOperator,
  type CreateLeadInput,
} from '@/lib/features/leads/types/schemas';

describe('leadStatusEnum', () => {
  it('should accept valid statuses', () => {
    expect(leadStatusEnum.parse('new')).toBe('new');
    expect(leadStatusEnum.parse('contacted')).toBe('contacted');
    expect(leadStatusEnum.parse('qualified')).toBe('qualified');
    expect(leadStatusEnum.parse('converted')).toBe('converted');
  });

  it('should reject invalid status', () => {
    expect(() => leadStatusEnum.parse('invalid')).toThrow();
    expect(() => leadStatusEnum.parse('')).toThrow();
  });
});

describe('leadSourceEnum', () => {
  it('should accept valid sources', () => {
    expect(leadSourceEnum.parse('website')).toBe('website');
    expect(leadSourceEnum.parse('embed')).toBe('embed');
    expect(leadSourceEnum.parse('api')).toBe('api');
  });

  it('should reject invalid source', () => {
    expect(() => leadSourceEnum.parse('invalid')).toThrow();
  });
});

describe('filterOperatorEnum', () => {
  it('should accept all filter operators', () => {
    const operators: FilterOperator[] = [
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'greater_than',
      'less_than',
      'greater_or_equal',
      'less_or_equal',
      'between',
      'is_empty',
      'is_not_empty',
      'in',
      'not_in',
    ];

    for (const op of operators) {
      expect(filterOperatorEnum.parse(op)).toBe(op);
    }
  });
});

describe('filterConditionSchema', () => {
  it('should accept valid condition', () => {
    const condition = {
      field: 'email',
      operator: 'contains',
      value: '@example.com',
    };

    const result = filterConditionSchema.parse(condition);
    expect(result.field).toBe('email');
    expect(result.operator).toBe('contains');
  });

  it('should accept condition with value2 for between', () => {
    const condition = {
      field: 'score',
      operator: 'between',
      value: 50,
      value2: 100,
    };

    const result = filterConditionSchema.parse(condition);
    expect(result.value2).toBe(100);
  });

  it('should reject empty field', () => {
    expect(() =>
      filterConditionSchema.parse({
        field: '',
        operator: 'equals',
        value: 'test',
      })
    ).toThrow();
  });
});

describe('createLeadSchema', () => {
  it('should accept valid minimal input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    };

    const result = createLeadSchema.parse(input);
    expect(result.email).toBe('test@example.com');
    expect(result.status).toBe('new'); // default
    expect(result.responses).toEqual({}); // default
  });

  it('should accept valid full input', () => {
    const input: CreateLeadInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'lead@company.com',
      name: 'John Doe',
      company: 'Acme Corp',
      phone: '+81-90-1234-5678',
      status: 'qualified',
      score: 85,
      source: 'website',
      responses: { question1: 'answer1' },
    };

    const result = createLeadSchema.parse(input);
    expect(result.name).toBe('John Doe');
    expect(result.score).toBe(85);
  });

  it('should reject invalid email', () => {
    expect(() =>
      createLeadSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
      })
    ).toThrow();
  });

  it('should reject invalid organizationId', () => {
    expect(() =>
      createLeadSchema.parse({
        organizationId: 'not-a-uuid',
        email: 'test@example.com',
      })
    ).toThrow();
  });

  it('should validate score range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
    };

    expect(() => createLeadSchema.parse({ ...baseInput, score: -1 })).toThrow();
    expect(() => createLeadSchema.parse({ ...baseInput, score: 101 })).toThrow();

    expect(createLeadSchema.parse({ ...baseInput, score: 0 }).score).toBe(0);
    expect(createLeadSchema.parse({ ...baseInput, score: 100 }).score).toBe(100);
  });
});

describe('updateLeadSchema', () => {
  it('should accept partial update', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
      status: 'converted' as const,
    };

    const result = updateLeadSchema.parse(input);
    expect(result.status).toBe('converted');
    expect(result.email).toBeUndefined();
  });

  it('should require organizationId and id', () => {
    expect(() => updateLeadSchema.parse({ status: 'new' })).toThrow();
  });
});

describe('getLeadSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = getLeadSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should reject invalid UUIDs', () => {
    expect(() =>
      getLeadSchema.parse({
        organizationId: 'invalid',
        id: '123e4567-e89b-12d3-a456-426614174001',
      })
    ).toThrow();
  });
});

describe('listLeadsSchema', () => {
  it('should accept minimal input with defaults', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = listLeadsSchema.parse(input);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it('should accept pagination options', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      limit: 50,
      offset: 100,
    };

    const result = listLeadsSchema.parse(input);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(100);
  });

  it('should accept filter options', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'qualified' as const,
      source: 'website' as const,
      search: 'john',
    };

    const result = listLeadsSchema.parse(input);
    expect(result.status).toBe('qualified');
    expect(result.search).toBe('john');
  });

  it('should accept sort options', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      sortBy: 'score' as const,
      sortOrder: 'desc' as const,
    };

    const result = listLeadsSchema.parse(input);
    expect(result.sortBy).toBe('score');
    expect(result.sortOrder).toBe('desc');
  });

  it('should accept date range filter', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      createdFrom: '2024-01-01T00:00:00Z',
      createdTo: '2024-12-31T23:59:59Z',
    };

    const result = listLeadsSchema.parse(input);
    expect(result.createdFrom).toBeDefined();
    expect(result.createdTo).toBeDefined();
  });

  it('should accept score range filter', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      scoreMin: 50,
      scoreMax: 100,
    };

    const result = listLeadsSchema.parse(input);
    expect(result.scoreMin).toBe(50);
    expect(result.scoreMax).toBe(100);
  });

  it('should accept tag filter', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      tagIds: [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      ],
    };

    const result = listLeadsSchema.parse(input);
    expect(result.tagIds).toHaveLength(2);
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listLeadsSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => listLeadsSchema.parse({ ...baseInput, limit: 101 })).toThrow();
  });
});

describe('deleteLeadSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      id: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = deleteLeadSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174001');
  });
});

describe('bulkUpdateStatusSchema', () => {
  it('should accept valid input', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      ids: [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      ],
      status: 'qualified' as const,
    };

    const result = bulkUpdateStatusSchema.parse(input);
    expect(result.ids).toHaveLength(2);
    expect(result.status).toBe('qualified');
  });

  it('should require at least one id', () => {
    expect(() =>
      bulkUpdateStatusSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        ids: [],
        status: 'new',
      })
    ).toThrow();
  });
});
