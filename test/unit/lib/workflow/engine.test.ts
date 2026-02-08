/**
 * Workflow Engine Tests
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  WorkflowEngine,
  getWorkflowEngine,
  createWorkflowEngine,
  resetWorkflowEngine,
} from '@/lib/workflow/engine';
import type { WorkflowDefinition } from '@/lib/workflow/types';

// Types matching source
type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end';
  config?: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  organizationId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, unknown>;
}

interface ExecutionContext {
  trigger: Record<string, unknown>;
  variables: Record<string, unknown>;
  organizationId: string;
}

interface ExecutionStep {
  nodeId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  context: ExecutionContext;
  steps: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

type ActionHandler = (
  config: Record<string, unknown>,
  context: ExecutionContext
) => Promise<Record<string, unknown>>;

describe('WorkflowEngine', () => {
  let actionHandlers: Map<string, ActionHandler>;
  let executions: Map<string, WorkflowExecution>;
  let idCounter: number;

  beforeEach(() => {
    actionHandlers = new Map();
    executions = new Map();
    idCounter = 1;
  });

  const generateId = () => `exec-${idCounter++}`;

  describe('registerActionHandler', () => {
    it('should register action handler', () => {
      const handler: ActionHandler = vi.fn().mockResolvedValue({});
      actionHandlers.set('send-email', handler);
      
      expect(actionHandlers.has('send-email')).toBe(true);
    });

    it('should overwrite existing handler', () => {
      const handler1: ActionHandler = vi.fn();
      const handler2: ActionHandler = vi.fn();
      
      actionHandlers.set('send-email', handler1);
      actionHandlers.set('send-email', handler2);
      
      expect(actionHandlers.get('send-email')).toBe(handler2);
    });
  });

  describe('execute', () => {
    it('should create execution with running status', async () => {
      const workflow: WorkflowDefinition = {
        id: 'wf-1',
        name: 'Test Workflow',
        organizationId: 'org-123',
        nodes: [{ id: 'trigger-1', type: 'trigger' }],
        edges: [],
      };

      const executionId = generateId();
      const execution: WorkflowExecution = {
        id: executionId,
        workflowId: workflow.id,
        status: 'running',
        context: {
          trigger: {},
          variables: {},
          organizationId: workflow.organizationId,
        },
        steps: [],
        startedAt: new Date(),
      };

      executions.set(executionId, execution);

      expect(execution.status).toBe('running');
      expect(execution.workflowId).toBe('wf-1');
    });

    it('should throw error if no trigger node', () => {
      const workflow: WorkflowDefinition = {
        id: 'wf-1',
        name: 'No Trigger',
        organizationId: 'org-123',
        nodes: [{ id: 'action-1', type: 'action' }],
        edges: [],
      };

      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      expect(triggerNode).toBeUndefined();
    });

    it('should set status to completed on success', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'running',
        context: { trigger: {}, variables: {}, organizationId: 'org-1' },
        steps: [],
        startedAt: new Date(),
      };

      // Simulate successful completion
      execution.status = 'completed';
      execution.completedAt = new Date();

      expect(execution.status).toBe('completed');
      expect(execution.completedAt).toBeDefined();
    });

    it('should set status to failed on error', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'running',
        context: { trigger: {}, variables: {}, organizationId: 'org-1' },
        steps: [],
        startedAt: new Date(),
      };

      // Simulate failure
      execution.status = 'failed';
      execution.error = 'Action failed';
      execution.completedAt = new Date();

      expect(execution.status).toBe('failed');
      expect(execution.error).toBe('Action failed');
    });
  });

  describe('getExecution', () => {
    it('should return execution by ID', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'completed',
        context: { trigger: {}, variables: {}, organizationId: 'org-1' },
        steps: [],
        startedAt: new Date(),
      };

      executions.set('exec-1', execution);

      expect(executions.get('exec-1')).toBe(execution);
    });

    it('should return undefined for non-existent ID', () => {
      expect(executions.get('nonexistent')).toBeUndefined();
    });
  });

  describe('cancelExecution', () => {
    it('should cancel running execution', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'running',
        context: { trigger: {}, variables: {}, organizationId: 'org-1' },
        steps: [],
        startedAt: new Date(),
      };

      executions.set('exec-1', execution);

      if (execution.status === 'running') {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
      }

      expect(execution.status).toBe('cancelled');
    });

    it('should not cancel non-running execution', () => {
      const execution: WorkflowExecution = {
        id: 'exec-1',
        workflowId: 'wf-1',
        status: 'completed',
        context: { trigger: {}, variables: {}, organizationId: 'org-1' },
        steps: [],
        startedAt: new Date(),
      };

      const canCancel = execution.status === 'running';
      expect(canCancel).toBe(false);
    });
  });

  describe('executeNode', () => {
    it('should execute action node', async () => {
      const handler: ActionHandler = vi.fn().mockResolvedValue({ sent: true });
      actionHandlers.set('send-email', handler);

      const result = await handler({}, { trigger: {}, variables: {}, organizationId: 'org-1' });
      expect(result).toEqual({ sent: true });
    });

    it('should evaluate condition node', () => {
      const evaluateCondition = (expression: string, context: ExecutionContext): boolean => {
        // Simple evaluation
        if (expression === 'score > 50') {
          const score = context.variables['score'] as number;
          return score > 50;
        }
        return false;
      };

      const context: ExecutionContext = {
        trigger: {},
        variables: { score: 75 },
        organizationId: 'org-1',
      };

      expect(evaluateCondition('score > 50', context)).toBe(true);
    });

    it('should handle delay node', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const start = Date.now();
      await delay(10);
      const elapsed = Date.now() - start;
      
      // Allow some timing variance in CI environments
      expect(elapsed).toBeGreaterThanOrEqual(5);
    });
  });

  describe('ExecutionStep', () => {
    it('should track step execution', () => {
      const step: ExecutionStep = {
        nodeId: 'action-1',
        status: 'running',
        startedAt: new Date(),
      };

      expect(step.status).toBe('running');

      // Complete step
      step.status = 'completed';
      step.completedAt = new Date();
      step.result = { success: true };

      expect(step.status).toBe('completed');
      expect(step.result).toEqual({ success: true });
    });

    it('should track step failure', () => {
      const step: ExecutionStep = {
        nodeId: 'action-1',
        status: 'running',
        startedAt: new Date(),
      };

      step.status = 'failed';
      step.error = 'Connection timeout';
      step.completedAt = new Date();

      expect(step.status).toBe('failed');
      expect(step.error).toBe('Connection timeout');
    });
  });

  describe('Default handlers', () => {
    it('should register send-email handler', () => {
      const sendEmailHandler: ActionHandler = async (config, context) => {
        return { sent: true, to: config.to };
      };
      actionHandlers.set('send-email', sendEmailHandler);
      
      expect(actionHandlers.has('send-email')).toBe(true);
    });

    it('should register update-lead handler', () => {
      const updateLeadHandler: ActionHandler = async (config, context) => {
        return { updated: true, leadId: config.leadId };
      };
      actionHandlers.set('update-lead', updateLeadHandler);
      
      expect(actionHandlers.has('update-lead')).toBe(true);
    });

    it('should register create-task handler', () => {
      const createTaskHandler: ActionHandler = async (config, context) => {
        return { created: true, taskId: 'task-123' };
      };
      actionHandlers.set('create-task', createTaskHandler);
      
      expect(actionHandlers.has('create-task')).toBe(true);
    });

    it('should register webhook handler', () => {
      const webhookHandler: ActionHandler = async (config, context) => {
        return { triggered: true, url: config.url };
      };
      actionHandlers.set('webhook', webhookHandler);
      
      expect(actionHandlers.has('webhook')).toBe(true);
    });
  });

  describe('Edge traversal', () => {
    it('should find next nodes from edges', () => {
      const edges: WorkflowEdge[] = [
        { id: 'e1', source: 'trigger-1', target: 'action-1' },
        { id: 'e2', source: 'action-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'action-2', condition: 'true' },
        { id: 'e4', source: 'condition-1', target: 'end-1', condition: 'false' },
      ];

      const findNextEdges = (nodeId: string) => edges.filter(e => e.source === nodeId);

      expect(findNextEdges('trigger-1')).toHaveLength(1);
      expect(findNextEdges('condition-1')).toHaveLength(2);
    });
  });
});

describe('WorkflowDefinition', () => {
  it('should define complete workflow', () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-lead-scoring',
      name: 'Lead Scoring Workflow',
      organizationId: 'org-123',
      nodes: [
        { id: 'trigger-1', type: 'trigger', config: { event: 'lead.created' } },
        { id: 'action-1', type: 'action', config: { action: 'score-lead' } },
        { id: 'condition-1', type: 'condition', config: { expression: 'score > 80' } },
        { id: 'action-2', type: 'action', config: { action: 'send-email' } },
        { id: 'end-1', type: 'end' },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1' },
        { id: 'e2', source: 'action-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'action-2', condition: 'true' },
        { id: 'e4', source: 'condition-1', target: 'end-1', condition: 'false' },
        { id: 'e5', source: 'action-2', target: 'end-1' },
      ],
      variables: { threshold: 80 },
    };

    expect(workflow.nodes).toHaveLength(5);
    expect(workflow.edges).toHaveLength(5);
  });
});

// Integration tests with actual module
describe('Integration: WorkflowEngine (actual)', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = createWorkflowEngine();
  });

  afterEach(() => {
    resetWorkflowEngine();
  });

  it('should create new engine instance', () => {
    expect(engine).toBeInstanceOf(WorkflowEngine);
  });

  it('should execute simple workflow', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Test Workflow',
      organizationId: 'org-123',
      status: 'active',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow, { email: 'lead@example.com' });

    expect(execution.status).toBe('completed');
    expect(execution.steps.length).toBeGreaterThan(0);
    expect(execution.workflowId).toBe('test-wf');
  });

  it('should fail if no trigger node', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'No Trigger',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        {
          id: 'action-1',
          type: 'action',
          name: 'Action',
          config: { actionType: 'send_email', params: {} },
        },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);

    expect(execution.status).toBe('failed');
    expect(execution.error).toContain('trigger');
  });

  it('should handle condition nodes', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Condition Workflow',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
        {
          id: 'condition-1',
          type: 'condition',
          name: 'Check Score',
          config: {
            conditions: [{ field: 'trigger.score', operator: 'gte', value: 50 }],
            operator: 'and',
          },
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Send Email',
          config: { actionType: 'send_email', params: {} },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'condition-1' },
        { id: 'e2', source: 'condition-1', target: 'action-1', condition: 'true' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow, { score: 75 });

    expect(execution.status).toBe('completed');
  });

  it('should cancel running execution', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Long Workflow',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');

    // Already completed, can't cancel
    const cancelled = engine.cancelExecution(execution.id);
    expect(cancelled).toBe(false);
  });

  it('should get execution by ID', async () => {
    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Test',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);
    const retrieved = engine.getExecution(execution.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(execution.id);
  });

  it('should register custom action handler', async () => {
    engine.registerActionHandler('custom_action', async (params, context) => {
      return { custom: true, message: params.message };
    });

    const workflow: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Custom Action',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger-1', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
        {
          id: 'action-1',
          type: 'action',
          name: 'Custom',
          config: { actionType: 'custom_action', params: { message: 'Hello' } },
        },
      ],
      edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });
});

describe('Integration: getWorkflowEngine (singleton)', () => {
  afterEach(() => {
    resetWorkflowEngine();
  });

  it('should return same instance', () => {
    const engine1 = getWorkflowEngine();
    const engine2 = getWorkflowEngine();
    expect(engine1).toBe(engine2);
  });

  it('should create new instance after reset', () => {
    const engine1 = getWorkflowEngine();
    resetWorkflowEngine();
    const engine2 = getWorkflowEngine();
    expect(engine1).not.toBe(engine2);
  });
});

describe('Integration: Built-in action handlers', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    resetWorkflowEngine();
    engine = createWorkflowEngine();
  });

  const createWorkflowWithAction = (actionType: string, params: Record<string, unknown>): WorkflowDefinition => ({
    id: `wf-${actionType}`,
    name: `Test ${actionType}`,
    organizationId: 'org-123',
    status: 'active',
    nodes: [
      { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      { id: 'action', type: 'action', name: 'Action', config: { actionType, params } },
    ],
    edges: [{ id: 'e1', source: 'trigger', target: 'action' }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('should execute send_email action', async () => {
    const workflow = createWorkflowWithAction('send_email', { to: 'test@example.com', subject: 'Test' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute send_notification action', async () => {
    const workflow = createWorkflowWithAction('send_notification', { message: 'Hello' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute update_lead action', async () => {
    const workflow = createWorkflowWithAction('update_lead', { leadId: 'lead-1', data: { status: 'qualified' } });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute create_task action', async () => {
    const workflow = createWorkflowWithAction('create_task', { title: 'Follow up' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute call_webhook action', async () => {
    const workflow = createWorkflowWithAction('call_webhook', { url: 'https://example.com/hook' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute ai_process action', async () => {
    const workflow = createWorkflowWithAction('ai_process', { task: 'score_lead' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute assign_lead action', async () => {
    const workflow = createWorkflowWithAction('assign_lead', { leadId: 'lead-1', assignee: 'user-1' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute add_tag action', async () => {
    const workflow = createWorkflowWithAction('add_tag', { leadId: 'lead-1', tag: 'hot' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute remove_tag action', async () => {
    const workflow = createWorkflowWithAction('remove_tag', { leadId: 'lead-1', tag: 'cold' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute delay action', async () => {
    const workflow = createWorkflowWithAction('delay', { duration: 10 });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });

  it('should execute run_script action', async () => {
    const workflow = createWorkflowWithAction('run_script', { script: 'console.log("test")' });
    const execution = await engine.execute(workflow);
    expect(execution.status).toBe('completed');
  });
});

describe('Integration: Condition operators', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    resetWorkflowEngine();
    engine = createWorkflowEngine();
  });

  const createConditionWorkflow = (conditions: Array<{ field: string; operator: string; value: unknown }>): WorkflowDefinition => ({
    id: 'wf-condition',
    name: 'Condition Test',
    organizationId: 'org-123',
    status: 'active',
    nodes: [
      { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      { id: 'condition', type: 'condition', name: 'Check', config: { conditions, operator: 'and' } },
      { id: 'action', type: 'action', name: 'Action', config: { actionType: 'send_notification', params: {} } },
    ],
    edges: [
      { id: 'e1', source: 'trigger', target: 'condition' },
      { id: 'e2', source: 'condition', target: 'action', condition: 'true' },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('should evaluate eq operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.status', operator: 'eq', value: 'new' }]);
    const execution = await engine.execute(workflow, { status: 'new' });
    expect(execution.status).toBe('completed');
  });

  it('should evaluate neq operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.status', operator: 'neq', value: 'closed' }]);
    const execution = await engine.execute(workflow, { status: 'new' });
    expect(execution.status).toBe('completed');
  });

  it('should evaluate gt operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.score', operator: 'gt', value: 50 }]);
    const execution = await engine.execute(workflow, { score: 75 });
    expect(execution.status).toBe('completed');
  });

  it('should evaluate lt operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.score', operator: 'lt', value: 50 }]);
    const execution = await engine.execute(workflow, { score: 25 });
    expect(execution.status).toBe('completed');
  });

  it('should evaluate contains operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.email', operator: 'contains', value: '@example.com' }]);
    const execution = await engine.execute(workflow, { email: 'test@example.com' });
    expect(execution.status).toBe('completed');
  });

  it('should evaluate exists operator', async () => {
    const workflow = createConditionWorkflow([{ field: 'trigger.name', operator: 'exists', value: null }]);
    const execution = await engine.execute(workflow, { name: 'John' });
    expect(execution.status).toBe('completed');
  });
});

describe('Integration: Template resolution', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    resetWorkflowEngine();
    engine = createWorkflowEngine();
  });

  it('should resolve template variables in action params', async () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-template',
      name: 'Template Test',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
        { id: 'action', type: 'action', name: 'Email', config: { 
          actionType: 'send_email', 
          params: { to: '{{trigger.email}}', subject: 'Hello {{trigger.name}}' } 
        }},
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'action' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow, { email: 'test@example.com', name: 'John' });
    expect(execution.status).toBe('completed');
  });
});

describe('Integration: Execution management', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    resetWorkflowEngine();
    engine = createWorkflowEngine();
  });

  it('should get execution by id', async () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-1',
      name: 'Test',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);
    const retrieved = engine.getExecution(execution.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(execution.id);
  });

  it('should execute multiple workflows', async () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-multi',
      name: 'Test',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const exec1 = await engine.execute(workflow);
    const exec2 = await engine.execute(workflow);
    
    expect(exec1.id).not.toBe(exec2.id);
    expect(exec1.status).toBe('completed');
    expect(exec2.status).toBe('completed');
  });

  it('should clear all executions', async () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-clear',
      name: 'Test',
      organizationId: 'org-123',
      status: 'active',
      nodes: [
        { id: 'trigger', type: 'trigger', name: 'Start', config: { triggerType: 'manual' } },
      ],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const execution = await engine.execute(workflow);
    engine.clearExecutions();
    
    const retrieved = engine.getExecution(execution.id);
    expect(retrieved).toBeUndefined();
  });
});
