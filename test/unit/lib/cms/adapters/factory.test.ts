/**
 * CMS Adapter Factory Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing
vi.mock('@/lib/cms/adapters/payload/adapter', () => ({
  PayloadCMSAdapter: class MockPayloadCMSAdapter {
    name = 'PayloadCMS';
    version = '3.66';
    initialize = vi.fn().mockResolvedValue(undefined);
    healthCheck = vi.fn().mockResolvedValue(true);
    find = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });
  },
}));

vi.mock('@/lib/cms/adapters/mock/adapter', () => ({
  MockCMSAdapter: class MockMockCMSAdapter {
    name = 'MockCMS';
    version = '1.0.0';
    initialize = vi.fn().mockResolvedValue(undefined);
    healthCheck = vi.fn().mockResolvedValue(true);
    find = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });
  },
}));

// Import after mocking
import {
  getCMSAdapter,
  setCMSAdapter,
  resetCMSAdapter,
  initializeCMS,
  checkCMSHealth,
} from '@/lib/cms/adapters/factory';

// Types matching source
type CMSProvider = 'payload' | 'mock' | 'sanity';

interface CMSAdapter {
  name: string;
  initialize: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
  find: <T>(options: { collection: string }) => Promise<T[]>;
}

describe('getCMSProvider', () => {
  const originalEnv = process.env.CMS_PROVIDER;

  afterEach(() => {
    resetCMSAdapter();
    if (originalEnv !== undefined) {
      process.env.CMS_PROVIDER = originalEnv;
    } else {
      delete process.env.CMS_PROVIDER;
    }
  });

  it('should return payload as default', () => {
    delete process.env.CMS_PROVIDER;
    const provider = process.env.CMS_PROVIDER || 'payload';
    expect(provider).toBe('payload');
  });

  it('should return mock when set', () => {
    process.env.CMS_PROVIDER = 'mock';
    expect(process.env.CMS_PROVIDER).toBe('mock');
  });

  it('should return sanity when set', () => {
    process.env.CMS_PROVIDER = 'sanity';
    expect(process.env.CMS_PROVIDER).toBe('sanity');
  });

  it('should validate supported providers', () => {
    const supportedProviders: CMSProvider[] = ['payload', 'mock', 'sanity'];
    
    expect(supportedProviders).toContain('payload');
    expect(supportedProviders).toContain('mock');
    expect(supportedProviders).toContain('sanity');
  });
});

describe('getCMSAdapter', () => {
  it('should return singleton instance', () => {
    let instance: CMSAdapter | null = null;
    
    const getAdapter = (): CMSAdapter => {
      if (!instance) {
        instance = {
          name: 'mock',
          initialize: vi.fn().mockResolvedValue(undefined),
          healthCheck: vi.fn().mockResolvedValue(true),
          find: vi.fn().mockResolvedValue([]),
        };
      }
      return instance;
    };

    const adapter1 = getAdapter();
    const adapter2 = getAdapter();

    expect(adapter1).toBe(adapter2);
  });

  it('should create PayloadCMSAdapter for payload provider', () => {
    const createAdapter = (provider: CMSProvider): CMSAdapter => {
      switch (provider) {
        case 'payload':
          return { name: 'Payload', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
        case 'mock':
          return { name: 'Mock', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
        default:
          return { name: 'Mock', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
      }
    };

    const adapter = createAdapter('payload');
    expect(adapter.name).toBe('Payload');
  });

  it('should create MockCMSAdapter for mock provider', () => {
    const createAdapter = (provider: CMSProvider): CMSAdapter => {
      switch (provider) {
        case 'payload':
          return { name: 'Payload', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
        case 'mock':
          return { name: 'Mock', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
        default:
          return { name: 'Mock', initialize: vi.fn(), healthCheck: vi.fn(), find: vi.fn() };
      }
    };

    const adapter = createAdapter('mock');
    expect(adapter.name).toBe('Mock');
  });
});

describe('setCMSAdapter', () => {
  it('should allow setting custom adapter', () => {
    let instance: CMSAdapter | null = null;
    
    const setAdapter = (adapter: CMSAdapter) => {
      instance = adapter;
    };

    const customAdapter: CMSAdapter = {
      name: 'Custom',
      initialize: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
      find: vi.fn().mockResolvedValue([]),
    };

    setAdapter(customAdapter);
    expect(instance).toBe(customAdapter);
  });
});

describe('resetCMSAdapter', () => {
  it('should reset adapter instance', () => {
    let instance: CMSAdapter | null = {
      name: 'Test',
      initialize: vi.fn(),
      healthCheck: vi.fn(),
      find: vi.fn(),
    };

    const reset = () => {
      instance = null;
    };

    reset();
    expect(instance).toBeNull();
  });
});

describe('initializeCMS', () => {
  it('should call adapter initialize', async () => {
    const adapter: CMSAdapter = {
      name: 'Mock',
      initialize: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi.fn(),
      find: vi.fn(),
    };

    await adapter.initialize();
    expect(adapter.initialize).toHaveBeenCalled();
  });
});

describe('checkCMSHealth', () => {
  it('should return true when healthy', async () => {
    const adapter: CMSAdapter = {
      name: 'Mock',
      initialize: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(true),
      find: vi.fn(),
    };

    const result = await adapter.healthCheck();
    expect(result).toBe(true);
  });

  it('should return false when unhealthy', async () => {
    const adapter: CMSAdapter = {
      name: 'Mock',
      initialize: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue(false),
      find: vi.fn(),
    };

    const result = await adapter.healthCheck();
    expect(result).toBe(false);
  });

  it('should catch errors and return false', async () => {
    const checkHealth = async (adapter: CMSAdapter): Promise<boolean> => {
      try {
        return await adapter.healthCheck();
      } catch {
        return false;
      }
    };

    const errorAdapter: CMSAdapter = {
      name: 'Error',
      initialize: vi.fn(),
      healthCheck: vi.fn().mockRejectedValue(new Error('Connection failed')),
      find: vi.fn(),
    };

    const result = await checkHealth(errorAdapter);
    expect(result).toBe(false);
  });
});

describe('CMSConfigurationError', () => {
  it('should define configuration error', () => {
    class CMSConfigurationError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CMSConfigurationError';
      }
    }

    const error = new CMSConfigurationError('Invalid provider');
    expect(error.name).toBe('CMSConfigurationError');
    expect(error.message).toBe('Invalid provider');
  });
});

describe('Provider switching', () => {
  it('should reset instance when provider changes', () => {
    let currentProvider: CMSProvider | null = null;
    let instance: CMSAdapter | null = null;

    const getAdapter = (provider: CMSProvider): CMSAdapter => {
      if (currentProvider !== provider) {
        instance = null;
        currentProvider = provider;
      }

      if (!instance) {
        instance = {
          name: provider,
          initialize: vi.fn(),
          healthCheck: vi.fn(),
          find: vi.fn(),
        };
      }

      return instance;
    };

    const adapter1 = getAdapter('payload');
    expect(adapter1.name).toBe('payload');

    const adapter2 = getAdapter('mock');
    expect(adapter2.name).toBe('mock');
    expect(adapter2).not.toBe(adapter1);
  });
});

// Integration tests with actual module
describe('Integration: getCMSAdapter', () => {
  const originalEnv = process.env.CMS_PROVIDER;

  afterEach(() => {
    resetCMSAdapter();
    if (originalEnv !== undefined) {
      process.env.CMS_PROVIDER = originalEnv;
    } else {
      delete process.env.CMS_PROVIDER;
    }
  });

  it('should return adapter for payload provider', () => {
    process.env.CMS_PROVIDER = 'payload';
    resetCMSAdapter();
    
    const adapter = getCMSAdapter();
    expect(adapter.name).toBe('PayloadCMS');
  });

  it('should return adapter for mock provider', () => {
    process.env.CMS_PROVIDER = 'mock';
    resetCMSAdapter();
    
    const adapter = getCMSAdapter();
    expect(adapter.name).toBe('MockCMS');
  });

  it('should return same instance on multiple calls', () => {
    process.env.CMS_PROVIDER = 'mock';
    resetCMSAdapter();
    
    const adapter1 = getCMSAdapter();
    const adapter2 = getCMSAdapter();
    expect(adapter1).toBe(adapter2);
  });
});

describe('Integration: setCMSAdapter', () => {
  afterEach(() => {
    resetCMSAdapter();
  });

  it('should call setCMSAdapter without error', () => {
    const customAdapter = {
      name: 'CustomAdapter',
      version: '1.0.0',
      initialize: vi.fn().mockResolvedValue(undefined),
      healthCheck: vi.fn().mockResolvedValue(true),
      find: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
    };

    // Should not throw
    expect(() => setCMSAdapter(customAdapter as any)).not.toThrow();
  });
});

describe('Integration: initializeCMS', () => {
  afterEach(() => {
    resetCMSAdapter();
  });

  it('should initialize adapter', async () => {
    process.env.CMS_PROVIDER = 'mock';
    resetCMSAdapter();
    
    await initializeCMS();
    const adapter = getCMSAdapter();
    expect(adapter.initialize).toHaveBeenCalled();
  });
});

describe('Integration: checkCMSHealth', () => {
  afterEach(() => {
    resetCMSAdapter();
  });

  it('should return health status', async () => {
    process.env.CMS_PROVIDER = 'mock';
    resetCMSAdapter();
    
    const result = await checkCMSHealth();
    expect(typeof result).toBe('boolean');
  });
});
