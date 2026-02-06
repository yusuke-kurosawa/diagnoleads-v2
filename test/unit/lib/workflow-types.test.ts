/**
 * Workflow Types Tests
 *
 * Unit tests for workflow type definitions and templates
 */

import { describe, expect, it } from 'vitest';
import {
  WORKFLOW_TEMPLATES,
  type WorkflowStatus,
  type ExecutionStatus,
  type NodeType,
  type TriggerType,
  type ActionType,
  type WorkflowNode,
  type WorkflowEdge,
  type WorkflowCondition,
  type WorkflowDefinition,
  type WorkflowExecution,
  type ExecutionContext,
  type ExecutionStep,
  type TriggerNode,
  type ActionNode,
  type ConditionNode,
  type DelayNode,
} from '@/lib/workflow/types';

describe('WorkflowStatus type', () => {
  it('should accept valid statuses', () => {
    const statuses: WorkflowStatus[] = ['draft', 'active', 'paused', 'archived'];
    expect(statuses).toHaveLength(4);
  });
});

describe('ExecutionStatus type', () => {
  it('should accept valid execution statuses', () => {
    const statuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    expect(statuses).toHaveLength(5);
  });
});

describe('NodeType type', () => {
  it('should accept valid node types', () => {
    const types: NodeType[] = ['trigger', 'action', 'condition', 'delay', 'loop', 'parallel', 'end'];
    expect(types).toHaveLength(7);
  });
});

describe('TriggerType type', () => {
  it('should accept valid trigger types', () => {
    const types: TriggerType[] = [
      'manual',
      'scheduled',
      'webhook',
      'event',
      'form_submission',
      'lead_created',
      'lead_updated',
      'lead_scored',
    ];
    expect(types).toHaveLength(8);
  });
});

describe('ActionType type', () => {
  it('should accept valid action types', () => {
    const types: ActionType[] = [
      'send_email',
      'send_notification',
      'update_lead',
      'create_task',
      'call_webhook',
      'run_script',
      'assign_lead',
      'add_tag',
      'remove_tag',
      'delay',
      'ai_process',
    ];
    expect(types).toHaveLength(11);
  });
});

describe('WorkflowNode interface', () => {
  it('should create valid workflow node', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      type: 'action',
      name: 'Test Action',
      config: { key: 'value' },
    };

    expect(node.id).toBe('node-1');
    expect(node.type).toBe('action');
    expect(node.name).toBe('Test Action');
    expect(node.config).toEqual({ key: 'value' });
  });

  it('should support optional position', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      type: 'action',
      name: 'Test',
      config: {},
      position: { x: 100, y: 200 },
    };

    expect(node.position).toEqual({ x: 100, y: 200 });
  });
});

describe('TriggerNode interface', () => {
  it('should create valid trigger node', () => {
    const trigger: TriggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Lead Created',
      config: {
        triggerType: 'lead_created',
      },
    };

    expect(trigger.type).toBe('trigger');
    expect(trigger.config.triggerType).toBe('lead_created');
  });

  it('should support scheduled trigger', () => {
    const trigger: TriggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Daily Report',
      config: {
        triggerType: 'scheduled',
        schedule: '0 9 * * *',
      },
    };

    expect(trigger.config.schedule).toBe('0 9 * * *');
  });

  it('should support conditions', () => {
    const trigger: TriggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      name: 'Filtered Event',
      config: {
        triggerType: 'event',
        eventType: 'lead.updated',
        conditions: [{ field: 'score', operator: 'gte', value: 50 }],
      },
    };

    expect(trigger.config.conditions).toHaveLength(1);
  });
});

describe('ActionNode interface', () => {
  it('should create valid action node', () => {
    const action: ActionNode = {
      id: 'action-1',
      type: 'action',
      name: 'Send Email',
      config: {
        actionType: 'send_email',
        params: {
          template: 'welcome',
          to: '{{lead.email}}',
        },
      },
    };

    expect(action.config.actionType).toBe('send_email');
    expect(action.config.params).toHaveProperty('template', 'welcome');
  });

  it('should support retry configuration', () => {
    const action: ActionNode = {
      id: 'action-1',
      type: 'action',
      name: 'Webhook Call',
      config: {
        actionType: 'call_webhook',
        params: { url: 'https://example.com' },
        retryOnFailure: true,
        maxRetries: 3,
      },
    };

    expect(action.config.retryOnFailure).toBe(true);
    expect(action.config.maxRetries).toBe(3);
  });
});

