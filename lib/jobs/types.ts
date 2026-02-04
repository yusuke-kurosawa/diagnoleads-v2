/**
 * Background Jobs Types
 *
 * Type definitions for the job queue system
 */

/**
 * Job status
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Job priority levels
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Job definition
 */
export interface JobDefinition<TPayload = unknown, TResult = unknown> {
  /** Unique job type name */
  name: string;
  /** Job handler function */
  handler: (payload: TPayload, context: JobContext) => Promise<TResult>;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Priority level */
  priority?: JobPriority;
  /** Cron expression for scheduled jobs */
  cron?: string;
  /** Rate limit per minute */
  rateLimit?: number;
  /** Whether job should be unique (prevent duplicates) */
  unique?: boolean;
}

/**
 * Job instance
 */
export interface Job<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  scheduledAt?: Date;
  error?: string;
  result?: unknown;
  organizationId?: string;
  userId?: string;
}

/**
 * Job context passed to handlers
 */
export interface JobContext {
  jobId: string;
  attempt: number;
  log: (message: string) => void;
  progress: (percent: number) => Promise<void>;
  isCancelled: () => boolean;
}

/**
 * Job queue options
 */
export interface JobQueueOptions {
  /** Name of the queue */
  name: string;
  /** Concurrency limit */
  concurrency?: number;
  /** Polling interval in milliseconds */
  pollInterval?: number;
  /** Maximum jobs to process per poll */
  batchSize?: number;
}

/**
 * Enqueue options
 */
export interface EnqueueOptions {
  /** Delay before processing (milliseconds) */
  delay?: number;
  /** Schedule for specific time */
  scheduledAt?: Date;
  /** Priority level */
  priority?: JobPriority;
  /** Organization context */
  organizationId?: string;
  /** User context */
  userId?: string;
  /** Unique key to prevent duplicates */
  uniqueKey?: string;
}

/**
 * Job event types
 */
export type JobEventType =
  | 'job:enqueued'
  | 'job:started'
  | 'job:progress'
  | 'job:completed'
  | 'job:failed'
  | 'job:retrying'
  | 'job:cancelled';

/**
 * Job event
 */
export interface JobEvent {
  type: JobEventType;
  jobId: string;
  jobName: string;
  timestamp: Date;
  data?: unknown;
}

/**
 * Job stats
 */
export interface JobStats {
  pending: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  avgProcessingTime: number;
}

/**
 * Predefined job names
 */
export const JOB_NAMES = {
  // Lead processing
  PROCESS_LEAD: 'process-lead',
  SCORE_LEAD: 'score-lead',
  ENRICH_LEAD: 'enrich-lead',
  EXPORT_LEADS: 'export-leads',

  // Email
  SEND_EMAIL: 'send-email',
  SEND_BULK_EMAIL: 'send-bulk-email',

  // Webhooks
  DELIVER_WEBHOOK: 'deliver-webhook',
  RETRY_WEBHOOK: 'retry-webhook',

  // Reports
  GENERATE_REPORT: 'generate-report',
  DAILY_SUMMARY: 'daily-summary',

  // AI
  GENERATE_EMBEDDINGS: 'generate-embeddings',
  AI_ANALYSIS: 'ai-analysis',

  // Maintenance
  CLEANUP_OLD_DATA: 'cleanup-old-data',
  SYNC_EXTERNAL: 'sync-external',

  // Notifications
  SEND_NOTIFICATION: 'send-notification',
  PUSH_NOTIFICATION: 'push-notification',
} as const;

/**
 * Default job configuration
 */
export const DEFAULT_JOB_CONFIG = {
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  priority: 'normal' as JobPriority,
  concurrency: 5,
  pollInterval: 1000,
  batchSize: 10,
} as const;
