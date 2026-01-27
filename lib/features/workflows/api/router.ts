/**
 * Workflow Automation tRPC Router
 * Handles CRUD operations for automation workflows
 */
import {
  type WorkflowActionConfig,
  type WorkflowCondition,
  type WorkflowStatus,
  type WorkflowTrigger,
  workflowExecutions,
  workflows,
} from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

// Schemas
const conditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
    'in',
    'not_in',
  ]),
  value: z.unknown(),
});

const actionSchema = z.object({
  type: z.enum([
    'update_status',
    'update_score',
    'add_tag',
    'remove_tag',
    'send_notification',
    'send_email',
    'webhook',
  ]),
  params: z.record(z.unknown()),
});

const createWorkflowSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum([
    'lead_created',
    'lead_updated',
    'status_changed',
    'score_changed',
    'tag_added',
    'tag_removed',
    'scheduled',
  ]),
  conditions: z.array(conditionSchema).default([]),
  actions: z.array(actionSchema).min(1),
  priority: z.number().min(1).max(1000).default(100),
  cronExpression: z.string().optional(),
});

const updateWorkflowSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  trigger: z
    .enum([
      'lead_created',
      'lead_updated',
      'status_changed',
      'score_changed',
      'tag_added',
      'tag_removed',
      'scheduled',
    ])
    .optional(),
  conditions: z.array(conditionSchema).optional(),
  actions: z.array(actionSchema).optional(),
  status: z.enum(['active', 'paused', 'disabled']).optional(),
  priority: z.number().min(1).max(1000).optional(),
  cronExpression: z.string().optional().nullable(),
});

