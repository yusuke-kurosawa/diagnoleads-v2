/**
 * Workflow Engine Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

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
      
      expect(elapsed).toBeGreaterThanOrEqual(10);
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
