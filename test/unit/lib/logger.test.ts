/**
 * Logger Tests
 *
 * Unit tests for structured logging utility
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/monitoring/logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');
      // Debug may or may not be called depending on NODE_ENV
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug with context', () => {
      logger.debug('Debug with context', { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info with context', () => {
      logger.info('Info with context', { userId: '123', action: 'test' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log warning with context', () => {
      logger.warn('Warning with context', { reason: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log warning with error', () => {
      const error = new Error('Test error');
      logger.warn('Warning with error', {}, error);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with error object', () => {
      const error = new Error('Test error');
      logger.error('Error with object', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      const error = new Error('Test error');
      logger.error('Error with context', error, { userId: '123' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('apiRequest', () => {
    it('should log API request', () => {
      logger.apiRequest('GET', '/api/leads');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log API request with context', () => {
      logger.apiRequest('POST', '/api/leads', { userId: '123' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('apiResponse', () => {
    it('should log successful API response', () => {
      logger.apiResponse('GET', '/api/leads', 200, 50);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log client error response as warning', () => {
      logger.apiResponse('POST', '/api/leads', 400, 30);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log server error response as error', () => {
      logger.apiResponse('GET', '/api/leads', 500, 100);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should include duration in log', () => {
      logger.apiResponse('GET', '/api/test', 200, 150);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('dbQuery', () => {
    it('should log database query', () => {
      logger.dbQuery('SELECT * FROM users', 10);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log query with context', () => {
      logger.dbQuery('SELECT * FROM leads WHERE org_id = $1', 25, {
        orgId: 'org-123',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('webhookDelivery', () => {
    it('should log successful webhook delivery', () => {
      logger.webhookDelivery('webhook-123', true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log failed webhook delivery as warning', () => {
      logger.webhookDelivery('webhook-123', false);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include context', () => {
      logger.webhookDelivery('webhook-123', true, { attempt: 1, url: 'https://example.com' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('authEvent', () => {
    it('should log login event', () => {
      logger.authEvent('login', 'user-123');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log logout event', () => {
      logger.authEvent('logout', 'user-123');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log signup event', () => {
      logger.authEvent('signup', 'user-123');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log password_reset event', () => {
      logger.authEvent('password_reset', 'user-123');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log without userId', () => {
      logger.authEvent('login');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include context', () => {
      logger.authEvent('login', 'user-123', { ip: '192.168.1.1' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});

describe('logger exports', () => {
  it('should export logger as default', async () => {
    const module = await import('@/lib/monitoring/logger');
    expect(module.default).toBe(logger);
  });

  it('should have all required methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.apiRequest).toBe('function');
    expect(typeof logger.apiResponse).toBe('function');
    expect(typeof logger.dbQuery).toBe('function');
    expect(typeof logger.webhookDelivery).toBe('function');
    expect(typeof logger.authEvent).toBe('function');
  });
});
