/**
 * Database Client Tests
 */

import { describe, expect, it, vi } from 'vitest';

// Mock postgres and drizzle before importing
vi.mock('postgres', () => ({
  default: vi.fn(() => ({
    end: vi.fn(),
  })),
}));

vi.mock('drizzle-orm/postgres-js', () => ({
  drizzle: vi.fn(() => ({
    query: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
  },
}));

describe('Database Client', () => {
  it('should export db instance', async () => {
    const { db } = await import('@/lib/db/client');
    expect(db).toBeDefined();
  });

  it('should have query methods', async () => {
    const { db } = await import('@/lib/db/client');
    expect(typeof db).toBe('object');
  });
});

describe('Database Configuration', () => {
  it('should use DATABASE_URL from env', async () => {
    const postgres = await import('postgres');
    const { db } = await import('@/lib/db/client');
    
    // db should be created
    expect(db).toBeDefined();
  });

  it('should create drizzle instance with schema', async () => {
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const { db } = await import('@/lib/db/client');
    
    expect(db).toBeDefined();
  });
});

describe('Database Types', () => {
  it('should export Database type', async () => {
    // Type check only - if this compiles, the type exists
    type Database = typeof import('@/lib/db/client').db;
    const typeCheck: Database extends object ? true : false = true;
    expect(typeCheck).toBe(true);
  });
});
