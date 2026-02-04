/**
 * AI Agent Module
 *
 * Provides autonomous AI agents with tool use capabilities
 *
 * @example
 * ```typescript
 * import {
 *   createAgent,
 *   createTool,
 *   getBuiltInTools,
 *   AGENT_CONFIGS,
 * } from '@/lib/ai-agent';
 *
 * // Create a simple agent
 * const agent = createAgent({
 *   systemPrompt: 'You are a helpful lead management assistant.',
 *   maxIterations: 5,
 * });
 *
 * // Register built-in tools
 * agent.registerTools(getBuiltInTools());
 *
 * // Or create custom tools
 * agent.registerTool(createTool(
 *   'get_weather',
 *   'Get current weather for a location',
 *   async (params) => {
 *     return { temperature: 72, condition: 'sunny' };
 *   },
 *   {
 *     type: 'object',
 *     properties: {
 *       location: { type: 'string', description: 'City name' },
 *     },
 *     required: ['location'],
 *   }
 * ));
 *
 * // Run the agent
 * const result = await agent.run('Find leads from tech companies', {
 *   organizationId: 'org-123',
 *   userId: 'user-456',
 * });
 *
 * console.log(result.response);
 * console.log(result.steps); // See what the agent did
 *
 * // Use predefined agent types
 * const qualifierAgent = createAgent(AGENT_CONFIGS['lead-qualifier']);
 * ```
 */

export * from './types';
export * from './agent';
export * from './tools';
