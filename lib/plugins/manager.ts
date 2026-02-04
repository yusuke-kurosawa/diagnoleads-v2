/**
 * Plugin Manager
 *
 * Manages plugin lifecycle: registration, initialization, and cleanup
 */

import { getEventBus } from '@/lib/events/bus';
import type { EventType, EventHandler } from '@/lib/events/types';
import type {
  Plugin,
  PluginContext,
  PluginInfo,
  PluginInstance,
  PluginLogger,
  PluginManagerConfig,
  PluginRoute,
  PluginStatus,
  HookType,
  HookHandler,
  PluginRequest,
  PluginResponse,
} from './types';

/**
 * Plugin Manager
 */
export class PluginManager {
  private plugins = new Map<string, PluginInstance>();
  private globalHooks = new Map<HookType, HookHandler[]>();
  private config: Required<PluginManagerConfig>;
  private storage = new Map<string, unknown>();

  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      storagePrefix: config.storagePrefix ?? 'plugin',
      enableRoutes: config.enableRoutes ?? true,
      routePrefix: config.routePrefix ?? '/api/plugins',
      maxPlugins: config.maxPlugins ?? 50,
    };
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin, config: Record<string, unknown> = {}): Promise<void> {
    const { name } = plugin.metadata;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin already registered: ${name}`);
    }

    if (this.plugins.size >= this.config.maxPlugins) {
      throw new Error(`Maximum plugins (${this.config.maxPlugins}) reached`);
    }

    const instance: PluginInstance = {
      plugin,
      status: 'registered',
      config,
      routes: [],
      hooks: new Map(),
      eventUnsubscribers: [],
      loadedAt: new Date(),
    };

    this.plugins.set(name, instance);
  }

  /**
   * Initialize a plugin
   */
  async initialize(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    if (instance.status === 'active') {
      return; // Already initialized
    }

    instance.status = 'initializing';

    try {
      const context = this.createContext(name, instance);
      await instance.plugin.initialize(context);

      instance.status = 'active';
      instance.initializedAt = new Date();

      // Register hooks globally
      for (const [hookType, handlers] of instance.hooks) {
        if (!this.globalHooks.has(hookType)) {
          this.globalHooks.set(hookType, []);
        }
        this.globalHooks.get(hookType)!.push(...handlers);
      }
    } catch (error) {
      instance.status = 'error';
      instance.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initializeAll(): Promise<Map<string, Error | null>> {
    const results = new Map<string, Error | null>();

    for (const name of this.plugins.keys()) {
      try {
        await this.initialize(name);
        results.set(name, null);
      } catch (error) {
        results.set(name, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return results;
  }

  /**
   * Disable a plugin
   */
  async disable(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`);
    }

    // Cleanup event subscriptions
    for (const unsubscribe of instance.eventUnsubscribers) {
      unsubscribe();
    }
    instance.eventUnsubscribers = [];

    // Remove hooks
    for (const [hookType, handlers] of instance.hooks) {
      const globalHandlers = this.globalHooks.get(hookType);
      if (globalHandlers) {
        for (const handler of handlers) {
          const index = globalHandlers.indexOf(handler);
          if (index !== -1) {
            globalHandlers.splice(index, 1);
          }
        }
      }
    }
    instance.hooks.clear();

    // Call destroy if available
    if (instance.plugin.destroy) {
      await instance.plugin.destroy();
    }

    instance.status = 'disabled';
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const instance = this.plugins.get(name);
    if (!instance) {
      return;
    }

    if (instance.status === 'active') {
      await this.disable(name);
    }

    this.plugins.delete(name);
  }

  /**
   * Get plugin info
   */
  getPlugin(name: string): PluginInfo | undefined {
    const instance = this.plugins.get(name);
    if (!instance) return undefined;

    return {
      name: instance.plugin.metadata.name,
      version: instance.plugin.metadata.version,
      status: instance.status,
      description: instance.plugin.metadata.description,
      loadedAt: instance.loadedAt,
      initializedAt: instance.initializedAt,
      error: instance.error?.message,
    };
  }

  /**
   * List all plugins
   */
  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values()).map((instance) => ({
      name: instance.plugin.metadata.name,
      version: instance.plugin.metadata.version,
      status: instance.status,
      description: instance.plugin.metadata.description,
      loadedAt: instance.loadedAt,
      initializedAt: instance.initializedAt,
      error: instance.error?.message,
    }));
  }

  /**
   * Check if plugin is active
   */
  isActive(name: string): boolean {
    const instance = this.plugins.get(name);
    return instance?.status === 'active';
  }

  /**
   * Execute a hook
   */
  async executeHook<T>(hookType: HookType, data: T): Promise<T> {
    const handlers = this.globalHooks.get(hookType) ?? [];
    let result = data;

    for (const handler of handlers) {
      const handlerResult = await handler(result);
      if (handlerResult !== undefined) {
        result = handlerResult as T;
      }
    }

    return result;
  }

  /**
   * Get routes from all active plugins
   */
  getRoutes(): Array<PluginRoute & { pluginName: string }> {
    const routes: Array<PluginRoute & { pluginName: string }> = [];

    for (const [name, instance] of this.plugins) {
      if (instance.status === 'active') {
        for (const route of instance.routes) {
          routes.push({
            ...route,
            path: `${this.config.routePrefix}/${name}${route.path}`,
            pluginName: name,
          });
        }
      }
    }

    return routes;
  }

  /**
   * Handle a plugin route request
   */
  async handleRoute(pluginName: string, request: PluginRequest): Promise<PluginResponse | null> {
    const instance = this.plugins.get(pluginName);
    if (!instance || instance.status !== 'active') {
      return null;
    }

    const route = instance.routes.find(
      (r) => r.method === request.method && this.matchPath(r.path, request.path)
    );

    if (!route) {
      return null;
    }

    // Apply middleware
    let handler = async () => route.handler(request);
    if (route.middleware) {
      for (const middleware of [...route.middleware].reverse()) {
        const next = handler;
        handler = async () => middleware(request, next);
      }
    }

    return handler();
  }

  /**
   * Health check all plugins
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, instance] of this.plugins) {
      if (instance.status !== 'active') {
        results.set(name, false);
        continue;
      }

      if (instance.plugin.healthCheck) {
        try {
          const healthy = await instance.plugin.healthCheck();
          results.set(name, healthy);
        } catch {
          results.set(name, false);
        }
      } else {
        results.set(name, true);
      }
    }

    return results;
  }

  /**
   * Clear all plugins (for testing)
   */
  async clear(): Promise<void> {
    for (const name of Array.from(this.plugins.keys())) {
      await this.unregister(name);
    }
    this.globalHooks.clear();
    this.storage.clear();
  }

  private createContext(name: string, instance: PluginInstance): PluginContext {
    const eventBus = getEventBus();
    const storagePrefix = `${this.config.storagePrefix}:${name}:`;

    return {
      config: instance.config,

      logger: this.createLogger(name),

      events: {
        on: <T>(type: EventType, handler: EventHandler<T>) => {
          const unsubscribe = eventBus.on(type, handler);
          instance.eventUnsubscribers.push(unsubscribe);
          return unsubscribe;
        },
        emit: async <T>(type: EventType, payload: T) => {
          await eventBus.emit(type, payload);
        },
      },

      storage: {
        get: async <T>(key: string) => {
          return this.storage.get(`${storagePrefix}${key}`) as T | null;
        },
        set: async <T>(key: string, value: T) => {
          this.storage.set(`${storagePrefix}${key}`, value);
        },
        delete: async (key: string) => {
          this.storage.delete(`${storagePrefix}${key}`);
        },
      },

      registerRoute: (route: PluginRoute) => {
        if (this.config.enableRoutes) {
          instance.routes.push(route);
        }
      },

      registerHook: <T>(hookType: HookType, handler: HookHandler<T>) => {
        if (!instance.hooks.has(hookType)) {
          instance.hooks.set(hookType, []);
        }
        instance.hooks.get(hookType)!.push(handler as HookHandler);
      },
    };
  }

  private createLogger(pluginName: string): PluginLogger {
    const prefix = `[Plugin:${pluginName}]`;

    return {
      debug: (message: string, ...args: unknown[]) =>
        console.debug(`${prefix} ${message}`, ...args),
      info: (message: string, ...args: unknown[]) => console.info(`${prefix} ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) => console.warn(`${prefix} ${message}`, ...args),
      error: (message: string, ...args: unknown[]) =>
        console.error(`${prefix} ${message}`, ...args),
    };
  }

  private matchPath(pattern: string, path: string): boolean {
    // Simple path matching (could be enhanced with path-to-regexp)
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue; // Parameter match
      }
      if (patternParts[i] !== pathParts[i]) {
        return false;
      }
    }

    return true;
  }
}

// Default plugin manager instance
let defaultManager: PluginManager | null = null;

/**
 * Get the default plugin manager
 */
export function getPluginManager(): PluginManager {
  if (!defaultManager) {
    defaultManager = new PluginManager();
  }
  return defaultManager;
}

/**
 * Create a new plugin manager
 */
export function createPluginManager(config?: PluginManagerConfig): PluginManager {
  return new PluginManager(config);
}

/**
 * Reset the default plugin manager (for testing)
 */
export async function resetPluginManager(): Promise<void> {
  if (defaultManager) {
    await defaultManager.clear();
  }
  defaultManager = null;
}

// Convenience functions

/**
 * Register a plugin with the default manager
 */
export async function registerPlugin(
  plugin: Plugin,
  config?: Record<string, unknown>
): Promise<void> {
  return getPluginManager().register(plugin, config);
}

/**
 * Execute a hook with the default manager
 */
export async function executeHook<T>(hookType: HookType, data: T): Promise<T> {
  return getPluginManager().executeHook(hookType, data);
}
