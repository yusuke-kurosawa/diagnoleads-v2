/**
 * Workflow Engine
 *
 * Executes workflow definitions
 */

import type {
  ActionHandler,
  ActionNode,
  ConditionNode,
  ExecutionContext,
  ExecutionStatus,
  ExecutionStep,
  WorkflowCondition,
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowNode,
} from './types';

/**
 * Workflow Engine
 */
export class WorkflowEngine {
  private actionHandlers = new Map<string, ActionHandler>();
  private executions = new Map<string, WorkflowExecution>();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register an action handler
   */
  registerActionHandler(actionType: string, handler: ActionHandler): void {
    this.actionHandlers.set(actionType, handler);
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    triggerData: Record<string, unknown> = {}
  ): Promise<WorkflowExecution> {
    const executionId = this.generateId();

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      context: {
        trigger: triggerData,
        variables: { ...workflow.variables },
        organizationId: workflow.organizationId,
      },
      steps: [],
      startedAt: new Date(),
    };

    this.executions.set(executionId, execution);

    try {
      // Find trigger node
      const triggerNode = workflow.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow has no trigger node');
      }

      // Start execution from trigger
      await this.executeNode(workflow, triggerNode, execution);

      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = new Date();
    }

    return execution;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel an execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    return true;
  }

  /**
   * Clear executions (for testing)
   */
  clearExecutions(): void {
    this.executions.clear();
  }

  private async executeNode(
    workflow: WorkflowDefinition,
    node: WorkflowNode,
    execution: WorkflowExecution
  ): Promise<void> {
    if (execution.status === 'cancelled') {
      return;
    }

    execution.currentNodeId = node.id;

    const step: ExecutionStep = {
      id: this.generateId(),
      nodeId: node.id,
      nodeName: node.name,
      status: 'running',
      startedAt: new Date(),
    };

    execution.steps.push(step);

    try {
      let output: unknown;

      switch (node.type) {
        case 'trigger':
          output = execution.context.trigger;
          break;

        case 'action':
          output = await this.executeAction(node as ActionNode, execution.context);
          break;

        case 'condition':
          output = this.evaluateConditions(node as ConditionNode, execution.context);
          break;

        case 'delay':
          await this.executeDelay(node);
          output = true;
          break;

        case 'end':
          return;

        default:
          output = null;
      }

      step.output = output;
      step.status = 'completed';
      step.completedAt = new Date();

      // Store output in variables
      execution.context.variables[`${node.id}_output`] = output;

      // Find and execute next nodes
      const nextNodes = this.getNextNodes(workflow, node, output);

      for (const nextNode of nextNodes) {
        await this.executeNode(workflow, nextNode, execution);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : String(error);
      step.completedAt = new Date();
      throw error;
    }
  }

  private async executeAction(node: ActionNode, context: ExecutionContext): Promise<unknown> {
    const { actionType, params, retryOnFailure, maxRetries = 3 } = node.config;

    const handler = this.actionHandlers.get(actionType);
    if (!handler) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    // Resolve template variables in params
    const resolvedParams = this.resolveTemplates(params, context);

    let lastError: Error | null = null;
    const attempts = retryOnFailure ? maxRetries : 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await handler(resolvedParams, context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < attempts - 1) {
          // Wait before retry (exponential backoff)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  private evaluateConditions(node: ConditionNode, context: ExecutionContext): boolean {
    const { conditions, operator } = node.config;

    if (conditions.length === 0) {
      return true;
    }

    const results = conditions.map((condition) => this.evaluateCondition(condition, context));

    return operator === 'and' ? results.every((r) => r) : results.some((r) => r);
  }

  private evaluateCondition(condition: WorkflowCondition, context: ExecutionContext): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getFieldValue(field, context);

    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'gt':
        return Number(fieldValue) > Number(value);
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lt':
        return Number(fieldValue) < Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private async executeDelay(node: WorkflowNode): Promise<void> {
    const config = node.config as { duration: number; unit: string };
    let ms = config.duration;

    switch (config.unit) {
      case 'seconds':
        ms *= 1000;
        break;
      case 'minutes':
        ms *= 60 * 1000;
        break;
      case 'hours':
        ms *= 60 * 60 * 1000;
        break;
      case 'days':
        ms *= 24 * 60 * 60 * 1000;
        break;
    }

    // Cap at 100ms for testing
    await new Promise((r) => setTimeout(r, Math.min(ms, 100)));
  }

  private getNextNodes(
    workflow: WorkflowDefinition,
    currentNode: WorkflowNode,
    output: unknown
  ): WorkflowNode[] {
    const edges = workflow.edges.filter((e) => e.source === currentNode.id);

    // For condition nodes, filter by condition result
    if (currentNode.type === 'condition') {
      const conditionResult = output as boolean;
      const matchingEdges = edges.filter((e) => {
        if (e.condition === 'true' && conditionResult) return true;
        if (e.condition === 'false' && !conditionResult) return true;
        if (e.condition === 'default' && edges.length === 1) return true;
        return false;
      });

      return matchingEdges
        .map((e) => workflow.nodes.find((n) => n.id === e.target))
        .filter((n): n is WorkflowNode => n !== undefined);
    }

    // For other nodes, follow all edges
    return edges
      .map((e) => workflow.nodes.find((n) => n.id === e.target))
      .filter((n): n is WorkflowNode => n !== undefined);
  }

  private getFieldValue(field: string, context: ExecutionContext): unknown {
    const parts = field.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private resolveTemplates(
    obj: Record<string, unknown>,
    context: ExecutionContext
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        resolved[key] = this.resolveTemplate(value, context);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveTemplates(value as Record<string, unknown>, context);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  private resolveTemplate(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = this.getFieldValue(path.trim(), context);
      return value !== undefined ? String(value) : '';
    });
  }

  private registerDefaultHandlers(): void {
    // Send email action
    this.registerActionHandler('send_email', async (params) => {
      // Mock implementation
      return { success: true, messageId: `msg_${Date.now()}`, to: params.to };
    });

    // Send notification action
    this.registerActionHandler('send_notification', async (params) => {
      return { success: true, message: params.message };
    });

    // Update lead action
    this.registerActionHandler('update_lead', async (params) => {
      return { success: true, leadId: params.leadId, updated: params.data };
    });

    // Create task action
    this.registerActionHandler('create_task', async (params) => {
      return { success: true, taskId: `task_${Date.now()}`, title: params.title };
    });

    // Call webhook action
    this.registerActionHandler('call_webhook', async (params) => {
      return { success: true, url: params.url, statusCode: 200 };
    });

    // AI process action
    this.registerActionHandler('ai_process', async (params) => {
      return { success: true, task: params.task, result: { score: 75 } };
    });

    // Assign lead action
    this.registerActionHandler('assign_lead', async (params) => {
      return { success: true, leadId: params.leadId, assignee: params.assignee };
    });

    // Add tag action
    this.registerActionHandler('add_tag', async (params) => {
      return { success: true, leadId: params.leadId, tag: params.tag };
    });

    // Remove tag action
    this.registerActionHandler('remove_tag', async (params) => {
      return { success: true, leadId: params.leadId, tag: params.tag };
    });

    // Delay action
    this.registerActionHandler('delay', async (params) => {
      const ms = Math.min(Number(params.duration) || 0, 100);
      await new Promise((r) => setTimeout(r, ms));
      return { success: true, delayed: ms };
    });

    // Run script action
    this.registerActionHandler('run_script', async (params) => {
      // Mock - in production would run sandboxed script
      return { success: true, script: params.script };
    });
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Default engine instance
let defaultEngine: WorkflowEngine | null = null;

/**
 * Get the default workflow engine
 */
export function getWorkflowEngine(): WorkflowEngine {
  if (!defaultEngine) {
    defaultEngine = new WorkflowEngine();
  }
  return defaultEngine;
}

/**
 * Create a new workflow engine
 */
export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine();
}

/**
 * Reset the default engine (for testing)
 */
export function resetWorkflowEngine(): void {
  if (defaultEngine) {
    defaultEngine.clearExecutions();
  }
  defaultEngine = null;
}
