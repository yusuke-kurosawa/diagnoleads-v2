/**
 * Workflow Types
 *
 * Type definitions for the no-code workflow engine
 */

/**
 * Workflow status
 */
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

/**
 * Workflow execution status
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Node types
 */
export type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'loop' | 'parallel' | 'end';

/**
 * Trigger types
 */
export type TriggerType =
  | 'manual'
  | 'scheduled'
  | 'webhook'
  | 'event'
  | 'form_submission'
  | 'lead_created'
  | 'lead_updated'
  | 'lead_scored';

/**
 * Action types
 */
export type ActionType =
  | 'send_email'
  | 'send_notification'
  | 'update_lead'
  | 'create_task'
  | 'call_webhook'
  | 'run_script'
  | 'assign_lead'
  | 'add_tag'
  | 'remove_tag'
  | 'delay'
  | 'ai_process';

/**
 * Workflow node
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

/**
 * Trigger node
 */
export interface TriggerNode extends WorkflowNode {
  type: 'trigger';
  config: {
    triggerType: TriggerType;
    schedule?: string; // Cron expression
    eventType?: string;
    conditions?: WorkflowCondition[];
  };
}

/**
 * Action node
 */
export interface ActionNode extends WorkflowNode {
  type: 'action';
  config: {
    actionType: ActionType;
    params: Record<string, unknown>;
    retryOnFailure?: boolean;
    maxRetries?: number;
  };
}

/**
 * Condition node
 */
export interface ConditionNode extends WorkflowNode {
  type: 'condition';
  config: {
    conditions: WorkflowCondition[];
    operator: 'and' | 'or';
  };
}

/**
 * Delay node
 */
export interface DelayNode extends WorkflowNode {
  type: 'delay';
  config: {
    duration: number; // milliseconds
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
}

/**
 * Workflow edge (connection between nodes)
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: 'true' | 'false' | 'default';
}

/**
 * Workflow condition
 */
export interface WorkflowCondition {
  field: string;
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'not_contains'
    | 'exists'
    | 'not_exists';
  value: unknown;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow execution
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  currentNodeId?: string;
  context: ExecutionContext;
  steps: ExecutionStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * Execution context
 */
export interface ExecutionContext {
  /** Trigger data */
  trigger: Record<string, unknown>;
  /** Variables accumulated during execution */
  variables: Record<string, unknown>;
  /** Organization ID */
  organizationId: string;
  /** User ID */
  userId?: string;
}

/**
 * Execution step
 */
export interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  status: ExecutionStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Action handler
 */
export type ActionHandler = (
  params: Record<string, unknown>,
  context: ExecutionContext
) => Promise<unknown>;

/**
 * Condition evaluator
 */
export type ConditionEvaluator = (
  condition: WorkflowCondition,
  context: ExecutionContext
) => boolean;

/**
 * Workflow template
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  definition: Omit<WorkflowDefinition, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>;
}

/**
 * Predefined workflow templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'lead-welcome',
    name: 'Lead Welcome Sequence',
    description: 'Send welcome email when a new lead is created',
    category: 'lead-management',
    definition: {
      name: 'Lead Welcome Sequence',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'New Lead Created',
          config: { triggerType: 'lead_created' },
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'Send Welcome Email',
          config: {
            actionType: 'send_email',
            params: {
              template: 'welcome',
              to: '{{lead.email}}',
            },
          },
        },
      ],
      edges: [{ id: 'e1', source: 'trigger-1', target: 'action-1' }],
    },
  },
  {
    id: 'lead-scoring',
    name: 'Auto Lead Scoring',
    description: 'Automatically score leads based on activity',
    category: 'lead-management',
    definition: {
      name: 'Auto Lead Scoring',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          name: 'Lead Updated',
          config: { triggerType: 'lead_updated' },
        },
        {
          id: 'action-1',
          type: 'action',
          name: 'AI Score Lead',
          config: {
            actionType: 'ai_process',
            params: { task: 'score_lead' },
          },
        },
        {
          id: 'condition-1',
          type: 'condition',
          name: 'High Score?',
          config: {
            conditions: [{ field: 'score', operator: 'gte', value: 80 }],
            operator: 'and',
          },
        },
        {
          id: 'action-2',
          type: 'action',
          name: 'Notify Sales',
          config: {
            actionType: 'send_notification',
            params: { message: 'High-value lead detected!' },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'action-1' },
        { id: 'e2', source: 'action-1', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'action-2', condition: 'true' },
      ],
    },
  },
];
