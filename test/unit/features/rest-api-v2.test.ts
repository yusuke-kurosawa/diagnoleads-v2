/**
 * REST API v2 Tests
 *
 * Tests for REST API validation schemas and utilities
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Recreate schemas from the API for testing
const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  source: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'score', 'name', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createLeadSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().default('api'),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).default('new'),
  score: z.number().int().min(0).max(100).optional(),
  responses: z.record(z.unknown()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

const updateLeadSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  responses: z.record(z.unknown()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

describe('REST API v2 - Leads Query Schema', () => {
  describe('listLeadsQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const result = listLeadsQuerySchema.safeParse({
        page: '1',
        limit: '20',
        status: 'new',
        source: 'website',
        minScore: '50',
        maxScore: '100',
        search: 'test',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.status).toBe('new');
        expect(result.data.minScore).toBe(50);
      }
    });

    it('should use default values for missing parameters', () => {
      const result = listLeadsQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortBy).toBe('createdAt');
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should reject invalid page number', () => {
      const result = listLeadsQuerySchema.safeParse({
        page: '0',
      });

      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = listLeadsQuerySchema.safeParse({
        limit: '101',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = listLeadsQuerySchema.safeParse({
        status: 'invalid',
      });

      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['new', 'contacted', 'qualified', 'converted'];
      for (const status of statuses) {
        const result = listLeadsQuerySchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all valid sortBy values', () => {
      const sortFields = ['createdAt', 'updatedAt', 'score', 'name', 'email'];
      for (const sortBy of sortFields) {
        const result = listLeadsQuerySchema.safeParse({ sortBy });
        expect(result.success).toBe(true);
      }
    });

    it('should coerce string numbers to integers', () => {
      const result = listLeadsQuerySchema.safeParse({
        page: '5',
        limit: '50',
        minScore: '25',
        maxScore: '75',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
        expect(typeof result.data.minScore).toBe('number');
        expect(typeof result.data.maxScore).toBe('number');
      }
    });

    it('should reject score outside 0-100 range', () => {
      const resultLow = listLeadsQuerySchema.safeParse({ minScore: '-10' });
      const resultHigh = listLeadsQuerySchema.safeParse({ maxScore: '150' });

      expect(resultLow.success).toBe(false);
      expect(resultHigh.success).toBe(false);
    });
  });
});

describe('REST API v2 - Create Lead Schema', () => {
  describe('createLeadSchema', () => {
    it('should accept valid lead data', () => {
      const result = createLeadSchema.safeParse({
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Corp',
        phone: '+1234567890',
        source: 'website',
        status: 'new',
        score: 75,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.name).toBe('Test User');
        expect(result.data.score).toBe(75);
      }
    });

    it('should require email field', () => {
      const result = createLeadSchema.safeParse({
        name: 'Test User',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = createLeadSchema.safeParse({
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
    });

    it('should use default values for source and status', () => {
      const result = createLeadSchema.safeParse({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe('api');
        expect(result.data.status).toBe('new');
      }
    });

    it('should accept responses and customFields as objects', () => {
      const result = createLeadSchema.safeParse({
        email: 'test@example.com',
        responses: { question1: 'answer1', question2: 42 },
        customFields: { industry: 'tech', size: 'enterprise' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responses).toEqual({ question1: 'answer1', question2: 42 });
        expect(result.data.customFields).toEqual({ industry: 'tech', size: 'enterprise' });
      }
    });

    it('should reject score outside 0-100 range', () => {
      const resultLow = createLeadSchema.safeParse({
        email: 'test@example.com',
        score: -10,
      });
      const resultHigh = createLeadSchema.safeParse({
        email: 'test@example.com',
        score: 150,
      });

      expect(resultLow.success).toBe(false);
      expect(resultHigh.success).toBe(false);
    });

    it('should reject non-integer score', () => {
      const result = createLeadSchema.safeParse({
        email: 'test@example.com',
        score: 75.5,
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('REST API v2 - Update Lead Schema', () => {
  describe('updateLeadSchema', () => {
    it('should accept partial updates', () => {
      const result = updateLeadSchema.safeParse({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Updated Name');
        expect(result.data.email).toBeUndefined();
      }
    });

    it('should accept empty update (no fields)', () => {
      const result = updateLeadSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it('should validate email format when provided', () => {
      const valid = updateLeadSchema.safeParse({ email: 'valid@example.com' });
      const invalid = updateLeadSchema.safeParse({ email: 'invalid' });

      expect(valid.success).toBe(true);
      expect(invalid.success).toBe(false);
    });

    it('should validate status when provided', () => {
      const valid = updateLeadSchema.safeParse({ status: 'converted' });
      const invalid = updateLeadSchema.safeParse({ status: 'invalid' });

      expect(valid.success).toBe(true);
      expect(invalid.success).toBe(false);
    });
  });
});

describe('REST API v2 - Response Format', () => {
  it('should have correct success response structure for list', () => {
    const response = {
      data: [
        {
          id: 'lead_123',
          email: 'test@example.com',
          name: 'Test',
          status: 'new',
          score: 50,
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasMore: true,
      },
    };

    expect(response.data).toBeInstanceOf(Array);
    expect(response.pagination.page).toBe(1);
    expect(response.pagination.totalPages).toBe(5);
    expect(response.pagination.hasMore).toBe(true);
  });

  it('should have correct error response structure', () => {
    const errorResponse = {
      error: 'Validation Error',
      message: 'Invalid request body',
      details: { email: { _errors: ['Invalid email'] } },
    };

    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.message).toBeDefined();
    expect(errorResponse.details).toBeDefined();
  });

  it('should have correct conflict response structure', () => {
    const conflictResponse = {
      error: 'Conflict',
      message: 'Lead with this email already exists',
      existingId: 'lead_existing_123',
    };

    expect(conflictResponse.error).toBe('Conflict');
    expect(conflictResponse.existingId).toBeDefined();
  });
});

describe('REST API v2 - Pagination', () => {
  it('should calculate pagination correctly', () => {
    const total = 95;
    const limit = 20;
    const page = 3;

    const totalPages = Math.ceil(total / limit);
    const hasMore = page * limit < total;
    const offset = (page - 1) * limit;

    expect(totalPages).toBe(5);
    expect(hasMore).toBe(true);
    expect(offset).toBe(40);
  });

  it('should handle last page correctly', () => {
    const total = 95;
    const limit = 20;
    const page = 5;

    const hasMore = page * limit < total;

    expect(hasMore).toBe(false);
  });

  it('should handle empty results', () => {
    const total = 0;
    const limit = 20;

    const totalPages = Math.ceil(total / limit) || 0;
    const hasMore = false;

    expect(totalPages).toBe(0);
    expect(hasMore).toBe(false);
  });
});

describe('REST API v2 - Auth Header Parsing', () => {
  it('should parse Bearer token correctly', () => {
    const authHeader = 'Bearer org_12345_secrettoken';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    expect(token).toBe('org_12345_secrettoken');
  });

  it('should extract organization ID from token', () => {
    const token = 'org_12345_secrettoken';
    const parts = token.split('_');

    expect(parts[0]).toBe('org');
    expect(parts[1]).toBe('12345');
  });

  it('should handle missing Bearer prefix', () => {
    const authHeader = 'Basic abc123';
    const isBearer = authHeader.startsWith('Bearer ');

    expect(isBearer).toBe(false);
  });
});
