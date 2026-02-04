/**
 * Event System Module
 *
 * Provides event-driven architecture for loose coupling between components
 *
 * @example
 * ```typescript
 * import { emit, on, once, getEventBus } from '@/lib/events';
 * import type { LeadCreatedPayload } from '@/lib/events';
 *
 * // Subscribe to events
 * const unsubscribe = on<LeadCreatedPayload>('lead.created', async (event) => {
 *   console.log('Lead created:', event.payload.leadId);
 *   // Trigger side effects: send email, update analytics, etc.
 * });
 *
 * // Subscribe to multiple events
 * on(['lead.created', 'lead.updated'], async (event) => {
 *   console.log('Lead changed:', event.type);
 * });
 *
 * // Subscribe once
 * once('system.startup', async () => {
 *   console.log('System started');
 * });
 *
 * // Emit events
 * await emit('lead.created', {
 *   leadId: 'lead-123',
 *   email: 'test@example.com',
 * }, {
 *   organizationId: 'org-123',
 *   userId: 'user-456',
 * });
 *
 * // Use event bus directly
 * const bus = getEventBus();
 * bus.onAny((event) => {
 *   console.log('Event:', event.type);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */

export * from './types';
export * from './bus';
