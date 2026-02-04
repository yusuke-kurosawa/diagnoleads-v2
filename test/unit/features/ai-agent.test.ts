/**
 * AI Agent Tests
 *
 * Unit tests for the AI agent system
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Agent, createAgent, createTool } from '@/lib/ai-agent/agent';
import {
  getBuiltInTools,
  getToolsByCategory,
  searchLeadsTool,
  calculateTool,
} from '@/lib/ai-agent/tools';
import { DEFAULT_AGENT_CONFIG, AGENT_CONFIGS } from '@/lib/ai-agent/types';
import type { AgentTool } from '@/lib/ai-agent/types';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = createAgent({ verbose: false });
  });

  describe('registerTool', () => {
    it('should register a tool', () => {
      const tool = createTool('test', 'A test tool', async () => 'result');

      agent.registerTool(tool);

      expect(agent.getTools()).toHaveLength(1);
      expect(agent.getTools()[0].name).toBe('test');
    });

    it('should register multiple tools', () => {
      const tools = [
        createTool('tool1', 'Tool 1', async () => 'result1'),
        createTool('tool2', 'Tool 2', async () => 'result2'),
      ];

      agent.registerTools(tools);

      expect(agent.getTools()).toHaveLength(2);
    });
  });

  describe('run', () => {
    it('should run and return a result', async () => {
      const result = await agent.run('Hello, how are you?');

      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should include context in execution', async () => {
      const result = await agent.run('Test input', {
        organizationId: 'org-123',
        userId: 'user-456',
        variables: { custom: 'value' },
      });

      expect(result.success).toBe(true);
    });

    it('should record steps', async () => {
      const result = await agent.run('Simple question');

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0].type).toBe('response');
    });

    it('should use tools when appropriate', async () => {
      agent.registerTool(
        createTool(
          'search',
          'Search for items',
          async (params) => ({ results: ['item1', 'item2'], query: params.query }),
          {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
          }
        )
      );

      const result = await agent.run('Search for something');

      expect(result.success).toBe(true);
      // Should have tool_call and tool_result steps
      const toolSteps = result.steps.filter(
        (s) => s.type === 'tool_call' || s.type === 'tool_result'
      );
      expect(toolSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle tool errors gracefully', async () => {
      agent.registerTool(
        createTool('failing_tool', 'A tool that fails', async () => {
          throw new Error('Tool error');
        })
      );

      // This should not throw
      const result = await agent.run('Search for something');
      expect(result).toBeDefined();
    });
  });

  describe('with predefined configs', () => {
    it('should create agent with lead-qualifier config', () => {
      const qualifierAgent = createAgent(AGENT_CONFIGS['lead-qualifier']);

      expect(qualifierAgent).toBeInstanceOf(Agent);
    });

    it('should create agent with all predefined types', () => {
      const types = [
        'lead-qualifier',
        'lead-enricher',
        'report-generator',
        'data-analyst',
        'customer-support',
        'content-writer',
      ] as const;

      for (const type of types) {
        const agent = createAgent(AGENT_CONFIGS[type]);
        expect(agent).toBeInstanceOf(Agent);
      }
    });
  });
});

describe('createTool', () => {
  it('should create a basic tool', () => {
    const tool = createTool('my_tool', 'My description', async () => 'result');

    expect(tool.name).toBe('my_tool');
    expect(tool.description).toBe('My description');
    expect(tool.parameters.type).toBe('object');
  });

  it('should create a tool with parameters', () => {
    const tool = createTool(
      'parameterized_tool',
      'Tool with params',
      async (params) => params,
      {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input value' },
        },
        required: ['input'],
      }
    );

    expect(tool.parameters.properties.input).toBeDefined();
    expect(tool.parameters.required).toContain('input');
  });

  it('should execute and return result', async () => {
    const tool = createTool('exec_tool', 'Executable', async (params) => ({
      received: params,
    }));

    const result = await tool.execute({ test: 'value' });

    expect(result).toEqual({ received: { test: 'value' } });
  });
});

describe('Built-in Tools', () => {
  describe('getBuiltInTools', () => {
    it('should return all built-in tools', () => {
      const tools = getBuiltInTools();

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.every((t) => t.name && t.description && t.execute)).toBe(true);
    });

    it('should include expected tools', () => {
      const tools = getBuiltInTools();
      const names = tools.map((t) => t.name);

      expect(names).toContain('search_leads');
      expect(names).toContain('get_lead_details');
      expect(names).toContain('send_email');
      expect(names).toContain('get_analytics');
    });
  });

  describe('getToolsByCategory', () => {
    it('should return lead tools', () => {
      const tools = getToolsByCategory('leads');

      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t) => t.name === 'search_leads')).toBe(true);
    });

    it('should return analytics tools', () => {
      const tools = getToolsByCategory('analytics');

      expect(tools.some((t) => t.name === 'get_analytics')).toBe(true);
    });

    it('should return utility tools', () => {
      const tools = getToolsByCategory('utility');

      expect(tools.some((t) => t.name === 'calculate')).toBe(true);
    });
  });

  describe('searchLeadsTool', () => {
    it('should search leads', async () => {
      const result = await searchLeadsTool.execute({ query: 'tech' });

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
    });
  });

  describe('calculateTool', () => {
    it('should calculate expressions', async () => {
      const result = await calculateTool.execute({ expression: '2 + 3 * 4' });

      expect(result).toHaveProperty('result');
      expect((result as { result: number }).result).toBe(14);
    });

    it('should handle invalid expressions', async () => {
      const result = await calculateTool.execute({ expression: 'abc + xyz' });

      // After sanitization, this becomes empty and returns NaN or error
      expect(result).toBeDefined();
    });
  });
});

describe('Agent Configs', () => {
  it('should have correct default config', () => {
    expect(DEFAULT_AGENT_CONFIG.maxIterations).toBe(10);
    expect(DEFAULT_AGENT_CONFIG.temperature).toBe(0.5);
    expect(DEFAULT_AGENT_CONFIG.model).toContain('claude');
  });

  it('should have all agent type configs', () => {
    expect(AGENT_CONFIGS['lead-qualifier']).toBeDefined();
    expect(AGENT_CONFIGS['lead-enricher']).toBeDefined();
    expect(AGENT_CONFIGS['report-generator']).toBeDefined();
    expect(AGENT_CONFIGS['data-analyst']).toBeDefined();
    expect(AGENT_CONFIGS['customer-support']).toBeDefined();
    expect(AGENT_CONFIGS['content-writer']).toBeDefined();
  });

  it('should have appropriate settings per type', () => {
    // Lead qualifier should have low temperature for consistency
    expect(AGENT_CONFIGS['lead-qualifier'].temperature).toBeLessThan(0.5);

    // Content writer should have higher temperature for creativity
    expect(AGENT_CONFIGS['content-writer'].temperature).toBeGreaterThan(0.5);
  });
});