describe('ConditionNode interface', () => {
  it('should create valid condition node', () => {
    const condition: ConditionNode = {
      id: 'condition-1',
      type: 'condition',
      name: 'Check Score',
      config: {
        conditions: [{ field: 'score', operator: 'gte', value: 80 }],
        operator: 'and',
      },
    };

    expect(condition.config.operator).toBe('and');
    expect(condition.config.conditions).toHaveLength(1);
  });

  it('should support multiple conditions with OR', () => {
    const condition: ConditionNode = {
      id: 'condition-1',
      type: 'condition',
      name: 'Check Status',
      config: {
        conditions: [
          { field: 'status', operator: 'eq', value: 'active' },
          { field: 'priority', operator: 'eq', value: 'high' },
        ],
        operator: 'or',
      },
    };

    expect(condition.config.conditions).toHaveLength(2);
    expect(condition.config.operator).toBe('or');
  });
});

describe('DelayNode interface', () => {
  it('should create valid delay node', () => {
    const delay: DelayNode = {
      id: 'delay-1',
      type: 'delay',
      name: 'Wait 5 minutes',
      config: {
        duration: 5,
        unit: 'minutes',
      },
    };

    expect(delay.config.duration).toBe(5);
    expect(delay.config.unit).toBe('minutes');
  });

  it('should support different time units', () => {
    const units: Array<'seconds' | 'minutes' | 'hours' | 'days'> = [
      'seconds',
      'minutes',
      'hours',
      'days',
    ];

    for (const unit of units) {
      const delay: DelayNode = {
        id: 'delay-1',
        type: 'delay',
        name: 'Wait',
        config: { duration: 1, unit },
      };
      expect(delay.config.unit).toBe(unit);
    }
  });
});

describe('WorkflowEdge interface', () => {
  it('should create valid edge', () => {
    const edge: WorkflowEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    };

    expect(edge.source).toBe('node-1');
    expect(edge.target).toBe('node-2');
  });

  it('should support label and condition', () => {
    const edge: WorkflowEdge = {
      id: 'edge-1',
      source: 'condition-1',
      target: 'action-1',
      label: 'Yes',
      condition: 'true',
    };

    expect(edge.label).toBe('Yes');
    expect(edge.condition).toBe('true');
  });
});

describe('WorkflowCondition interface', () => {
  it('should create condition with different operators', () => {
    const operators: Array<WorkflowCondition['operator']> = [
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'contains',
      'not_contains',
      'exists',
      'not_exists',
    ];

    for (const operator of operators) {
      const condition: WorkflowCondition = {
        field: 'test',
        operator,
        value: 'value',
      };
      expect(condition.operator).toBe(operator);
    }
  });
});

describe('ExecutionContext interface', () => {
  it('should create valid execution context', () => {
    const context: ExecutionContext = {
      trigger: { leadId: 'lead-123' },
      variables: { score: 85 },
      organizationId: 'org-123',
      userId: 'user-123',
    };

    expect(context.organizationId).toBe('org-123');
    expect(context.trigger).toHaveProperty('leadId');
    expect(context.variables).toHaveProperty('score');
  });
});

describe('ExecutionStep interface', () => {
  it('should create valid execution step', () => {
    const step: ExecutionStep = {
      id: 'step-1',
      nodeId: 'action-1',
      nodeName: 'Send Email',
      status: 'completed',
      input: { to: 'test@example.com' },
      output: { messageId: 'msg-123' },
      startedAt: new Date(),
      completedAt: new Date(),
    };

    expect(step.status).toBe('completed');
    expect(step.input).toHaveProperty('to');
    expect(step.output).toHaveProperty('messageId');
  });

  it('should support error state', () => {
    const step: ExecutionStep = {
      id: 'step-1',
      nodeId: 'action-1',
      nodeName: 'Call Webhook',
      status: 'failed',
      error: 'Connection timeout',
      startedAt: new Date(),
    };

    expect(step.status).toBe('failed');
    expect(step.error).toBe('Connection timeout');
  });
});

describe('WORKFLOW_TEMPLATES', () => {
  it('should have predefined templates', () => {
    expect(WORKFLOW_TEMPLATES).toBeDefined();
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have lead-welcome template', () => {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === 'lead-welcome');

    expect(template).toBeDefined();
    expect(template?.name).toBe('Lead Welcome Sequence');
    expect(template?.category).toBe('lead-management');
  });

  it('should have lead-scoring template', () => {
    const template = WORKFLOW_TEMPLATES.find((t) => t.id === 'lead-scoring');

    expect(template).toBeDefined();
    expect(template?.name).toBe('Auto Lead Scoring');
    expect(template?.definition.nodes.length).toBeGreaterThan(0);
  });

  it('should have valid structure for all templates', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.definition).toBeDefined();
      expect(template.definition.nodes).toBeDefined();
      expect(template.definition.edges).toBeDefined();
    }
  });

  it('should have connected nodes and edges', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      const nodeIds = template.definition.nodes.map((n) => n.id);

      for (const edge of template.definition.edges) {
        expect(nodeIds).toContain(edge.source);
        expect(nodeIds).toContain(edge.target);
      }
    }
  });
});
