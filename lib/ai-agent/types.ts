/**
 * AI Agent Types
 *
 * Type definitions for the autonomous AI agent system
 */

/**
 * Agent status
 */
export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'completed' | 'failed';

/**
 * Tool definition for agent
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Agent message
 */
export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
}

/**
 * Tool call from AI
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Agent step
 */
export interface AgentStep {
  id: string;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response';
  content: string;
  toolCall?: ToolCall;
  toolResult?: unknown;
  timestamp: Date;
  duration?: number;
}

/**
 * Agent execution context
 */
export interface AgentContext {
  /** Organization ID */
  organizationId: string;
  /** User ID */
  userId: string;
  /** Conversation history */
  messages: AgentMessage[];
  /** Available tools */
  tools: AgentTool[];
  /** Execution steps */
  steps: AgentStep[];
  /** Custom variables */
  variables: Record<string, unknown>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Model to use */
  model?: string;
  /** Maximum iterations */
  maxIterations?: number;
  /** Maximum tokens per response */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** System prompt */
  systemPrompt?: string;
  /** Timeout per iteration (ms) */
  iterationTimeout?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  response: string;
  steps: AgentStep[];
  totalTokens?: number;
  duration: number;
  error?: string;
}

/**
 * Agent task
 */
export interface AgentTask {
  id: string;
  type: string;
  input: string;
  context: Record<string, unknown>;
  status: AgentStatus;
  result?: AgentResult;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Predefined agent types
 */
export type AgentType =
  | 'lead-qualifier'
  | 'lead-enricher'
  | 'report-generator'
  | 'data-analyst'
  | 'customer-support'
  | 'content-writer';

/**
 * Agent type configurations
 */
export const AGENT_CONFIGS: Record<AgentType, Partial<AgentConfig>> = {
  'lead-qualifier': {
    systemPrompt: `You are a lead qualification specialist. Analyze leads and determine their quality score based on available data. Use the provided tools to gather information and make decisions.`,
    maxIterations: 5,
    temperature: 0.3,
  },
  'lead-enricher': {
    systemPrompt: `You are a data enrichment specialist. Find and add relevant information to lead profiles using available tools and external data sources.`,
    maxIterations: 8,
    temperature: 0.2,
  },
  'report-generator': {
    systemPrompt: `You are a business analyst. Generate comprehensive reports based on data analysis. Use tools to query data and create insights.`,
    maxIterations: 10,
    temperature: 0.5,
  },
  'data-analyst': {
    systemPrompt: `You are a data analyst. Analyze patterns, trends, and anomalies in business data. Provide actionable insights.`,
    maxIterations: 8,
    temperature: 0.4,
  },
  'customer-support': {
    systemPrompt: `You are a helpful customer support agent. Answer questions accurately and help users with their issues.`,
    maxIterations: 6,
    temperature: 0.7,
  },
  'content-writer': {
    systemPrompt: `You are a content writer. Create engaging and professional content based on provided guidelines and data.`,
    maxIterations: 5,
    temperature: 0.8,
  },
};

/**
 * Default agent configuration
 */
export const DEFAULT_AGENT_CONFIG: Required<AgentConfig> = {
  model: 'claude-3-5-sonnet-20241022',
  maxIterations: 10,
  maxTokens: 4096,
  temperature: 0.5,
  systemPrompt: 'You are a helpful AI assistant.',
  iterationTimeout: 30000,
  verbose: false,
};
