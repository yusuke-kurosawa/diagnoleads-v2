/**
 * Background Jobs Tests
 *
 * Unit tests for the job queue system
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JobQueue,
  createJobQueue,
  getJobQueue,
  resetJobQueue,
} from '@/lib/jobs/queue';
import { JOB_NAMES, DEFAULT_JOB_CONFIG } from '@/lib/jobs/types';
import type { JobDefinition, JobContext } from '@/lib/jobs/types';

describe('JobQueue', () => {
  let queue: JobQueue;

  beforeEach(() => {
    resetJobQueue();
    queue = createJobQueue({ name: 'test', pollInterval: 10 });
  });

  afterEach(() => {
    queue.stop();
    queue.clear();
  });

  describe('register', () => {
    it('should register a job handler', () => {
      const handler = vi.fn();
      queue.register({
        name: 'test-job',
        handler,
      });

      // Handler is registered (we can enqueue jobs of this type)
      expect(() => queue.enqueue('test-job', {})).not.toThrow();
    });

    it('should throw when enqueueing unregistered job', async () => {
      await expect(queue.enqueue('unregistered', {})).rejects.toThrow(
        'No handler registered for job: unregistered'
      );
    });
  });

  describe('enqueue', () => {
    it('should enqueue a job and return job ID', async () => {
      queue.register({ name: 'test-job', handler: vi.fn() });

      const jobId = await queue.enqueue('test-job', { data: 'test' });

      expect(jobId).toBeDefined();
      expect(jobId).toMatch(/^job_/);
    });

    it('should set job properties correctly', async () => {
      queue.register({ name: 'test-job', handler: vi.fn(), priority: 'high' });

      const jobId = await queue.enqueue('test-job', { data: 'test' });
      const job = queue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.name).toBe('test-job');
      expect(job?.status).toBe('pending');
      expect(job?.priority).toBe('high');
      expect(job?.payload).toEqual({ data: 'test' });
    });

    it('should respect delay option', async () => {
      queue.register({ name: 'test-job', handler: vi.fn() });

      const before = Date.now();
      const jobId = await queue.enqueue('test-job', {}, { delay: 1000 });
      const job = queue.getJob(jobId);

      expect(job?.scheduledAt).toBeDefined();
      expect(job?.scheduledAt!.getTime()).toBeGreaterThanOrEqual(before + 1000);
    });

    it('should prevent duplicate jobs with uniqueKey', async () => {
      queue.register({ name: 'test-job', handler: vi.fn() });

      const id1 = await queue.enqueue('test-job', { key: 'value' }, { uniqueKey: 'unique' });
      const id2 = await queue.enqueue('test-job', { key: 'value' }, { uniqueKey: 'unique' });

      expect(id1).toBe(id2);
    });
  });

  describe('schedule', () => {
    it('should schedule a job for a specific time', async () => {
      queue.register({ name: 'test-job', handler: vi.fn() });

      const runAt = new Date(Date.now() + 60000);
      const jobId = await queue.schedule('test-job', {}, runAt);
      const job = queue.getJob(jobId);

      expect(job?.scheduledAt).toEqual(runAt);
    });
  });

  describe('processing', () => {
    it('should process a job successfully', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'success' });
      queue.register({ name: 'test-job', handler });

      const jobId = await queue.enqueue('test-job', { input: 'data' });
      queue.start();

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      const job = queue.getJob(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.result).toEqual({ result: 'success' });
      expect(handler).toHaveBeenCalledWith({ input: 'data' }, expect.any(Object));
    });

    it('should pass context to handler', async () => {
      let capturedContext: JobContext | null = null;
      queue.register({
        name: 'test-job',
        handler: async (payload, ctx) => {
          capturedContext = ctx;
          return {};
        },
      });

      const jobId = await queue.enqueue('test-job', {});
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(capturedContext).not.toBeNull();
      expect(capturedContext?.jobId).toBe(jobId);
      expect(capturedContext?.attempt).toBe(1);
      expect(typeof capturedContext?.log).toBe('function');
      expect(typeof capturedContext?.progress).toBe('function');
      expect(typeof capturedContext?.isCancelled).toBe('function');
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;
      queue.register({
        name: 'test-job',
        handler: async () => {
          attempts++;
          if (attempts < 2) throw new Error('Temporary failure');
          return { success: true };
        },
        maxRetries: 3,
      });

      const jobId = await queue.enqueue('test-job', {});
      queue.start();

      // Wait for retries
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const job = queue.getJob(jobId);
      expect(job?.status).toBe('completed');
      expect(attempts).toBe(2);
    }, 5000);

    it('should mark job as failed after max retries', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      queue.register({
        name: 'test-job',
        handler,
        maxRetries: 2,
      });

      const jobId = await queue.enqueue('test-job', {});
      queue.start();

      // Wait for all retries
      await new Promise((resolve) => setTimeout(resolve, 4000));

      const job = queue.getJob(jobId);
      expect(job?.status).toBe('failed');
      expect(job?.error).toBe('Persistent failure');
      expect(handler).toHaveBeenCalledTimes(2);
    }, 6000);

    it('should process jobs by priority', async () => {
      const processed: string[] = [];
      queue.register({
        name: 'test-job',
        handler: async (payload: { id: string }) => {
          processed.push(payload.id);
          return {};
        },
      });

      // Stop queue to accumulate jobs
      await queue.enqueue('test-job', { id: 'low' }, { priority: 'low' });
      await queue.enqueue('test-job', { id: 'high' }, { priority: 'high' });
      await queue.enqueue('test-job', { id: 'critical' }, { priority: 'critical' });
      await queue.enqueue('test-job', { id: 'normal' }, { priority: 'normal' });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Critical and high should be processed first
      expect(processed[0]).toBe('critical');
      expect(processed[1]).toBe('high');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending job', async () => {
      queue.register({ name: 'test-job', handler: vi.fn() });

      const jobId = await queue.enqueue('test-job', {}, { delay: 10000 });
      const cancelled = await queue.cancel(jobId);

      expect(cancelled).toBe(true);
      expect(queue.getJob(jobId)?.status).toBe('cancelled');
    });

    it('should return false for non-existent job', async () => {
      const cancelled = await queue.cancel('non-existent');
      expect(cancelled).toBe(false);
    });
  });

  describe('events', () => {
    it('should emit job:enqueued event', async () => {
      const handler = vi.fn();
      queue.on('job:enqueued', handler);
      queue.register({ name: 'test-job', handler: vi.fn() });

      await queue.enqueue('test-job', {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job:enqueued',
          jobName: 'test-job',
        })
      );
    });

    it('should emit job:completed event', async () => {
      const handler = vi.fn();
      queue.on('job:completed', handler);
      queue.register({ name: 'test-job', handler: vi.fn().mockResolvedValue({}) });

      await queue.enqueue('test-job', {});
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job:completed',
          jobName: 'test-job',
        })
      );
    });

    it('should emit job:failed event', async () => {
      const handler = vi.fn();
      queue.on('job:failed', handler);
      queue.register({
        name: 'test-job',
        handler: vi.fn().mockRejectedValue(new Error('fail')),
        maxRetries: 1,
      });

      await queue.enqueue('test-job', {});
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job:failed',
          jobName: 'test-job',
        })
      );
    });

    it('should allow unsubscribing from events', async () => {
      const handler = vi.fn();
      const unsubscribe = queue.on('job:enqueued', handler);
      queue.register({ name: 'test-job', handler: vi.fn() });

      await queue.enqueue('test-job', {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await queue.enqueue('test-job', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('stats', () => {
    it('should return queue statistics', async () => {
      queue.register({ name: 'test-job', handler: vi.fn().mockResolvedValue({}) });

      await queue.enqueue('test-job', {});
      await queue.enqueue('test-job', {});

      const statsBefore = queue.getStats();
      expect(statsBefore.pending).toBe(2);
      expect(statsBefore.running).toBe(0);
      expect(statsBefore.completed).toBe(0);

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const statsAfter = queue.getStats();
      expect(statsAfter.pending).toBe(0);
      expect(statsAfter.completed).toBe(2);
    });
  });
});

describe('getJobQueue', () => {
  beforeEach(() => {
    resetJobQueue();
  });

  it('should return singleton instance', () => {
    const queue1 = getJobQueue();
    const queue2 = getJobQueue();

    expect(queue1).toBe(queue2);
  });
});

describe('JOB_NAMES', () => {
  it('should have predefined job names', () => {
    expect(JOB_NAMES.PROCESS_LEAD).toBe('process-lead');
    expect(JOB_NAMES.SEND_EMAIL).toBe('send-email');
    expect(JOB_NAMES.DELIVER_WEBHOOK).toBe('deliver-webhook');
    expect(JOB_NAMES.GENERATE_REPORT).toBe('generate-report');
    expect(JOB_NAMES.GENERATE_EMBEDDINGS).toBe('generate-embeddings');
  });
});

describe('DEFAULT_JOB_CONFIG', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_JOB_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_JOB_CONFIG.timeout).toBe(30000);
    expect(DEFAULT_JOB_CONFIG.priority).toBe('normal');
    expect(DEFAULT_JOB_CONFIG.concurrency).toBe(5);
  });
});
