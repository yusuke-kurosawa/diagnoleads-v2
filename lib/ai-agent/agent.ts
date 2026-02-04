/**
 * AI Agent
 *
 * Autonomous AI agent with tool use capabilities
 */

import type {
  AgentConfig,
  AgentContext,
  AgentMessage,
  AgentResult,
  AgentStep,
  AgentTool,
  ToolCall,
} from './types';
import { DEFAULT_AGENT_CONFIG } from './types';

/**
 * AI Agent class
 */
export class Agent {
  private config: Required<AgentConfig>;
  private tools: Map<string, AgentTool>;

  constructor(config: AgentConfig = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    this.tools = new Map();
  }

  /**
   * Register a tool
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: AgentTool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  /**
   * Get registered tools
   */
  getTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Run the agent with a task
   */
  async run(input: string, context: Partial<AgentContext> = {}): Promise<AgentResult> {
    const startTime = Date.now();
    const steps: AgentStep[] = [];

    const agentContext: AgentContext = {
      organizationId: context.organizationId ?? '',
      userId: context.userId ?? '',
      messages: context.messages ?? [],
      tools: this.getTools(),
      steps,
      variables: context.variables ?? {},
    };

    // Add system message
    agentContext.messages.push({
      role: 'system',
      content: this.config.systemPrompt,
    });

    // Add user input
    agentContext.messages.push({
      role: 'user',
      content: input,
    });

    try {
      let iterations = 0;
      let finalResponse = '';

      while (iterations < this.config.maxIterations) {
        iterations++;

        if (this.config.verbose) {
          console.log(`[Agent] Iteration ${iterations}`);
        }

        // Get AI response
        const stepStart = Date.now();
        const aiResponse = await this.getAIResponse(agentContext);

        // Check if we have a final response (no tool calls)
        if (!aiResponse.toolCalls || aiResponse.toolCalls.length === 0) {
          steps.push({
            id: this.generateId(),
            type: 'response',
            content: aiResponse.content,
            timestamp: new Date(),
            duration: Date.now() - stepStart,
          });

          finalResponse = aiResponse.content;
          break;
        }

        // Record thinking step
        if (aiResponse.content) {
          steps.push({
            id: this.generateId(),
            type: 'thinking',
            content: aiResponse.content,
            timestamp: new Date(),
          });
        }

        // Execute tool calls
        for (const toolCall of aiResponse.toolCalls) {
          const toolStart = Date.now();

          steps.push({
            id: this.generateId(),
            type: 'tool_call',
            content: `Calling ${toolCall.name}`,
            toolCall,
            timestamp: new Date(),
          });

          const result = await this.executeTool(toolCall);

          steps.push({
            id: this.generateId(),
            type: 'tool_result',
            content: typeof result === 'string' ? result : JSON.stringify(result),
            toolResult: result,
            timestamp: new Date(),
            duration: Date.now() - toolStart,
          });

          // Add tool result to messages
          agentContext.messages.push({
            role: 'tool',
            content: typeof result === 'string' ? result : JSON.stringify(result),
            toolCallId: toolCall.id,
            toolName: toolCall.name,
          });
        }

        // Add assistant message
        agentContext.messages.push({
          role: 'assistant',
          content: aiResponse.content,
        });
      }

      return {
        success: true,
        response: finalResponse,
        steps,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        response: '',
        steps,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get AI response (mock implementation - replace with actual API call)
   */
  private async getAIResponse(context: AgentContext): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    // This is a mock implementation
    // In production, this would call Claude/OpenAI API

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if we should simulate a tool call
    const lastMessage = context.messages[context.messages.length - 1];
    const tools = context.tools;

    // Simple heuristic: if user asks to "search" or "find", use search tool
    if (
      lastMessage.role === 'user' &&
      tools.length > 0 &&
      (lastMessage.content.toLowerCase().includes('search') ||
        lastMessage.content.toLowerCase().includes('find') ||
        lastMessage.content.toLowerCase().includes('look up'))
    ) {
      const searchTool = tools.find((t) => t.name.includes('search'));
      if (searchTool) {
        return {
          content: 'I will search for that information.',
          toolCalls: [
            {
              id: this.generateId(),
              name: searchTool.name,
              arguments: { query: lastMessage.content },
            },
          ],
        };
      }
    }

    // Default: return a simple response
    return {
      content: `I understand your request: "${lastMessage.content}". How can I help further?`,
    };
  }

  /**
   * Execute a tool
   */
  private async executeTool(toolCall: ToolCall): Promise<unknown> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.name}`);
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Tool timeout: ${toolCall.name}`)),
        this.config.iterationTimeout
      );
    });

    return Promise.race([tool.execute(toolCall.arguments), timeoutPromise]);
  }

  private generateId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Create an agent with predefined configuration
 */
export function createAgent(config?: AgentConfig): Agent {
  return new Agent(config);
}

/**
 * Create a simple tool
 */
export function createTool(
  name: string,
  description: string,
  execute: (params: Record<string, unknown>) => Promise<unknown>,
  parameters: AgentTool['parameters'] = { type: 'object', properties: {} }
): AgentTool {
  return {
    name,
    description,
    parameters,
    execute,
  };
}
