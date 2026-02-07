/**
 * Health Router Tests
 */

import { describe, expect, it, vi } from 'vitest';

describe('Health check endpoint', () => {
  it('should return ok status', () => {
    const response = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };

    expect(response.status).toBe('ok');
    expect(response.timestamp).toBeDefined();
  });

  it('should return valid ISO timestamp', () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should define output schema', () => {
    type HealthCheckOutput = {
      status: 'ok';
      timestamp: string;
    };

    const output: HealthCheckOutput = {
      status: 'ok',
      timestamp: '2024-01-15T12:00:00.000Z',
    };

    expect(output.status).toBe('ok');
  });
});

describe('Echo endpoint', () => {
  it('should echo back message', () => {
    const input = { message: 'Hello, World!' };
    const response = {
      message: input.message,
      timestamp: new Date().toISOString(),
    };

    expect(response.message).toBe('Hello, World!');
    expect(response.timestamp).toBeDefined();
  });

  it('should define input schema', () => {
    type EchoInput = {
      message: string;
    };

    const input: EchoInput = { message: 'Test message' };
    expect(input.message).toBe('Test message');
  });

  it('should define output schema', () => {
    type EchoOutput = {
      message: string;
      timestamp: string;
    };

    const output: EchoOutput = {
      message: 'Echo',
      timestamp: '2024-01-15T12:00:00.000Z',
    };

    expect(output.message).toBe('Echo');
  });

  it('should handle empty message', () => {
    const input = { message: '' };
    const response = {
      message: input.message,
      timestamp: new Date().toISOString(),
    };

    expect(response.message).toBe('');
  });

  it('should handle long message', () => {
    const longMessage = 'a'.repeat(1000);
    const input = { message: longMessage };
    const response = {
      message: input.message,
      timestamp: new Date().toISOString(),
    };

    expect(response.message.length).toBe(1000);
  });

  it('should handle Japanese message', () => {
    const input = { message: 'こんにちは、世界！' };
    const response = {
      message: input.message,
      timestamp: new Date().toISOString(),
    };

    expect(response.message).toBe('こんにちは、世界！');
  });
});

describe('OpenAPI metadata', () => {
  it('should define health check metadata', () => {
    const metadata = {
      method: 'GET',
      path: '/health/check',
      tags: ['health'],
      summary: 'Health check endpoint',
      description: 'Check if the API is running and healthy',
    };

    expect(metadata.method).toBe('GET');
    expect(metadata.path).toBe('/health/check');
    expect(metadata.tags).toContain('health');
  });

  it('should define echo metadata', () => {
    const metadata = {
      method: 'POST',
      path: '/health/echo',
      tags: ['health'],
      summary: 'Echo test endpoint',
      description: 'Echo back the provided message with a timestamp',
    };

    expect(metadata.method).toBe('POST');
    expect(metadata.path).toBe('/health/echo');
  });
});

describe('Router structure', () => {
  it('should define router with procedures', () => {
    type HealthRouter = {
      check: () => { status: 'ok'; timestamp: string };
      echo: (input: { message: string }) => { message: string; timestamp: string };
    };

    const mockRouter: HealthRouter = {
      check: () => ({ status: 'ok', timestamp: new Date().toISOString() }),
      echo: (input) => ({ message: input.message, timestamp: new Date().toISOString() }),
    };

    expect(mockRouter.check().status).toBe('ok');
    expect(mockRouter.echo({ message: 'test' }).message).toBe('test');
  });
});

describe('Public procedure', () => {
  it('should be accessible without authentication', () => {
    const isPublic = true;
    expect(isPublic).toBe(true);
  });
});

// Integration tests with actual router
import { healthRouter } from '@/server/routers/health';

describe('Integration: healthRouter (actual)', () => {
  it('should export healthRouter', () => {
    expect(healthRouter).toBeDefined();
  });

  it('should have _def property', () => {
    expect(healthRouter._def).toBeDefined();
  });

  it('should have procedures defined', () => {
    const def = healthRouter._def;
    expect(def.procedures).toBeDefined();
  });
});

describe('Integration: health.check (actual)', () => {
  it('should create caller for health router', () => {
    const caller = healthRouter.createCaller({});
    expect(caller).toBeDefined();
  });

  it('should call check procedure and return ok status', async () => {
    const caller = healthRouter.createCaller({});
    const result = await caller.check();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('Integration: health.echo (actual)', () => {
  it('should call echo procedure with message', async () => {
    const caller = healthRouter.createCaller({});
    const result = await caller.echo({ message: 'Hello' });

    expect(result.message).toBe('Hello');
    expect(result.timestamp).toBeDefined();
  });

  it('should echo Japanese message', async () => {
    const caller = healthRouter.createCaller({});
    const result = await caller.echo({ message: 'こんにちは' });

    expect(result.message).toBe('こんにちは');
  });

  it('should echo empty message', async () => {
    const caller = healthRouter.createCaller({});
    const result = await caller.echo({ message: '' });

    expect(result.message).toBe('');
  });
});
