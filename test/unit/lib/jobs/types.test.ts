/**
 * Jobs Types Tests
 */

import { describe, expect, it } from 'vitest';
import {
  JOB_NAMES,
  DEFAULT_JOB_CONFIG,
  type JobStatus,
  type JobPriority,
  type JobDefinition,
  type Job,
  type JobContext,
  type JobQueueOptions,
  type EnqueueOptions,
  type JobEventType,
  type JobEvent,
  type JobStats,
} from '@/lib/jobs/types';

describe('JobStatus', () => {
  it('should support all statuses', () => {
    const statuses: JobStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    expect(statuses).toHaveLength(5);
  });
});

describe('JobPriority', () => {
  it('should support all priorities', () => {
    const priorities: JobPriority[] = ['low', 'normal', 'high', 'critical'];
    expect(priorities).toHaveLength(4);
  });
});

describe('JobDefinition', () => {
  it('should define job with handler', () => {
    type TestPayload = { leadId: string };
    type TestResult = { score: number };
    
    const jobDef: JobDefinition<TestPayload, TestResult> = {
      name: 'test-job',
      handler: async (payload) => ({ score: 100 }),
    };
    
    expect(jobDef.name).toBe('test-job');
  });

  it('should support optional config', () => {
    const jobDef: JobDefinition = {
      name: 'scheduled-job',
      handler: async () => {},
      maxRetries: 5,
      timeout: 60000,
      priority: 'high',
      cron: '0 * * * *',
      rateLimit: 10,
      unique: true,
    };
    
    expect(jobDef.maxRetries).toBe(5);
    expect(jobDef.cron).toBe('0 * * * *');
    expect(jobDef.unique).toBe(true);
  });
});

describe('Job', () => {
  it('should define job instance', () => {
    const job: Job<{ data: string }> = {
      id: 'job-123',
      name: 'test-job',
      payload: { data: 'test' },
      status: 'pending',
      priority: 'normal',
      attempts: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };
    
    expect(job.id).toBe('job-123');
    expect(job.attempts).toBe(0);
  });

  it('should track execution times', () => {
    const now = new Date();
    const job: Job = {
      id: 'job-123',
      name: 'test-job',
      payload: {},
      status: 'completed',
      priority: 'normal',
      attempts: 1,
      maxRetries: 3,
      createdAt: new Date(now.getTime() - 60000),
      startedAt: new Date(now.getTime() - 30000),
      completedAt: now,
      result: { success: true },
    };
    
    expect(job.completedAt).toBeDefined();
  });

  it('should store error on failure', () => {
    const job: Job = {
      id: 'job-123',
      name: 'test-job',
      payload: {},
      status: 'failed',
      priority: 'normal',
      attempts: 3,
      maxRetries: 3,
      createdAt: new Date(),
      error: 'Connection timeout',
    };
    
    expect(job.error).toBe('Connection timeout');
    expect(job.attempts).toBe(job.maxRetries);
  });
});

describe('JobContext', () => {
  it('should define context interface', () => {
    const context: JobContext = {
      jobId: 'job-123',
      attempt: 1,
      log: (msg) => console.log(msg),
      progress: async (pct) => {},
      isCancelled: () => false,
    };
    
    expect(context.attempt).toBe(1);
    expect(context.isCancelled()).toBe(false);
  });
});

describe('JobQueueOptions', () => {
  it('should define queue options', () => {
    const options: JobQueueOptions = {
      name: 'lead-processing',
      concurrency: 10,
      pollInterval: 500,
      batchSize: 20,
    };
    
    expect(options.concurrency).toBe(10);
  });
});

describe('EnqueueOptions', () => {
  it('should define enqueue options', () => {
    const options: EnqueueOptions = {
      delay: 5000,
      priority: 'high',
      organizationId: 'org-123',
      userId: 'user-123',
      uniqueKey: 'lead-123-score',
    };
    
    expect(options.delay).toBe(5000);
    expect(options.uniqueKey).toBe('lead-123-score');
  });

  it('should support scheduled time', () => {
    const futureDate = new Date(Date.now() + 3600000);
    const options: EnqueueOptions = {
      scheduledAt: futureDate,
    };
    
    expect(options.scheduledAt).toEqual(futureDate);
  });
});

