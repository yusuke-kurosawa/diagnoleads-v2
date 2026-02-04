/**
 * Plugin System Types
 *
 * Type definitions for the plugin architecture
 */

import type { EventType, EventHandler } from '@/lib/events/types';

/**
 * Plugin status
 */
export type PluginStatus = 'registered' | 'initializing' | 'active' | 'error' | 'disabled';

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: string[];
}

/**
 * Plugin context passed during initialization
 */
export interface PluginContext {
  /** Plugin configuration */
  config: Record<string, unknown>;
  /** Logger instance */
  logger: PluginLogger;
  /** Event system access */
  events: {
    on: <T>(type: EventType, handler: EventHandler<T>) => () => void;
    emit: <T>(type: EventType, payload: T) => Promise<void>;
  };
  /** Storage for plugin data */
  storage: {
    get: <T>(key: string) => Promise<T | null>;
    set: <T>(key: string, value: T) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  /** Register API routes */
  registerRoute: (route: PluginRoute) => void;
  /** Register hooks */
  registerHook: <T>(hook: HookType, handler: HookHandler<T>) => void;
}

/**
 * Plugin logger
 */
export interface PluginLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Plugin route definition
 */
export interface PluginRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: (req: PluginRequest) => Promise<PluginResponse>;
  middleware?: PluginMiddleware[];
}

/**
 * Plugin request
 */
export interface PluginRequest {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
  user?: { id: string; organizationId?: string };
}

/**
 * Plugin response
 */
export interface PluginResponse {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Plugin middleware
 */
export type PluginMiddleware = (
  req: PluginRequest,
  next: () => Promise<PluginResponse>
) => Promise<PluginResponse>;

/**
 * Hook types
 */
export type HookType =
  // Lead hooks
  | 'lead:beforeCreate'
  | 'lead:afterCreate'
  | 'lead:beforeUpdate'
  | 'lead:afterUpdate'
  | 'lead:beforeDelete'
  | 'lead:afterDelete'
  | 'lead:beforeScore'
  | 'lead:afterScore'
  // Organization hooks
  | 'organization:beforeCreate'
  | 'organization:afterCreate'
  // Webhook hooks
  | 'webhook:beforeSend'
  | 'webhook:afterSend'
  // Diagnostic hooks
  | 'diagnostic:beforeSubmit'
  | 'diagnostic:afterSubmit'
  // Export hooks
  | 'export:beforeGenerate'
  | 'export:afterGenerate';

/**
 * Hook handler
 */
export type HookHandler<T = unknown> = (data: T) => Promise<T | void> | T | void;

/**
 * Plugin definition
 */
export interface Plugin {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** Initialize the plugin */
  initialize: (context: PluginContext) => Promise<void>;
  /** Cleanup when plugin is disabled/removed */
  destroy?: () => Promise<void>;
  /** Health check */
  healthCheck?: () => Promise<boolean>;
}

/**
 * Plugin instance (internal)
 */
export interface PluginInstance {
  plugin: Plugin;
  status: PluginStatus;
  config: Record<string, unknown>;
  routes: PluginRoute[];
  hooks: Map<HookType, HookHandler[]>;
  eventUnsubscribers: Array<() => void>;
  error?: Error;
  loadedAt?: Date;
  initializedAt?: Date;
}

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Plugin storage prefix */
  storagePrefix?: string;
  /** Enable plugin routes */
  enableRoutes?: boolean;
  /** Route prefix for plugins */
  routePrefix?: string;
  /** Maximum plugins */
  maxPlugins?: number;
}

/**
 * Plugin info (public)
 */
export interface PluginInfo {
  name: string;
  version: string;
  status: PluginStatus;
  description?: string;
  loadedAt?: Date;
  initializedAt?: Date;
  error?: string;
}
