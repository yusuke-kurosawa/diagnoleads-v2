// Set environment variables BEFORE any imports
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_NAME = 'DiagnoLeads';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Anthropic SDK to avoid browser environment check
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    constructor() {}
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mock response' }],
      }),
    };
  },
  Anthropic: class MockAnthropic {
    constructor() {}
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mock response' }],
      }),
    };
  },
}));

// Mock AI SDK
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => ({
    doGenerate: vi.fn(),
  })),
  createAnthropic: vi.fn(() => ({
    doGenerate: vi.fn(),
  })),
}));

// Mock lib/env to avoid t3-env validation issues
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    BETTER_AUTH_SECRET: 'test-secret-key-for-testing-only',
    BETTER_AUTH_URL: 'http://localhost:3000',
    ANTHROPIC_API_KEY: 'test-api-key',
    RESEND_API_KEY: 'test-resend-key',
    OPENAI_API_KEY: 'test-openai-key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'DiagnoLeads',
  },
}));

// Mock database client
vi.mock('@/lib/db/client', () => ({
  db: {
    query: {},
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

// Mock Payload CMS
vi.mock('@payload-config', () => ({
  default: {},
}));

vi.mock('@/lib/cms/adapters/payload/adapter', () => ({
  PayloadCMSAdapter: class {
    async initialize() {}
    async getBlogs() {
      return [];
    }
    async getFAQs() {
      return [];
    }
  },
}));

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({}),
}));
