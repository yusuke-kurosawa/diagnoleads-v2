/**
 * API Documentation Module
 *
 * Provides OpenAPI specification generation
 *
 * @example
 * ```typescript
 * import {
 *   createOpenAPIGenerator,
 *   generateOpenAPI,
 *   getAllModules,
 *   type ApiModule,
 *   type ApiEndpoint,
 * } from '@/lib/api-docs';
 *
 * // Generate full OpenAPI spec
 * const spec = generateOpenAPI(getAllModules());
 *
 * // Or use generator for more control
 * const generator = createOpenAPIGenerator({
 *   title: 'My API',
 *   version: '1.0.0',
 * });
 *
 * generator.registerModule({
 *   name: 'custom',
 *   description: 'Custom endpoints',
 *   version: '1.0.0',
 *   endpoints: [
 *     {
 *       path: '/api/custom',
 *       method: 'get',
 *       summary: 'Custom endpoint',
 *       tags: ['Custom'],
 *       responses: {
 *         '200': { description: 'Success' },
 *       },
 *     },
 *   ],
 * });
 *
 * // Output as JSON or YAML
 * const json = generator.toJSON();
 * const yaml = generator.toYAML();
 * ```
 */

export * from './types';
export * from './generator';
export * from './modules';
