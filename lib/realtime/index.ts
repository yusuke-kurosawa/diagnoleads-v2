/**
 * Realtime Module
 *
 * Provides real-time notifications via Server-Sent Events (SSE)
 *
 * @example
 * ```typescript
 * // Server-side: Create SSE endpoint
 * // app/api/realtime/route.ts
 * import { createSSEResponse } from '@/lib/realtime';
 *
 * export async function GET(request: Request) {
 *   const userId = 'user-123'; // From auth
 *   const organizationId = 'org-456';
 *
 *   return createSSEResponse({
 *     userId,
 *     organizationId,
 *     onClose: () => console.log('Connection closed'),
 *   });
 * }
 *
 * // Server-side: Send notifications
 * import { sendToUser, sendToOrganization, broadcast } from '@/lib/realtime';
 *
 * // Send to specific user
 * sendToUser('user-123', 'notification', {
 *   title: 'New lead assigned',
 *   message: 'You have been assigned a new lead',
 * });
 *
 * // Send to organization
 * sendToOrganization('org-456', 'lead.created', {
 *   leadId: 'lead-789',
 *   leadName: 'John Doe',
 * });
 *
 * // Broadcast to all
 * broadcast('system.maintenance', {
 *   message: 'System maintenance in 30 minutes',
 * });
 *
 * // Client-side: Connect to SSE
 * const eventSource = new EventSource('/api/realtime');
 *
 * eventSource.onmessage = (event) => {
 *   const message = JSON.parse(event.data);
 *   console.log('Received:', message);
 * };
 *
 * eventSource.onerror = () => {
 *   console.error('Connection error');
 * };
 * ```
 */

export * from './types';
export * from './hub';
export * from './sse';
