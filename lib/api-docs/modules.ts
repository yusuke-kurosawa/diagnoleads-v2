/**
 * API Modules
 *
 * Predefined API module definitions for documentation
 */

import type { ApiModule, ApiEndpoint } from './types';

/**
 * System module
 */
export const systemModule: ApiModule = {
  name: 'system',
  description: 'System health and status endpoints',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/health',
      method: 'get',
      summary: 'Health check',
      description: 'Check if the API is running and healthy',
      tags: ['System'],
      security: false,
      responses: {
        '200': {
          description: 'Service is healthy',
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['ok'] },
              timestamp: { type: 'string', format: 'date-time' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
  ],
};

/**
 * Feature Flags module
 */
export const featureFlagsModule: ApiModule = {
  name: 'feature-flags',
  description: 'Feature flag management',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/trpc/featureFlags.list',
      method: 'get',
      summary: 'List feature flags',
      description: 'Get all feature flags for the organization',
      tags: ['Feature Flags'],
      responses: {
        '200': {
          description: 'List of feature flags',
          schema: {
            type: 'object',
            properties: {
              flags: {
                type: 'array',
                items: { $ref: '#/components/schemas/FeatureFlag' },
              },
            },
          },
        },
      },
    },
    {
      path: '/api/trpc/featureFlags.evaluate',
      method: 'post',
      summary: 'Evaluate feature flag',
      description: 'Check if a feature flag is enabled for the current context',
      tags: ['Feature Flags'],
      requestBody: {
        schema: {
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
          required: ['key'],
        },
      },
      responses: {
        '200': {
          description: 'Feature flag evaluation result',
          schema: {
            type: 'object',
            properties: {
              enabled: { type: 'boolean' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  ],
  schemas: {
    FeatureFlag: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        key: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
        strategy: {
          type: 'string',
          enum: ['all', 'none', 'percentage', 'organization', 'user', 'environment'],
        },
        rolloutPercentage: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
  },
};

/**
 * Audit Logs module
 */
export const auditLogsModule: ApiModule = {
  name: 'audit-logs',
  description: 'Audit logging and compliance',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/trpc/auditLogs.list',
      method: 'get',
      summary: 'List audit logs',
      description: 'Get audit logs for the organization with optional filtering',
      tags: ['Audit Logs'],
      parameters: [
        { name: 'action', in: 'query', schema: { type: 'string' } },
        { name: 'resource', in: 'query', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
      ],
      responses: {
        '200': {
          description: 'List of audit logs',
          schema: {
            type: 'object',
            properties: {
              logs: {
                type: 'array',
                items: { $ref: '#/components/schemas/AuditLog' },
              },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
    {
      path: '/api/trpc/auditLogs.export',
      method: 'post',
      summary: 'Export audit logs',
      description: 'Export audit logs as CSV or JSON',
      tags: ['Audit Logs'],
      requestBody: {
        schema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            format: { type: 'string', enum: ['csv', 'json'] },
          },
          required: ['startDate', 'endDate', 'format'],
        },
      },
      responses: {
        '200': {
          description: 'Exported audit logs',
          schema: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              content: { type: 'string' },
              filename: { type: 'string' },
            },
          },
        },
      },
    },
  ],
  schemas: {
    AuditLog: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        action: {
          type: 'string',
          enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'export'],
        },
        resource: { type: 'string' },
        resourceId: { type: 'string' },
        userId: { type: 'string' },
        ipAddress: { type: 'string' },
        changes: { type: 'object' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

/**
 * Workflows module
 */
export const workflowsModule: ApiModule = {
  name: 'workflows',
  description: 'Workflow automation',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/trpc/workflows.list',
      method: 'get',
      summary: 'List workflows',
      description: 'Get all workflows for the organization',
      tags: ['Workflows'],
      responses: {
        '200': {
          description: 'List of workflows',
          schema: {
            type: 'object',
            properties: {
              workflows: {
                type: 'array',
                items: { $ref: '#/components/schemas/Workflow' },
              },
            },
          },
        },
      },
    },
    {
      path: '/api/trpc/workflows.execute',
      method: 'post',
      summary: 'Execute workflow',
      description: 'Manually trigger a workflow execution',
      tags: ['Workflows'],
      requestBody: {
        schema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string' },
            input: { type: 'object' },
          },
          required: ['workflowId'],
        },
      },
      responses: {
        '200': {
          description: 'Workflow execution started',
          schema: {
            type: 'object',
            properties: {
              executionId: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
  ],
  schemas: {
    Workflow: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'active', 'paused', 'archived'] },
        nodes: { type: 'array', items: { type: 'object' } },
        edges: { type: 'array', items: { type: 'object' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
};

/**
 * AI Agent module
 */
export const aiAgentModule: ApiModule = {
  name: 'ai-agent',
  description: 'AI Agent operations',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/trpc/ai.runAgent',
      method: 'post',
      summary: 'Run AI Agent',
      description: 'Execute an AI agent with the given task',
      tags: ['AI'],
      requestBody: {
        schema: {
          type: 'object',
          properties: {
            agentType: {
              type: 'string',
              enum: ['lead-qualifier', 'lead-enricher', 'report-generator', 'data-analyst'],
            },
            input: { type: 'string' },
            context: { type: 'object' },
          },
          required: ['agentType', 'input'],
        },
      },
      responses: {
        '200': {
          description: 'Agent execution result',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              response: { type: 'string' },
              steps: { type: 'array', items: { type: 'object' } },
              duration: { type: 'number' },
            },
          },
        },
      },
    },
  ],
};

/**
 * Plugins module
 */
export const pluginsModule: ApiModule = {
  name: 'plugins',
  description: 'Plugin management',
  version: '1.0.0',
  endpoints: [
    {
      path: '/api/trpc/plugins.list',
      method: 'get',
      summary: 'List plugins',
      description: 'Get all registered plugins',
      tags: ['Plugins'],
      responses: {
        '200': {
          description: 'List of plugins',
          schema: {
            type: 'object',
            properties: {
              plugins: {
                type: 'array',
                items: { $ref: '#/components/schemas/Plugin' },
              },
            },
          },
        },
      },
    },
  ],
  schemas: {
    Plugin: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        status: { type: 'string', enum: ['registered', 'active', 'disabled', 'error'] },
        description: { type: 'string' },
      },
    },
  },
};

/**
 * Get all predefined modules
 */
export function getAllModules(): ApiModule[] {
  return [
    systemModule,
    featureFlagsModule,
    auditLogsModule,
    workflowsModule,
    aiAgentModule,
    pluginsModule,
  ];
}
