/**
 * Workflow Tests
 *
 * Unit tests for the workflow engine
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WorkflowEngine,
  createWorkflowEngine,
  getWorkflowEngine,
  resetWorkflowEngine,
} from '@/lib/workflow/engine';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/types';
import type { WorkflowDefinition } from '@/lib/workflow/types';

function createTestWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    id: 'test-workflow',
    name: 'Test Workflow',
    organizationId: 'org-123',
    status: 'active',
    nodes: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    resetWorkflowEngine();
    engine = createWorkflowEngine();
  });

  afterEach(() => {
    engine.clearExecutions();
  });

  describe('execute', () => {
    it('should execute a simple workflow', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
        ],
        edges: [],
      });

      const execution = await engine.execute(workflow, { test: 'data' });

      expect(execution.status).toBe('completed');
      expect(execution.steps).toHaveLength(1);
    });

    it('should execute workflow with action', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          {
            id: 'action-1',
            type: 'action',
            name: 'Send Email',
            config: { actionType: 'send_email', params: { to: 'test@example.com' } },
          },
        ],
        edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
      });

      const execution = await engine.execute(workflow);

      expect(execution.status).toBe('completed');
      expect(execution.steps).toHaveLength(2);
    });

    it('should fail for unknown action type', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          { id: 'action-1', type: 'action', name: 'Unknown', config: { actionType: 'unknown', params: {} } },
        ],
        edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
      });

      const execution = await engine.execute(workflow);

      expect(execution.status).toBe('failed');
    });

    it('should fail if no trigger node', async () => {
      const workflow = createTestWorkflow({
        nodes: [{ id: 'action-1', type: 'action', name: 'Action', config: {} }],
      });

      const execution = await engine.execute(workflow);

      expect(execution.status).toBe('failed');
    });
  });

  describe('conditions', () => {
    it('should evaluate true condition', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'Check',
            config: { conditions: [{ field: 'trigger.score', operator: 'gte', value: 80 }], operator: 'and' },
          },
          { id: 'action-true', type: 'action', name: 'High', config: { actionType: 'send_notification', params: {} } },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'action-true', condition: 'true' },
        ],
      });

      const execution = await engine.execute(workflow, { score: 90 });

      expect(execution.status).toBe('completed');
      expect(execution.steps.some((s) => s.nodeName === 'High')).toBe(true);
    });

    it('should evaluate false condition', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          {
            id: 'condition-1',
            type: 'condition',
            name: 'Check',
            config: { conditions: [{ field: 'trigger.score', operator: 'gte', value: 80 }], operator: 'and' },
          },
          { id: 'action-false', type: 'action', name: 'Low', config: { actionType: 'send_notification', params: {} } },
        ],
        edges: [
          { id: 'e1', source: 'trigger-1', target: 'condition-1' },
          { id: 'e2', source: 'condition-1', target: 'action-false', condition: 'false' },
        ],
      });

      const execution = await engine.execute(workflow, { score: 50 });

      expect(execution.status).toBe('completed');
      expect(execution.steps.some((s) => s.nodeName === 'Low')).toBe(true);
    });
  });

  describe('template resolution', () => {
    it('should resolve template variables', async () => {
      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          {
            id: 'action-1',
            type: 'action',
            name: 'Email',
            config: { actionType: 'send_email', params: { to: '{{trigger.email}}' } },
          },
        ],
        edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
      });

      const execution = await engine.execute(workflow, { email: 'john@example.com' });
      const actionStep = execution.steps.find((s) => s.nodeName === 'Email');

      expect((actionStep?.output as { to: string })?.to).toBe('john@example.com');
    });
  });

  describe('registerActionHandler', () => {
    it('should allow custom handlers', async () => {
      const handler = vi.fn().mockResolvedValue({ custom: true });
      engine.registerActionHandler('custom', handler);

      const workflow = createTestWorkflow({
        nodes: [
          { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
          { id: 'action-1', type: 'action', name: 'Custom', config: { actionType: 'custom', params: {} } },
        ],
        edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
      });

      await engine.execute(workflow);

      expect(handler).toHaveBeenCalled();
    });
  });
});

describe('Default WorkflowEngine', () => {
  beforeEach(() => {
    resetWorkflowEngine();
  });

  it('should return singleton', () => {
    expect(getWorkflowEngine()).toBe(getWorkflowEngine());
  });
});

describe('Workflow Templates', () => {
  it('should have templates', () => {
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have valid structure', () => {
    for (const t of WORKFLOW_TEMPLATES) {
      expect(t.id).toBeDefined();
      expect(t.definition.nodes.length).toBeGreaterThan(0);
    }
  });
});
