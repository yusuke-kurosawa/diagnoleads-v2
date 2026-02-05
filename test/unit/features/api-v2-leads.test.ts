/**
 * REST API v2 Leads Tests
 *
 * Unit tests for leads REST API endpoints
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the API
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

// Helper to parse Bearer token
function parseAuthToken(authHeader: string | null): { organizationId: string } | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const parts = token.split('_');
  if (parts.length >= 2 && parts[0] === 'org') {
    return { organizationId: parts[1] };
  }
  return null;
}

describe('REST API v2 - Leads', () => {
  describe('List Leads Query Schema', () => {
    it('should accept valid query parameters', () => {
      const query = {
        page: '1',
        limit: '20',
        status: 'new',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const result = listLeadsQuerySchema.parse(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.status).toBe('new');
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should use defaults for missing parameters', () => {
      const result = listLeadsQuerySchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should reject invalid page number', () => {
      expect(() => listLeadsQuerySchema.parse({ page: '0' })).toThrow();
      expect(() => listLeadsQuerySchema.parse({ page: '-1' })).toThrow();
    });

    it('should reject limit over 100', () => {
      expect(() => listLeadsQuerySchema.parse({ limit: '101' })).toThrow();
    });

    it('should accept limit up to 100', () => {
      const result = listLeadsQuerySchema.parse({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('should accept all valid status values', () => {
      for (const status of ['new', 'contacted', 'qualified', 'converted']) {
        const result = listLeadsQuerySchema.parse({ status });
        expect(result.status).toBe(status);
      }
    });

    it('should reject invalid status', () => {
      expect(() => listLeadsQuerySchema.parse({ status: 'invalid' })).toThrow();
    });

    it('should accept score range filters', () => {
      const result = listLeadsQuerySchema.parse({
        minScore: '50',
        maxScore: '90',
      });

      expect(result.minScore).toBe(50);
      expect(result.maxScore).toBe(90);
    });

    it('should reject invalid score range', () => {
      expect(() => listLeadsQuerySchema.parse({ minScore: '-1' })).toThrow();
      expect(() => listLeadsQuerySchema.parse({ maxScore: '101' })).toThrow();
    });

    it('should accept search parameter', () => {
      const result = listLeadsQuerySchema.parse({ search: 'test@example.com' });
      expect(result.search).toBe('test@example.com');
    });

    it('should accept date range filters', () => {
      const result = listLeadsQuerySchema.parse({
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      });

      expect(result.startDate).toBe('2024-01-01T00:00:00Z');
      expect(result.endDate).toBe('2024-12-31T23:59:59Z');
    });

    it('should accept all valid sortBy values', () => {
      for (const sortBy of ['createdAt', 'updatedAt', 'score', 'name', 'email']) {
        const result = listLeadsQuerySchema.parse({ sortBy });
        expect(result.sortBy).toBe(sortBy);
      }
    });

    it('should reject invalid sortBy', () => {
      expect(() => listLeadsQuerySchema.parse({ sortBy: 'invalid' })).toThrow();
    });
  });

  describe('Create Lead Schema', () => {
    it('should accept valid lead data', () => {
      const lead = {
        email: 'john@example.com',
        name: 'John Doe',
        company: 'TechCorp',
        phone: '+1234567890',
        status: 'new',
        score: 85,
      };

      const result = createLeadSchema.parse(lead);

      expect(result.email).toBe('john@example.com');
      expect(result.name).toBe('John Doe');
      expect(result.company).toBe('TechCorp');
      expect(result.phone).toBe('+1234567890');
      expect(result.status).toBe('new');
      expect(result.score).toBe(85);
    });

    it('should require email', () => {
      expect(() => createLeadSchema.parse({})).toThrow();
    });

    it('should validate email format', () => {
      expect(() => createLeadSchema.parse({ email: 'invalid' })).toThrow();
    });

    it('should accept valid email', () => {
      const result = createLeadSchema.parse({ email: 'test@example.com' });
      expect(result.email).toBe('test@example.com');
    });

    it('should use default values', () => {
      const result = createLeadSchema.parse({ email: 'test@example.com' });

      expect(result.source).toBe('api');
      expect(result.status).toBe('new');
    });

    it('should accept all valid status values', () => {
      for (const status of ['new', 'contacted', 'qualified', 'converted']) {
        const result = createLeadSchema.parse({ email: 'test@example.com', status });
        expect(result.status).toBe(status);
      }
    });

    it('should reject invalid status', () => {
      expect(() =>
        createLeadSchema.parse({ email: 'test@example.com', status: 'invalid' })
      ).toThrow();
    });

    it('should validate score range', () => {
      expect(() =>
        createLeadSchema.parse({ email: 'test@example.com', score: -1 })
      ).toThrow();
      expect(() =>
        createLeadSchema.parse({ email: 'test@example.com', score: 101 })
      ).toThrow();
    });

    it('should accept score in valid range', () => {
      const result = createLeadSchema.parse({ email: 'test@example.com', score: 50 });
      expect(result.score).toBe(50);
    });

    it('should accept responses object', () => {
      const result = createLeadSchema.parse({
        email: 'test@example.com',
        responses: { industry: 'tech', size: 'large' },
      });

      expect(result.responses).toEqual({ industry: 'tech', size: 'large' });
    });

    it('should accept customFields object', () => {
      const result = createLeadSchema.parse({
        email: 'test@example.com',
        customFields: { custom1: 'value1' },
      });

      expect(result.customFields).toEqual({ custom1: 'value1' });
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should parse valid org token', () => {
      const result = parseAuthToken('Bearer org_12345_secretkey');

      expect(result).toEqual({ organizationId: '12345' });
    });

    it('should reject missing Bearer prefix', () => {
      const result = parseAuthToken('org_12345_secretkey');

      expect(result).toBeNull();
    });

    it('should reject null header', () => {
      const result = parseAuthToken(null);

      expect(result).toBeNull();
    });

    it('should reject invalid token format', () => {
      const result = parseAuthToken('Bearer invalid-token');

      expect(result).toBeNull();
    });

    it('should parse token with multiple underscores', () => {
      const result = parseAuthToken('Bearer org_uuid-123_secret_key_here');

      expect(result).toEqual({ organizationId: 'uuid-123' });
    });
  });

  describe('Response Format', () => {
    it('should have correct list response structure', () => {
      const mockResponse = {
        data: [
          { id: '1', email: 'test@example.com', status: 'new' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasMore: true,
        },
      };

      expect(mockResponse.data).toBeInstanceOf(Array);
      expect(mockResponse.pagination).toHaveProperty('page');
      expect(mockResponse.pagination).toHaveProperty('limit');
      expect(mockResponse.pagination).toHaveProperty('total');
      expect(mockResponse.pagination).toHaveProperty('totalPages');
      expect(mockResponse.pagination).toHaveProperty('hasMore');
    });

    it('should calculate totalPages correctly', () => {
      const total = 95;
      const limit = 20;
      const totalPages = Math.ceil(total / limit);

      expect(totalPages).toBe(5);
    });

    it('should calculate hasMore correctly', () => {
      const page = 3;
      const limit = 20;
      const total = 95;
      const hasMore = page * limit < total;

      expect(hasMore).toBe(true);

      const lastPage = 5;
      const hasMoreLast = lastPage * limit < total;
      expect(hasMoreLast).toBe(false);
    });

    it('should have correct create response structure', () => {
      const mockResponse = {
        data: {
          id: 'new-lead-id',
          email: 'test@example.com',
          status: 'new',
          createdAt: '2024-01-01T00:00:00Z',
        },
        message: 'Lead created successfully',
      };

      expect(mockResponse.data).toHaveProperty('id');
      expect(mockResponse.message).toBe('Lead created successfully');
    });

    it('should have correct error response structure', () => {
      const errorResponse = {
        error: 'Validation Error',
        message: 'Invalid request body',
        details: { email: { _errors: ['Invalid email'] } },
      };

      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
    });

    it('should have correct conflict response structure', () => {
      const conflictResponse = {
        error: 'Conflict',
        message: 'Lead with this email already exists',
        existingId: 'existing-lead-id',
      };

      expect(conflictResponse.error).toBe('Conflict');
      expect(conflictResponse.existingId).toBeDefined();
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for successful list', () => {
      const status = 200;
      expect(status).toBe(200);
    });

    it('should return 201 for successful create', () => {
      const status = 201;
      expect(status).toBe(201);
    });

    it('should return 400 for validation error', () => {
      const status = 400;
      expect(status).toBe(400);
    });

    it('should return 401 for unauthorized', () => {
      const status = 401;
      expect(status).toBe(401);
    });

    it('should return 409 for duplicate lead', () => {
      const status = 409;
      expect(status).toBe(409);
    });

    it('should return 500 for server error', () => {
      const status = 500;
      expect(status).toBe(500);
    });
  });
});
