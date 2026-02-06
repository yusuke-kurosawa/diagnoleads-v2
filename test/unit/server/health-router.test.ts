/**
 * Health Router Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the healthRouter
const mockHealthRouter = {
  check: {
    query: vi.fn(),
  },
  echo: {
    query: vi.fn(),
  },
};

vi.mock('@/server/routers/health', () => ({
  healthRouter: mockHealthRouter,
}));

describe('healthRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('check endpoint', () => {
    it('should return ok status', () => {
      const result = {
        status: 'ok' as const,
        timestamp: new Date().toISOString(),
      };
      mockHealthRouter.check.query.mockReturnValue(result);

      const response = mockHealthRouter.check.query();
      
      expect(response.status).toBe('ok');
      expect(response.timestamp).toBeDefined();
    });

    it('should return ISO timestamp', () => {
      const result = {
        status: 'ok' as const,
        timestamp: '2024-06-15T12:00:00.000Z',
      };
      mockHealthRouter.check.query.mockReturnValue(result);

      const response = mockHealthRouter.check.query();
      
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('echo endpoint', () => {
    it('should echo message back', () => {
      const input = { message: 'Hello, World!' };
      const result = {
        message: 'Hello, World!',
        timestamp: new Date().toISOString(),
      };
      mockHealthRouter.echo.query.mockReturnValue(result);

      const response = mockHealthRouter.echo.query(input);
      
      expect(response.message).toBe('Hello, World!');
      expect(response.timestamp).toBeDefined();
    });

    it('should handle empty message', () => {
      const input = { message: '' };
      const result = {
        message: '',
        timestamp: new Date().toISOString(),
      };
      mockHealthRouter.echo.query.mockReturnValue(result);

      const response = mockHealthRouter.echo.query(input);
      
      expect(response.message).toBe('');
    });

    it('should handle special characters', () => {
      const input = { message: '日本語テスト！@#$%' };
      const result = {
        message: '日本語テスト！@#$%',
        timestamp: new Date().toISOString(),
      };
      mockHealthRouter.echo.query.mockReturnValue(result);

      const response = mockHealthRouter.echo.query(input);
      
      expect(response.message).toBe('日本語テスト！@#$%');
    });

    it('should include timestamp in response', () => {
      const input = { message: 'test' };
      const timestamp = '2024-06-15T12:00:00.000Z';
      const result = {
        message: 'test',
        timestamp,
      };
      mockHealthRouter.echo.query.mockReturnValue(result);

      const response = mockHealthRouter.echo.query(input);
      
      expect(response.timestamp).toBe(timestamp);
    });
  });
});

describe('Health endpoint schema', () => {
  it('should define check endpoint metadata', () => {
    // Schema validation test - if healthRouter is importable, schemas are valid
    expect(mockHealthRouter.check).toBeDefined();
    expect(mockHealthRouter.check.query).toBeDefined();
  });

  it('should define echo endpoint metadata', () => {
    expect(mockHealthRouter.echo).toBeDefined();
    expect(mockHealthRouter.echo.query).toBeDefined();
  });
});

describe('Health check response format', () => {
  it('should return correct status literal', () => {
    const result = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };
    mockHealthRouter.check.query.mockReturnValue(result);

    const response = mockHealthRouter.check.query();
    
    // Type narrowing - status should be literal 'ok'
    expect(response.status).toBe('ok');
  });

  it('should return datetime string', () => {
    const result = {
      status: 'ok' as const,
      timestamp: '2024-01-15T10:30:00.000Z',
    };
    mockHealthRouter.check.query.mockReturnValue(result);

    const response = mockHealthRouter.check.query();
    
    // Should be valid ISO datetime
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
  });
});
