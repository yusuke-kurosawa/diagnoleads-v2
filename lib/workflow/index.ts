/**
 * Workflow Module
 *
 * Provides no-code workflow automation
 *
 * @example
 * ```typescript
 * import {
 *   getWorkflowEngine,
 *   WORKFLOW_TEMPLATES,
 *   type WorkflowDefinition,
 * } from '@/lib/workflow';
 *
 * // Create a workflow definition
 * const workflow: WorkflowDefinition = {
 *   id: 'wf-1',
 *   name: 'Lead Welcome Flow',
 *   organizationId: 'org-123',
 *   status: 'active',
 *   nodes: [
 *     {
 *       id: 'trigger-1',
 *       type: 'trigger',
 *       name: 'New Lead',
 *       config: { triggerType: 'lead_created' },
 *     },
 *     {
 *       id: 'condition-1',
 *       type: 'condition',
 *       name: 'Check Email',
 *       config: {
 *         conditions: [{ field: 'trigger.email', operator: 'exists', value: true }],
 *         operator: 'and',
 *       },
 *     },
 *     {
 *       id: 'action-1',
 *       type: 'action',
 *       name: 'Send Email',
 *       config: {
 *         actionType: 'send_email',
 *         params: {
 *           to: '{{trigger.email}}',
 *           template: 'welcome',
 *         },
 *       },
 *     },
 *   ],
 *   edges: [
 *     { id: 'e1', source: 'trigger-1', target: 'condition-1' },
 *     { id: 'e2', source: 'condition-1', target: 'action-1', condition: 'true' },
 *   ],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 *
 * // Execute the workflow
 * const engine = getWorkflowEngine();
 * const execution = await engine.execute(workflow, {
 *   email: 'lead@example.com',
 *   name: 'John Doe',
 * });
 *
 * console.log(execution.status); // 'completed'
 * console.log(execution.steps);  // Execution steps
 *
 * // Use templates
 * const template = WORKFLOW_TEMPLATES.find(t => t.id === 'lead-welcome');
 * ```
 */

export * from './types';
export * from './engine';
