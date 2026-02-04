/**
 * Plugin System Module
 *
 * Provides extensibility through plugins
 *
 * @example
 * ```typescript
 * import {
 *   getPluginManager,
 *   registerPlugin,
 *   executeHook,
 *   type Plugin,
 *   type PluginContext,
 * } from '@/lib/plugins';
 *
 * // Define a plugin
 * const myPlugin: Plugin = {
 *   metadata: {
 *     name: 'my-plugin',
 *     version: '1.0.0',
 *     description: 'My custom plugin',
 *   },
 *
 *   async initialize(ctx: PluginContext) {
 *     ctx.logger.info('Plugin initialized');
 *
 *     // Subscribe to events
 *     ctx.events.on('lead.created', async (event) => {
 *       ctx.logger.info('Lead created:', event.payload);
 *     });
 *
 *     // Register hooks
 *     ctx.registerHook('lead:beforeCreate', async (lead) => {
 *       return { ...lead, source: 'my-plugin' };
 *     });
 *
 *     // Register routes
 *     ctx.registerRoute({
 *       method: 'GET',
 *       path: '/status',
 *       handler: async () => ({ status: 200, body: { ok: true } }),
 *     });
 *
 *     // Use storage
 *     await ctx.storage.set('counter', 0);
 *   },
 *
 *   async destroy() {
 *     console.log('Plugin destroyed');
 *   },
 * };
 *
 * // Register and initialize
 * await registerPlugin(myPlugin, { apiKey: 'xxx' });
 * const manager = getPluginManager();
 * await manager.initialize('my-plugin');
 *
 * // Execute hooks
 * const lead = await executeHook('lead:beforeCreate', { email: 'test@example.com' });
 * ```
 */

export * from './types';
export * from './manager';
