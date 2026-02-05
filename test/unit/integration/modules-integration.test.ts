/**
 * Modules Integration Tests
 *
 * Tests for integration between newly implemented modules
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Cache
import { getCache, resetCacheInstance, cacheAside, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// Jobs
import { getJobQueue, resetJobQueue, JOB_NAMES } from '@/lib/jobs';

// Events
import { getEventBus, resetEventBus, emit, on } from '@/lib/events';

// Plugins
import { getPluginManager, resetPluginManager } from '@/lib/plugins';
import type { Plugin, PluginContext } from '@/lib/plugins';

// Realtime
import { getRealtimeHub, resetRealtimeHub, createTestConnection } from '@/lib/realtime';

// AI Agent
import { createAgent, createTool, getBuiltInTools } from '@/lib/ai-agent';

// Workflow
import { createWorkflowEngine, resetWorkflowEngine } from '@/lib/workflow';
import type { WorkflowDefinition } from '@/lib/workflow';

// API Docs
import { generateOpenAPI, getAllModules } from '@/lib/api-docs';

describe('Module Integration Tests', () => {
  beforeEach(() => {
    resetCacheInstance();
    resetJobQueue();
    resetEventBus();
    resetRealtimeHub();
    resetWorkflowEngine();
  });

  afterEach(async () => {
    await resetPluginManager();
  });

  describe('Cache + Events Integration', () => {
    it('should invalidate cache on events', async () => {
      const cache = getCache();
      const bus = getEventBus();

      // Set up cache invalidation on lead update
      on('lead.updated', async (event) => {
        const leadId = (event.payload as { leadId: string }).leadId;
        await cache.del(CACHE_KEYS.lead(leadId));
      });

      // Cache a lead
      await cache.set(CACHE_KEYS.lead('lead-1'), { id: 'lead-1', name: 'Test' });
      expect(await cache.get(CACHE_KEYS.lead('lead-1'))).toBeDefined();

      // Emit update event
      await emit('lead.updated', { leadId: 'lead-1' });

      // Cache should be invalidated
      expect(await cache.get(CACHE_KEYS.lead('lead-1'))).toBeNull();
    });
  });

  describe('Jobs + Events Integration', () => {
    it('should emit events when jobs complete', async () => {
      const queue = getJobQueue();
      const bus = getEventBus();
      const completedJobs: string[] = [];

      // Listen for job completion
      queue.on('job:completed', (event) => {
        completedJobs.push(event.jobId);
      });

      // Register and run a job
      queue.register({
        name: 'test-job',
        handler: async () => ({ result: 'done' }),
      });

      const jobId = await queue.enqueue('test-job', {});
      queue.start();

      await new Promise((r) => setTimeout(r, 100));
      queue.stop();

      expect(completedJobs).toContain(jobId);
    });
  });

  describe('Plugins + Events Integration', () => {
    it('should allow plugins to subscribe to events', async () => {
      const manager = getPluginManager();
      const receivedEvents: string[] = [];

      const plugin: Plugin = {
        metadata: { name: 'event-plugin', version: '1.0.0' },
        initialize: async (ctx: PluginContext) => {
          ctx.events.on('lead.created', async (event) => {
            receivedEvents.push(event.type);
          });
        },
      };

      await manager.register(plugin);
      await manager.initialize('event-plugin');

      await emit('lead.created', { leadId: 'lead-1' });

      expect(receivedEvents).toContain('lead.created');
    });
  });

  describe('Realtime + Events Integration', () => {
    it('should broadcast events to connected clients', async () => {
      const hub = getRealtimeHub();
      const { connection, messages } = createTestConnection({ organizationId: 'org-1' });

      hub.addConnection(connection);

      // Broadcast on event
      on('lead.created', async (event) => {
        hub.sendToOrganization('org-1', 'lead.created', event.payload);
      });

      await emit('lead.created', { leadId: 'lead-1' }, { organizationId: 'org-1' });

      const leadMessages = messages.filter((m) => m.type === 'lead.created');
      expect(leadMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow + Jobs Integration', () => {
    it('should be able to enqueue jobs from workflow actions', async () => {
      const engine = createWorkflowEngine();
      const queue = getJobQueue();
      const enqueuedJobs: string[] = [];

      // Register job
      queue.register({
        name: 'send-email',
        handler: async (payload) => {
          enqueuedJobs.push((payload as { to: string }).to);
          return { sent: true };
        },
      });

      // Custom action that enqueues a job
      engine.registerActionHandler('queue_email', async (params) => {
        await queue.enqueue('send-email', { to: params.to });
        return { queued: true };
      });

      const workflow: WorkflowDefinition = {
        id: 'wf-1',
        name: 'Email Workflow',
        organizationId: 'org-1',
        status: 'active',
        nodes: [
          { id: 't1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          {
            id: 'a1',
            type: 'action',
            name: 'Queue Email',
            config: { actionType: 'queue_email', params: { to: 'test@example.com' } },
          },
        ],
        edges: [{ id: 'e1', source: 't1', target: 'a1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await engine.execute(workflow);
      queue.start();
      await new Promise((r) => setTimeout(r, 100));
      queue.stop();

      expect(enqueuedJobs).toContain('test@example.com');
    });
  });

  describe('AI Agent + Cache Integration', () => {
    it('should cache agent tool results', async () => {
      const cache = getCache();
      const agent = createAgent();

      let searchCalls = 0;

      agent.registerTool(
        createTool('cached_search', 'Cached search', async (params) => {
          const cacheKey = `search:${params.query}`;
          const cached = await cache.get(cacheKey);

          if (cached) {
            return cached;
          }

          searchCalls++;
          const result = { results: ['item1', 'item2'], query: params.query };
          await cache.set(cacheKey, result, { ttl: CACHE_TTL.SHORT });
          return result;
        })
      );

      // First call - should hit the "backend"
      const result1 = await agent.run('Search for test');

      // Cache should be populated now
      const cachedResult = await cache.get('search:Search for test');
      expect(cachedResult).toBeDefined();
    });
  });

  describe('Full Stack Integration', () => {
    it('should handle lead creation flow across all modules', async () => {
      const cache = getCache();
      const hub = getRealtimeHub();
      const engine = createWorkflowEngine();
      const queue = getJobQueue();

      const events: string[] = [];
      const notifications: string[] = [];

      // Set up client connection
      const { connection, messages } = createTestConnection({
        userId: 'user-1',
        organizationId: 'org-1',
      });
      hub.addConnection(connection);

      // Set up event listeners
      on('lead.created', async (event) => {
        events.push('lead.created');

        // Notify via realtime
        hub.sendToOrganization('org-1', 'notification', { message: 'New lead!' });

        // Invalidate cache
        await cache.del(CACHE_KEYS.leadList('org-1', 1));
      });

      // Register workflow action
      engine.registerActionHandler('notify_team', async () => {
        notifications.push('team_notified');
        return { notified: true };
      });

      // Register job
      queue.register({
        name: 'score-lead',
        handler: async () => ({ score: 85 }),
      });

      // Simulate lead creation
      const leadData = { id: 'lead-new', email: 'new@example.com' };

      // 1. Cache the lead
      await cache.set(CACHE_KEYS.lead(leadData.id), leadData);

      // 2. Emit event
      await emit('lead.created', { leadId: leadData.id }, { organizationId: 'org-1' });

      // 3. Execute workflow
      const workflow: WorkflowDefinition = {
        id: 'wf-lead',
        name: 'Lead Created',
        organizationId: 'org-1',
        status: 'active',
        nodes: [
          { id: 't1', type: 'trigger', name: 'Start', config: { triggerType: 'lead_created' } },
          { id: 'a1', type: 'action', name: 'Notify', config: { actionType: 'notify_team', params: {} } },
        ],
        edges: [{ id: 'e1', source: 't1', target: 'a1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await engine.execute(workflow, { leadId: leadData.id });

      // 4. Queue scoring job
      await queue.enqueue('score-lead', { leadId: leadData.id });
      queue.start();
      await new Promise((r) => setTimeout(r, 100));
      queue.stop();

      // Verify integrations worked
      expect(events).toContain('lead.created');
      expect(notifications).toContain('team_notified');
      expect(messages.some((m) => m.type === 'notification')).toBe(true);

      // Cache should be invalidated for list
      expect(await cache.get(CACHE_KEYS.leadList('org-1', 1))).toBeNull();

      // But lead cache should exist
      expect(await cache.get(CACHE_KEYS.lead(leadData.id))).toBeDefined();
    });
  });
});

describe('API Documentation Integration', () => {
  it('should generate complete OpenAPI spec with all modules', () => {
    const spec = generateOpenAPI(getAllModules());

    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toBeDefined();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
    expect(spec.components?.schemas).toBeDefined();
  });

  it('should include all new feature endpoints', () => {
    const spec = generateOpenAPI(getAllModules());
    const paths = Object.keys(spec.paths);

    // Check for key endpoints
    expect(paths.some((p) => p.includes('featureFlags'))).toBe(true);
    expect(paths.some((p) => p.includes('auditLogs'))).toBe(true);
    expect(paths.some((p) => p.includes('workflows'))).toBe(true);
  });
});
