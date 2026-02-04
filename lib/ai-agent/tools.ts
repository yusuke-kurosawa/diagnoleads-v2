/**
 * Built-in Agent Tools
 *
 * Predefined tools for common agent operations
 */

import type { AgentTool } from './types';

/**
 * Search leads tool
 */
export const searchLeadsTool: AgentTool = {
  name: 'search_leads',
  description: 'Search for leads in the database based on criteria',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string',
      },
      status: {
        type: 'string',
        description: 'Lead status filter',
        enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results',
      },
    },
    required: ['query'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      results: [
        { id: 'lead-1', name: 'John Doe', email: 'john@example.com', score: 85 },
        { id: 'lead-2', name: 'Jane Smith', email: 'jane@example.com', score: 72 },
      ],
      total: 2,
      query: params.query,
    };
  },
};

/**
 * Get lead details tool
 */
export const getLeadDetailsTool: AgentTool = {
  name: 'get_lead_details',
  description: 'Get detailed information about a specific lead',
  parameters: {
    type: 'object',
    properties: {
      leadId: {
        type: 'string',
        description: 'The lead ID to fetch',
      },
    },
    required: ['leadId'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      id: params.leadId,
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      score: 85,
      status: 'qualified',
      createdAt: '2024-01-15',
      interactions: [
        { type: 'email', date: '2024-01-16' },
        { type: 'call', date: '2024-01-18' },
      ],
    };
  },
};

/**
 * Update lead tool
 */
export const updateLeadTool: AgentTool = {
  name: 'update_lead',
  description: 'Update a lead with new information',
  parameters: {
    type: 'object',
    properties: {
      leadId: {
        type: 'string',
        description: 'The lead ID to update',
      },
      data: {
        type: 'object',
        description: 'Data to update',
      },
    },
    required: ['leadId', 'data'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      success: true,
      leadId: params.leadId,
      updated: params.data,
    };
  },
};

/**
 * Send email tool
 */
export const sendEmailTool: AgentTool = {
  name: 'send_email',
  description: 'Send an email to a contact',
  parameters: {
    type: 'object',
    properties: {
      to: {
        type: 'string',
        description: 'Recipient email address',
      },
      subject: {
        type: 'string',
        description: 'Email subject',
      },
      body: {
        type: 'string',
        description: 'Email body content',
      },
    },
    required: ['to', 'subject', 'body'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
      to: params.to,
      subject: params.subject,
    };
  },
};

/**
 * Get analytics tool
 */
export const getAnalyticsTool: AgentTool = {
  name: 'get_analytics',
  description: 'Get analytics data for a time period',
  parameters: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        description: 'Metric to retrieve',
        enum: ['leads', 'conversions', 'revenue', 'engagement'],
      },
      period: {
        type: 'string',
        description: 'Time period',
        enum: ['day', 'week', 'month', 'quarter', 'year'],
      },
    },
    required: ['metric', 'period'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      metric: params.metric,
      period: params.period,
      data: [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 120 },
        { date: '2024-01-03', value: 95 },
      ],
      summary: {
        total: 315,
        average: 105,
        trend: '+5%',
      },
    };
  },
};

/**
 * Create task tool
 */
export const createTaskTool: AgentTool = {
  name: 'create_task',
  description: 'Create a task or reminder',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Task title',
      },
      description: {
        type: 'string',
        description: 'Task description',
      },
      dueDate: {
        type: 'string',
        description: 'Due date (ISO format)',
      },
      assignee: {
        type: 'string',
        description: 'User ID to assign the task to',
      },
    },
    required: ['title'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      success: true,
      taskId: `task_${Date.now()}`,
      title: params.title,
      dueDate: params.dueDate,
    };
  },
};

/**
 * Search web tool
 */
export const searchWebTool: AgentTool = {
  name: 'search_web',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
    },
    required: ['query'],
  },
  execute: async (params) => {
    // Mock implementation
    return {
      results: [
        {
          title: 'Search Result 1',
          url: 'https://example.com/1',
          snippet: 'This is a relevant search result...',
        },
        {
          title: 'Search Result 2',
          url: 'https://example.com/2',
          snippet: 'Another relevant result...',
        },
      ],
      query: params.query,
    };
  },
};

/**
 * Calculate tool
 */
export const calculateTool: AgentTool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate',
      },
    },
    required: ['expression'],
  },
  execute: async (params) => {
    try {
      // Simple safe evaluation (in production, use a proper math library)
      const expression = String(params.expression).replace(/[^0-9+\-*/().%\s]/g, '');

      // Use Function constructor for evaluation (safer than eval)
      const result = new Function(`return ${expression}`)();

      return {
        expression: params.expression,
        result,
      };
    } catch (error) {
      return {
        expression: params.expression,
        error: 'Invalid expression',
      };
    }
  },
};

/**
 * Get all built-in tools
 */
export function getBuiltInTools(): AgentTool[] {
  return [
    searchLeadsTool,
    getLeadDetailsTool,
    updateLeadTool,
    sendEmailTool,
    getAnalyticsTool,
    createTaskTool,
    searchWebTool,
    calculateTool,
  ];
}

/**
 * Get tools by category
 */
export function getToolsByCategory(
  category: 'leads' | 'email' | 'analytics' | 'tasks' | 'utility'
): AgentTool[] {
  const categories: Record<string, AgentTool[]> = {
    leads: [searchLeadsTool, getLeadDetailsTool, updateLeadTool],
    email: [sendEmailTool],
    analytics: [getAnalyticsTool],
    tasks: [createTaskTool],
    utility: [searchWebTool, calculateTool],
  };

  return categories[category] ?? [];
}
