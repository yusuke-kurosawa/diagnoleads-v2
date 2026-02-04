/**
 * Job Queue
 *
 * In-memory job queue with support for delayed execution, retries, and priorities
 * For production, consider using Redis-based solutions like BullMQ
 */

import type {
  Job,
  JobContext,
  JobDefinition,
  JobEvent,
  JobEventType,
  JobPriority,
  JobStats,
  JobStatus,
  EnqueueOptions,
  JobQueueOptions,
} from './types';
import { DEFAULT_JOB_CONFIG } from './types';

type EventHandler = (event: JobEvent) => void;

/**
 * In-memory job queue
 */
export class JobQueue {
  private jobs = new Map<string, Job>();
  private handlers = new Map<string, JobDefinition>();
  private eventListeners = new Map<JobEventType, Set<EventHandler>>();
  private processingJobs = new Set<string>();
  private cancelledJobs = new Set<string>();
  private isRunning = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  private options: Required<JobQueueOptions>;

  constructor(options: JobQueueOptions) {
    this.options = {
      name: options.name,
      concurrency: options.concurrency ?? DEFAULT_JOB_CONFIG.concurrency,
      pollInterval: options.pollInterval ?? DEFAULT_JOB_CONFIG.pollInterval,
      batchSize: options.batchSize ?? DEFAULT_JOB_CONFIG.batchSize,
    };
  }

  /**
   * Register a job handler
   */
  register<TPayload, TResult>(definition: JobDefinition<TPayload, TResult>): void {
    this.handlers.set(definition.name, definition as JobDefinition);
  }

  /**
   * Enqueue a job
   */
  async enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options: EnqueueOptions = {}
  ): Promise<string> {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for job: ${name}`);
    }

    // Check for unique constraint
    if (options.uniqueKey) {
      const existing = Array.from(this.jobs.values()).find(
        (j) =>
          j.name === name &&
          j.status === 'pending' &&
          JSON.stringify(j.payload) === JSON.stringify(payload)
      );
      if (existing) {
        return existing.id;
      }
    }

    const id = this.generateId();
    const now = new Date();

    const job: Job<TPayload> = {
      id,
      name,
      payload,
      status: 'pending',
      priority: options.priority ?? handler.priority ?? DEFAULT_JOB_CONFIG.priority,
      attempts: 0,
      maxRetries: handler.maxRetries ?? DEFAULT_JOB_CONFIG.maxRetries,
      createdAt: now,
      scheduledAt:
        options.scheduledAt ??
        (options.delay ? new Date(now.getTime() + options.delay) : undefined),
      organizationId: options.organizationId,
      userId: options.userId,
    };

    this.jobs.set(id, job as Job);
    this.emit('job:enqueued', job as Job);

    return id;
  }

  /**
   * Schedule a job for a specific time
   */
  async schedule<TPayload>(
    name: string,
    payload: TPayload,
    runAt: Date,
    options: Omit<EnqueueOptions, 'scheduledAt'> = {}
  ): Promise<string> {
    return this.enqueue(name, payload, { ...options, scheduledAt: runAt });
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'running') {
      this.cancelledJobs.add(jobId);
    }

    if (job.status === 'pending') {
      job.status = 'cancelled';
      this.emit('job:cancelled', job);
    }

    return true;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter((j) => j.status === status);
  }

  /**
   * Get queue statistics
   */
  getStats(): JobStats {
    const jobs = Array.from(this.jobs.values());
    const completed = jobs.filter((j) => j.status === 'completed');

    const avgProcessingTime =
      completed.length > 0
        ? completed.reduce((sum, j) => {
            if (j.completedAt && j.startedAt) {
              return sum + (j.completedAt.getTime() - j.startedAt.getTime());
            }
            return sum;
          }, 0) / completed.length
        : 0;

    return {
      pending: jobs.filter((j) => j.status === 'pending').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: completed.length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
      avgProcessingTime,
    };
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.poll();
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Subscribe to job events
   */
  on(event: JobEventType, handler: EventHandler): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  /**
   * Clear all jobs (for testing)
   */
  clear(): void {
    this.jobs.clear();
    this.processingJobs.clear();
    this.cancelledJobs.clear();
  }

  private poll(): void {
    if (!this.isRunning) return;

    this.processNextBatch();

    this.pollTimer = setTimeout(() => this.poll(), this.options.pollInterval);
  }

  private async processNextBatch(): Promise<void> {
    const availableSlots = this.options.concurrency - this.processingJobs.size;
    if (availableSlots <= 0) return;

    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(
        (j) =>
          j.status === 'pending' &&
          !this.processingJobs.has(j.id) &&
          (!j.scheduledAt || j.scheduledAt <= now)
      )
      .sort((a, b) => {
        // Sort by priority (higher first), then by creation time
        const priorityOrder: Record<JobPriority, number> = {
          critical: 4,
          high: 3,
          normal: 2,
          low: 1,
        };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, Math.min(availableSlots, this.options.batchSize));

    for (const job of pendingJobs) {
      this.processJob(job);
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job: ${job.name}`;
      return;
    }

    this.processingJobs.add(job.id);
    job.status = 'running';
    job.startedAt = new Date();
    job.attempts++;

    this.emit('job:started', job);

    const context: JobContext = {
      jobId: job.id,
      attempt: job.attempts,
      log: (message: string) => {
        console.log(`[Job ${job.id}] ${message}`);
      },
      progress: async (percent: number) => {
        this.emit('job:progress', job, { percent });
      },
      isCancelled: () => this.cancelledJobs.has(job.id),
    };

    try {
      // Set up timeout
      const timeoutMs = handler.timeout ?? DEFAULT_JOB_CONFIG.timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), timeoutMs);
      });

      const result = await Promise.race([handler.handler(job.payload, context), timeoutPromise]);

      if (this.cancelledJobs.has(job.id)) {
        job.status = 'cancelled';
        this.emit('job:cancelled', job);
      } else {
        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date();
        this.emit('job:completed', job);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (job.attempts < job.maxRetries) {
        job.status = 'pending';
        job.error = errorMessage;
        // Exponential backoff
        job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 1000);
        this.emit('job:retrying', job, { error: errorMessage, nextAttempt: job.scheduledAt });
      } else {
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = new Date();
        this.emit('job:failed', job, { error: errorMessage });
      }
    } finally {
      this.processingJobs.delete(job.id);
      this.cancelledJobs.delete(job.id);
    }
  }

  private emit(type: JobEventType, job: Job, data?: unknown): void {
    const event: JobEvent = {
      type,
      jobId: job.id,
      jobName: job.name,
      timestamp: new Date(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const handler of listeners) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in job event handler: ${error}`);
        }
      }
    }
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Default queue instance
let defaultQueue: JobQueue | null = null;

/**
 * Get the default job queue
 */
export function getJobQueue(): JobQueue {
  if (!defaultQueue) {
    defaultQueue = new JobQueue({ name: 'default' });
  }
  return defaultQueue;
}

/**
 * Create a new job queue
 */
export function createJobQueue(options: JobQueueOptions): JobQueue {
  return new JobQueue(options);
}

/**
 * Reset the default queue (for testing)
 */
export function resetJobQueue(): void {
  if (defaultQueue) {
    defaultQueue.stop();
    defaultQueue.clear();
  }
  defaultQueue = null;
}
