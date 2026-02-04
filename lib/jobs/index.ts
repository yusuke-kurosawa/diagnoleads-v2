/**
 * Background Jobs Module
 *
 * Provides a job queue system for background processing
 *
 * @example
 * ```typescript
 * import { getJobQueue, JOB_NAMES } from '@/lib/jobs';
 *
 * // Get the queue
 * const queue = getJobQueue();
 *
 * // Register a job handler
 * queue.register({
 *   name: JOB_NAMES.SEND_EMAIL,
 *   handler: async (payload, ctx) => {
 *     ctx.log('Sending email...');
 *     await sendEmail(payload);
 *     return { sent: true };
 *   },
 *   maxRetries: 3,
 *   timeout: 30000,
 * });
 *
 * // Start processing
 * queue.start();
 *
 * // Enqueue a job
 * const jobId = await queue.enqueue(JOB_NAMES.SEND_EMAIL, {
 *   to: 'user@example.com',
 *   subject: 'Hello',
 * });
 *
 * // Schedule a job
 * await queue.schedule(JOB_NAMES.DAILY_SUMMARY, {}, new Date('2024-01-01T09:00:00'));
 *
 * // Subscribe to events
 * queue.on('job:completed', (event) => {
 *   console.log(`Job ${event.jobId} completed`);
 * });
 * ```
 */

export * from './types';
export * from './queue';