describe('JobEventType', () => {
  it('should support all event types', () => {
    const events: JobEventType[] = [
      'job:enqueued',
      'job:started',
      'job:progress',
      'job:completed',
      'job:failed',
      'job:retrying',
      'job:cancelled',
    ];
    expect(events).toHaveLength(7);
  });
});

describe('JobEvent', () => {
  it('should define event structure', () => {
    const event: JobEvent = {
      type: 'job:completed',
      jobId: 'job-123',
      jobName: 'score-lead',
      timestamp: new Date(),
      data: { score: 85 },
    };
    
    expect(event.type).toBe('job:completed');
    expect(event.data).toEqual({ score: 85 });
  });
});

describe('JobStats', () => {
  it('should define stats structure', () => {
    const stats: JobStats = {
      pending: 10,
      running: 5,
      completed: 100,
      failed: 3,
      cancelled: 1,
      avgProcessingTime: 1500,
    };
    
    expect(stats.pending + stats.running).toBe(15);
    expect(stats.avgProcessingTime).toBe(1500);
  });
});

describe('JOB_NAMES', () => {
  it('should have lead processing jobs', () => {
    expect(JOB_NAMES.PROCESS_LEAD).toBe('process-lead');
    expect(JOB_NAMES.SCORE_LEAD).toBe('score-lead');
    expect(JOB_NAMES.ENRICH_LEAD).toBe('enrich-lead');
    expect(JOB_NAMES.EXPORT_LEADS).toBe('export-leads');
  });

  it('should have email jobs', () => {
    expect(JOB_NAMES.SEND_EMAIL).toBe('send-email');
    expect(JOB_NAMES.SEND_BULK_EMAIL).toBe('send-bulk-email');
  });

  it('should have webhook jobs', () => {
    expect(JOB_NAMES.DELIVER_WEBHOOK).toBe('deliver-webhook');
    expect(JOB_NAMES.RETRY_WEBHOOK).toBe('retry-webhook');
  });

  it('should have report jobs', () => {
    expect(JOB_NAMES.GENERATE_REPORT).toBe('generate-report');
    expect(JOB_NAMES.DAILY_SUMMARY).toBe('daily-summary');
  });

  it('should have AI jobs', () => {
    expect(JOB_NAMES.GENERATE_EMBEDDINGS).toBe('generate-embeddings');
    expect(JOB_NAMES.AI_ANALYSIS).toBe('ai-analysis');
  });

  it('should have maintenance jobs', () => {
    expect(JOB_NAMES.CLEANUP_OLD_DATA).toBe('cleanup-old-data');
    expect(JOB_NAMES.SYNC_EXTERNAL).toBe('sync-external');
  });

  it('should have notification jobs', () => {
    expect(JOB_NAMES.SEND_NOTIFICATION).toBe('send-notification');
    expect(JOB_NAMES.PUSH_NOTIFICATION).toBe('push-notification');
  });
});

describe('DEFAULT_JOB_CONFIG', () => {
  it('should have max retries', () => {
    expect(DEFAULT_JOB_CONFIG.maxRetries).toBe(3);
  });

  it('should have timeout of 30 seconds', () => {
    expect(DEFAULT_JOB_CONFIG.timeout).toBe(30000);
  });

  it('should default to normal priority', () => {
    expect(DEFAULT_JOB_CONFIG.priority).toBe('normal');
  });

  it('should have concurrency of 5', () => {
    expect(DEFAULT_JOB_CONFIG.concurrency).toBe(5);
  });

  it('should have poll interval of 1 second', () => {
    expect(DEFAULT_JOB_CONFIG.pollInterval).toBe(1000);
  });

  it('should have batch size of 10', () => {
    expect(DEFAULT_JOB_CONFIG.batchSize).toBe(10);
  });
});
