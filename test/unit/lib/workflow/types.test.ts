/**
 * Workflow Types Tests
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
  type TriggerNode,
  type ActionNode,
  type ConditionNode,
  type DelayNode,
  type WorkflowEdge,
  type WorkflowCondition,
  type WorkflowDefinition,
  type WorkflowExecution,
  type ExecutionContext,
  type ExecutionStep,
  type WorkflowTemplate,
} from '@/lib/workflow/types';

describe('WorkflowStatus', () => {
  it('should support all statuses', () => {
    const statuses: WorkflowStatus[] = ['draft', 'active', 'paused', 'archived'];
    expect(statuses).toHaveLength(4);
  });
});

describe('ExecutionStatus', () => {
  it('should support all execution statuses', () => {
    const statuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    expect(statuses).toHaveLength(5);
  });
});

describe('NodeType', () => {
  it('should support all node types', () => {
    const types: NodeType[] = ['trigger', 'action', 'condition', 'delay', 'loop', 'parallel', 'end'];
    expect(types).toHaveLength(7);
  });
});

describe('TriggerType', () => {
  it('should support all trigger types', () => {
    const triggers: TriggerType[] = [
      'manual', 'scheduled', 'webhook', 'event',
      'form_submission', 'lead_created', 'lead_updated', 'lead_scored'
    ];
    expect(triggers).toHaveLength(8);
  });
});

describe('ActionType', () => {
  it('should support all action types', () => {
    const actions: ActionType[] = [
      'send_email', 'send_notification', 'update_lead', 'create_task',
      'call_webhook', 'run_script', 'assign_lead', 'add_tag',
      'remove_tag', 'delay', 'ai_process'
    ];
    expect(actions).toHaveLength(11);
  });
});

describe('WorkflowNode', () => {
  it('should have required properties', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      type: 'action',
      name: 'Send Email',
      config: {},
    };
    
    expect(node.id).toBe('node-1');
    expect(node.type).toBe('action');
    expect(node.name).toBe('Send Email');
  });

  it('should support optional position', () => {
    const node: WorkflowNode = {
      id: 'node-1',
      type: 'action',
      name: 'Action',
      config: {},
      position: { x: 100, y: 200 },
    };
    
    expect(node.position?.x).toBe(100);
    expect(node.position?.y).toBe(200);
  });
});

describe('TriggerNode', () => {
  it('should have trigger type', () => {
    const trigger: TriggerNode = {
      id: 'trigger-1',
      type: 'trigger',
      name: 'New Lead',
      config: {
        triggerType: 'lead_created',
      },
    };
    
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
});

describe('ActionNode', () => {
  it('should have action type and params', () => {
    const action: ActionNode = {
      id: 'action-1',
      type: 'action',
      name: 'Send Email',
      config: {
        actionType: 'send_email',
        params: {
          to: 'test@example.com',
          template: 'welcome',
        },
      },
    };
    
    expect(action.config.actionType).toBe('send_email');
    expect(action.config.params).toBeDefined();
  });

  it('should support retry configuration', () => {
    const action: ActionNode = {
      id: 'action-1',
      type: 'action',
      name: 'Call API',
      config: {
        actionType: 'call_webhook',
        params: { url: 'https://api.example.com' },
        retryOnFailure: true,
        maxRetries: 3,
      },
    };
    
    expect(action.config.retryOnFailure).toBe(true);
    expect(action.config.maxRetries).toBe(3);
  });
});

describe('ConditionNode', () => {
  it('should have conditions and operator', () => {
    const condition: ConditionNode = {
      id: 'cond-1',
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
});

describe('DelayNode', () => {
  it('should have duration and unit', () => {
    const delay: DelayNode = {
      id: 'delay-1',
      type: 'delay',
      name: 'Wait 1 hour',
      config: {
        duration: 1,
        unit: 'hours',
      },
    };
    
    expect(delay.config.duration).toBe(1);
    expect(delay.config.unit).toBe('hours');
  });
});

describe('WorkflowEdge', () => {
  it('should connect nodes', () => {
    const edge: WorkflowEdge = {
      id: 'e1',
      source: 'node-1',
      target: 'node-2',
    };
    
    expect(edge.source).toBe('node-1');
    expect(edge.target).toBe('node-2');
  });

  it('should support conditional edges', () => {
    const edge: WorkflowEdge = {
      id: 'e1',
      source: 'condition-1',
      target: 'action-1',
      condition: 'true',
      label: 'Yes',
    };
    
    expect(edge.condition).toBe('true');
  });
});

describe('WorkflowCondition', () => {
  it('should support all operators', () => {
    const operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'not_contains', 'exists', 'not_exists'];
    
    for (const op of operators) {
      const condition: WorkflowCondition = {
        field: 'test',
        operator: op as any,
        value: 'value',
      };
      expect(condition.operator).toBe(op);
    }
  });
});

describe('WorkflowDefinition', () => {
  it('should have required properties', () => {
    const workflow: WorkflowDefinition = {
      id: 'wf-1',
      name: 'Test Workflow',
      organizationId: 'org-1',
      status: 'draft',
      nodes: [],
      edges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    expect(workflow.id).toBe('wf-1');
    expect(workflow.status).toBe('draft');
  });
});

describe('WorkflowExecution', () => {
  it('should track execution state', () => {
    const execution: WorkflowExecution = {
      id: 'exec-1',
      workflowId: 'wf-1',
      status: 'running',
      context: {
        trigger: {},
        variables: {},
        organizationId: 'org-1',
      },
      steps: [],
      startedAt: new Date(),
    };
    
    expect(execution.status).toBe('running');
  });
});

describe('ExecutionContext', () => {
  it('should have trigger and variables', () => {
    const context: ExecutionContext = {
      trigger: { leadId: 'lead-123' },
      variables: { result: 'success' },
      organizationId: 'org-1',
      userId: 'user-1',
    };
    
    expect(context.trigger).toBeDefined();
    expect(context.variables).toBeDefined();
  });
});

describe('ExecutionStep', () => {
  it('should track step execution', () => {
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
    expect(step.output).toBeDefined();
  });
});

describe('WORKFLOW_TEMPLATES', () => {
  it('should have templates defined', () => {
    expect(WORKFLOW_TEMPLATES).toBeDefined();
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('should have lead-welcome template', () => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === 'lead-welcome');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Lead Welcome Sequence');
    expect(template?.category).toBe('lead-management');
  });

  it('should have lead-scoring template', () => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === 'lead-scoring');
    expect(template).toBeDefined();
    expect(template?.name).toBe('Auto Lead Scoring');
  });

  it('should have valid template definitions', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.definition.nodes.length).toBeGreaterThan(0);
      expect(template.definition.edges.length).toBeGreaterThan(0);
    }
  });

  it('should have trigger nodes in templates', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      const hasTrigger = template.definition.nodes.some(n => n.type === 'trigger');
      expect(hasTrigger).toBe(true);
    }
  });
});
