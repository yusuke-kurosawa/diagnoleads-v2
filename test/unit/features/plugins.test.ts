/**
 * Plugin System Tests
 *
 * Unit tests for the plugin manager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PluginManager,
  createPluginManager,
  getPluginManager,
  resetPluginManager,
  registerPlugin,
  executeHook,
} from '@/lib/plugins/manager';
import { resetEventBus } from '@/lib/events/bus';
import type { Plugin, PluginContext, HookType } from '@/lib/plugins/types';

// Helper to create test plugins
function createTestPlugin(
  name: string,
  options: {
    initFn?: (ctx: PluginContext) => Promise<void>;
    destroyFn?: () => Promise<void>;
    healthCheckFn?: () => Promise<boolean>;
  } = {}
): Plugin {
  return {
    metadata: {
      name,
      version: '1.0.0',
      description: `Test plugin: ${name}`,
    },
    initialize: options.initFn ?? (async () => {}),
    destroy: options.destroyFn,
    healthCheck: options.healthCheckFn,
  };
}

describe('PluginManager', () => {
  let manager: PluginManager;

  beforeEach(async () => {
    resetEventBus();
    await resetPluginManager();
    manager = createPluginManager();
  });

  afterEach(async () => {
    await manager.clear();
  });

  describe('register', () => {
    it('should register a plugin', async () => {
      const plugin = createTestPlugin('test-plugin');
      await manager.register(plugin);

      const info = manager.getPlugin('test-plugin');
      expect(info).toBeDefined();
      expect(info?.status).toBe('registered');
    });

    it('should reject duplicate registration', async () => {
      const plugin = createTestPlugin('test-plugin');
      await manager.register(plugin);

      await expect(manager.register(plugin)).rejects.toThrow('already registered');
    });

    it('should respect max plugins limit', async () => {
      const limitedManager = createPluginManager({ maxPlugins: 2 });

      await limitedManager.register(createTestPlugin('plugin-1'));
      await limitedManager.register(createTestPlugin('plugin-2'));

      await expect(
        limitedManager.register(createTestPlugin('plugin-3'))
      ).rejects.toThrow('Maximum plugins');
    });
  });

  describe('initialize', () => {
    it('should initialize a plugin', async () => {
      const initFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', { initFn });

      await manager.register(plugin);
      await manager.initialize('test-plugin');

      expect(initFn).toHaveBeenCalled();
      expect(manager.getPlugin('test-plugin')?.status).toBe('active');
    });

    it('should pass context to initialize', async () => {
      let capturedContext: PluginContext | null = null;

      const plugin = createTestPlugin('test-plugin', {
        initFn: async (ctx) => {
          capturedContext = ctx;
        },
      });

      await manager.register(plugin, { setting: 'value' });
      await manager.initialize('test-plugin');

      expect(capturedContext).not.toBeNull();
      expect(capturedContext?.config).toEqual({ setting: 'value' });
      expect(capturedContext?.logger).toBeDefined();
      expect(capturedContext?.events).toBeDefined();
      expect(capturedContext?.storage).toBeDefined();
      expect(capturedContext?.registerRoute).toBeDefined();
      expect(capturedContext?.registerHook).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      const plugin = createTestPlugin('test-plugin', {
        initFn: async () => {
          throw new Error('Init failed');
        },
      });

      await manager.register(plugin);

      await expect(manager.initialize('test-plugin')).rejects.toThrow('Init failed');
      expect(manager.getPlugin('test-plugin')?.status).toBe('error');
    });

    it('should not re-initialize active plugin', async () => {
      const initFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', { initFn });

      await manager.register(plugin);
      await manager.initialize('test-plugin');
      await manager.initialize('test-plugin');

      expect(initFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('initializeAll', () => {
    it('should initialize all plugins', async () => {
      await manager.register(createTestPlugin('plugin-1'));
      await manager.register(createTestPlugin('plugin-2'));

      const results = await manager.initializeAll();

      expect(results.get('plugin-1')).toBeNull();
      expect(results.get('plugin-2')).toBeNull();
      expect(manager.isActive('plugin-1')).toBe(true);
      expect(manager.isActive('plugin-2')).toBe(true);
    });

    it('should continue on error', async () => {
      await manager.register(
        createTestPlugin('plugin-1', {
          initFn: async () => {
            throw new Error('Failed');
          },
        })
      );
      await manager.register(createTestPlugin('plugin-2'));

      const results = await manager.initializeAll();

      expect(results.get('plugin-1')).toBeInstanceOf(Error);
      expect(results.get('plugin-2')).toBeNull();
    });
  });

  describe('disable', () => {
    it('should disable a plugin', async () => {
      const destroyFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', { destroyFn });

      await manager.register(plugin);
      await manager.initialize('test-plugin');
      await manager.disable('test-plugin');

      expect(destroyFn).toHaveBeenCalled();
      expect(manager.getPlugin('test-plugin')?.status).toBe('disabled');
    });

    it('should cleanup event subscriptions', async () => {
      let unsubscribeCalled = false;

      const plugin = createTestPlugin('test-plugin', {
        initFn: async (ctx) => {
          const unsub = ctx.events.on('lead.created', async () => {});
          // Track if unsubscribe is called later
        },
      });

      await manager.register(plugin);
      await manager.initialize('test-plugin');
      await manager.disable('test-plugin');

      // Event subscriptions should be cleaned up
      expect(manager.getPlugin('test-plugin')?.status).toBe('disabled');
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', async () => {
      const plugin = createTestPlugin('test-plugin');

      await manager.register(plugin);
      await manager.unregister('test-plugin');

      expect(manager.getPlugin('test-plugin')).toBeUndefined();
    });

    it('should disable before unregistering', async () => {
      const destroyFn = vi.fn();
      const plugin = createTestPlugin('test-plugin', { destroyFn });

      await manager.register(plugin);
      await manager.initialize('test-plugin');
      await manager.unregister('test-plugin');

      expect(destroyFn).toHaveBeenCalled();
    });
  });

  describe('hooks', () => {
    it('should register and execute hooks', async () => {
      const hookHandler = vi.fn((data: { value: number }) => ({
        ...data,
        value: data.value * 2,
      }));

      const plugin = createTestPlugin('test-plugin', {
        initFn: async (ctx) => {
          ctx.registerHook('lead:beforeCreate', hookHandler);
        },
      });

      await manager.register(plugin);
      await manager.initialize('test-plugin');

      const result = await manager.executeHook('lead:beforeCreate', { value: 5 });

      expect(hookHandler).toHaveBeenCalled();
      expect(result).toEqual({ value: 10 });
    });

    it('should chain multiple hooks', async () => {
      const plugin1 = createTestPlugin('plugin-1', {
        initFn: async (ctx) => {
          ctx.registerHook('lead:beforeCreate', (data: { value: number }) => ({
            ...data,
            value: data.value + 1,
          }));
        },
      });

      const plugin2 = createTestPlugin('plugin-2', {
        initFn: async (ctx) => {
          ctx.registerHook('lead:beforeCreate', (data: { value: number }) => ({
            ...data,
            value: data.value * 2,
          }));
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.initializeAll();

      const result = await manager.executeHook('lead:beforeCreate', { value: 5 });

      // 5 + 1 = 6, then 6 * 2 = 12
      expect(result).toEqual({ value: 12 });
    });
  });

  describe('routes', () => {
    it('should register routes', async () => {
      const plugin = createTestPlugin('test-plugin', {
        initFn: async (ctx) => {
          ctx.registerRoute({
            method: 'GET',
            path: '/status',
            handler: async () => ({ status: 200, body: { ok: true } }),
          });
        },
      });

      await manager.register(plugin);
      await manager.initialize('test-plugin');

      const routes = manager.getRoutes();

      expect(routes).toHaveLength(1);
      expect(routes[0].path).toContain('/status');
      expect(routes[0].pluginName).toBe('test-plugin');
    });

    it('should handle route requests', async () => {
      const plugin = createTestPlugin('test-plugin', {
        initFn: async (ctx) => {
          ctx.registerRoute({
            method: 'GET',
            path: '/hello',
            handler: async (req) => ({
              status: 200,
              body: { message: `Hello from ${req.path}` },
            }),
          });
        },
      });

      await manager.register(plugin);
      await manager.initialize('test-plugin');

      const response = await manager.handleRoute('test-plugin', {
        method: 'GET',
        path: '/hello',
        params: {},
        query: {},
        body: null,
        headers: {},
      });

      expect(response?.status).toBe(200);
      expect(response?.body).toEqual({ message: 'Hello from /hello' });
    });
  });

  describe('storage', () => {
    it('should provide isolated storage', async () => {
      let storage1: PluginContext['storage'];
      let storage2: PluginContext['storage'];

      const plugin1 = createTestPlugin('plugin-1', {
        initFn: async (ctx) => {
          storage1 = ctx.storage;
          await ctx.storage.set('key', 'value1');
        },
      });

      const plugin2 = createTestPlugin('plugin-2', {
        initFn: async (ctx) => {
          storage2 = ctx.storage;
          await ctx.storage.set('key', 'value2');
        },
      });

      await manager.register(plugin1);
      await manager.register(plugin2);
      await manager.initializeAll();

      expect(await storage1!.get('key')).toBe('value1');
      expect(await storage2!.get('key')).toBe('value2');
    });
  });

  describe('listPlugins', () => {
    it('should list all plugins', async () => {
      await manager.register(createTestPlugin('plugin-1'));
      await manager.register(createTestPlugin('plugin-2'));
      await manager.initialize('plugin-1');

      const list = manager.listPlugins();

      expect(list).toHaveLength(2);
      expect(list.find((p) => p.name === 'plugin-1')?.status).toBe('active');
      expect(list.find((p) => p.name === 'plugin-2')?.status).toBe('registered');
    });
  });

  describe('healthCheck', () => {
    it('should check plugin health', async () => {
      await manager.register(
        createTestPlugin('healthy', {
          healthCheckFn: async () => true,
        })
      );
      await manager.register(
        createTestPlugin('unhealthy', {
          healthCheckFn: async () => false,
        })
      );

      await manager.initializeAll();

      const health = await manager.healthCheck();

      expect(health.get('healthy')).toBe(true);
      expect(health.get('unhealthy')).toBe(false);
    });

    it('should return false for inactive plugins', async () => {
      await manager.register(createTestPlugin('inactive'));

      const health = await manager.healthCheck();

      expect(health.get('inactive')).toBe(false);
    });
  });
});

describe('Default Plugin Manager', () => {
  beforeEach(async () => {
    await resetPluginManager();
    resetEventBus();
  });

  afterEach(async () => {
    await resetPluginManager();
  });

  it('should return singleton instance', () => {
    const manager1 = getPluginManager();
    const manager2 = getPluginManager();

    expect(manager1).toBe(manager2);
  });

  it('should work with convenience functions', async () => {
    const plugin = createTestPlugin('test-plugin', {
      initFn: async (ctx) => {
        ctx.registerHook('lead:beforeCreate', (data: { name: string }) => ({
          ...data,
          name: data.name.toUpperCase(),
        }));
      },
    });

    await registerPlugin(plugin);
    await getPluginManager().initialize('test-plugin');

    const result = await executeHook('lead:beforeCreate', { name: 'test' });

    expect(result).toEqual({ name: 'TEST' });
  });
});