const listWorkflowsSchema = z.object({
  organizationId: z.string().uuid(),
  status: z.enum(['active', 'paused', 'disabled', 'all']).default('all'),
  trigger: z
    .enum([
      'lead_created',
      'lead_updated',
      'status_changed',
      'score_changed',
      'tag_added',
      'tag_removed',
      'scheduled',
      'all',
    ])
    .default('all'),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const getWorkflowSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const deleteWorkflowSchema = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

const getExecutionsSchema = z.object({
  organizationId: z.string().uuid(),
  workflowId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  status: z.enum(['success', 'failed', 'skipped', 'all']).default('all'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const workflowsRouter = router({
  /**
   * List workflows for an organization
   */
  list: organizationProcedure.input(listWorkflowsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ワークフローを閲覧する権限がありません',
      });
    }

    const conditions = [eq(workflows.organizationId, input.organizationId)];

    if (input.status !== 'all') {
      conditions.push(eq(workflows.status, input.status));
    }

    if (input.trigger !== 'all') {
      conditions.push(eq(workflows.trigger, input.trigger));
    }

    const results = await ctx.db.query.workflows.findMany({
      where: and(...conditions),
      orderBy: [workflows.priority, desc(workflows.createdAt)],
      limit: input.limit,
      offset: input.offset,
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const [countResult] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflows)
      .where(and(...conditions));

    return {
      items: results,
      total: countResult?.count ?? 0,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Get a single workflow with execution history
   */
  get: organizationProcedure.input(getWorkflowSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ワークフローを閲覧する権限がありません',
      });
    }

    const workflow = await ctx.db.query.workflows.findFirst({
      where: and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)),
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        executions: {
          limit: 10,
          orderBy: [desc(workflowExecutions.createdAt)],
        },
      },
    });

    if (!workflow) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'ワークフローが見つかりません',
      });
    }

    return workflow;
  }),

  /**
   * Create a new workflow
   */
  create: organizationProcedure.input(createWorkflowSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('create', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ワークフローを作成する権限がありません',
      });
    }

    // Validate cron expression for scheduled triggers
    if (input.trigger === 'scheduled' && !input.cronExpression) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'スケジュールトリガーにはcron式が必要です',
      });
    }

    const [workflow] = await ctx.db
      .insert(workflows)
      .values({
        organizationId: input.organizationId,
        createdById: ctx.session.user.id,
        name: input.name,
        description: input.description,
        trigger: input.trigger,
        conditions: input.conditions as WorkflowCondition[],
        actions: input.actions as WorkflowActionConfig[],
        priority: input.priority,
        cronExpression: input.cronExpression,
      })
      .returning();

    return workflow;
  }),

  /**
   * Update a workflow
   */
  update: organizationProcedure.input(updateWorkflowSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('update', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ワークフローを更新する権限がありません',
      });
    }

    const existing = await ctx.db.query.workflows.findFirst({
      where: and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'ワークフローが見つかりません',
      });
    }

    // Validate cron expression for scheduled triggers
    const trigger = input.trigger ?? existing.trigger;
    if (trigger === 'scheduled' && !input.cronExpression && !existing.cronExpression) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'スケジュールトリガーにはcron式が必要です',
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.trigger !== undefined) updateData.trigger = input.trigger;
    if (input.conditions !== undefined) updateData.conditions = input.conditions;
    if (input.actions !== undefined) updateData.actions = input.actions;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.cronExpression !== undefined) updateData.cronExpression = input.cronExpression;

    const [updated] = await ctx.db
      .update(workflows)
      .set(updateData)
      .where(and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)))
      .returning();

    return updated;
  }),

  /**
   * Delete a workflow
   */
  delete: organizationProcedure.input(deleteWorkflowSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.ability.can('delete', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'ワークフローを削除する権限がありません',
      });
    }

    const existing = await ctx.db.query.workflows.findFirst({
      where: and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)),
    });

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'ワークフローが見つかりません',
      });
    }

    await ctx.db
      .delete(workflows)
      .where(and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)));

    return { success: true };
  }),

  /**
   * Toggle workflow status (active/paused)
   */
  toggleStatus: organizationProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.ability.can('update', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'ワークフローを更新する権限がありません',
        });
      }

      const existing = await ctx.db.query.workflows.findFirst({
        where: and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ワークフローが見つかりません',
        });
      }

      const newStatus: WorkflowStatus = existing.status === 'active' ? 'paused' : 'active';

      const [updated] = await ctx.db
        .update(workflows)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(workflows.id, input.id), eq(workflows.organizationId, input.organizationId)))
        .returning();

      return updated;
    }),

  /**
   * Get workflow execution history
   */
  getExecutions: organizationProcedure.input(getExecutionsSchema).query(async ({ ctx, input }) => {
    if (!ctx.ability.can('read', 'Lead')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '実行履歴を閲覧する権限がありません',
      });
    }

    const conditions = [eq(workflowExecutions.organizationId, input.organizationId)];

    if (input.workflowId) {
      conditions.push(eq(workflowExecutions.workflowId, input.workflowId));
    }

    if (input.leadId) {
      conditions.push(eq(workflowExecutions.leadId, input.leadId));
    }

    if (input.status !== 'all') {
      conditions.push(eq(workflowExecutions.status, input.status));
    }

    const results = await ctx.db.query.workflowExecutions.findMany({
      where: and(...conditions),
      orderBy: [desc(workflowExecutions.createdAt)],
      limit: input.limit,
      offset: input.offset,
      with: {
        workflow: {
          columns: {
            id: true,
            name: true,
          },
        },
        lead: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const [countResult] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(workflowExecutions)
      .where(and(...conditions));

    return {
      items: results,
      total: countResult?.count ?? 0,
      limit: input.limit,
      offset: input.offset,
    };
  }),

  /**
   * Get workflow statistics
   */
  getStats: organizationProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.ability.can('read', 'Lead')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '統計を閲覧する権限がありません',
        });
      }

      const [workflowStats] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where status = 'active')::int`,
          paused: sql<number>`count(*) filter (where status = 'paused')::int`,
          disabled: sql<number>`count(*) filter (where status = 'disabled')::int`,
        })
        .from(workflows)
        .where(eq(workflows.organizationId, input.organizationId));

      const [executionStats] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          success: sql<number>`count(*) filter (where status = 'success')::int`,
          failed: sql<number>`count(*) filter (where status = 'failed')::int`,
          skipped: sql<number>`count(*) filter (where status = 'skipped')::int`,
        })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.organizationId, input.organizationId));

      return {
        workflows: workflowStats ?? { total: 0, active: 0, paused: 0, disabled: 0 },
        executions: executionStats ?? { total: 0, success: 0, failed: 0, skipped: 0 },
      };
    }),
});
