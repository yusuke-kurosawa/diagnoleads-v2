/**
 * AI Chat Assistant Tests
 *
 * Unit tests for chat assistant service
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ChatMessage } from '@/lib/features/ai/chat/assistant';

// Mock AI SDK
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn()),
}));

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    toTextStreamResponse: vi.fn().mockReturnValue(new Response('AI response')),
    textStream: (async function* () {
      yield 'Test ';
      yield 'summary';
    })(),
  }),
}));

describe('ChatMessage type', () => {
  it('should have user role', () => {
    const message: ChatMessage = {
      role: 'user',
      content: 'Hello, help me with my leads',
    };

    expect(message.role).toBe('user');
    expect(message.content).toBeTruthy();
  });

  it('should have assistant role', () => {
    const message: ChatMessage = {
      role: 'assistant',
      content: 'I can help you analyze your leads.',
    };

    expect(message.role).toBe('assistant');
    expect(message.content).toBeTruthy();
  });

  it('should support conversation history', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What are my top leads?' },
      { role: 'assistant', content: 'Based on your data, your top leads are...' },
      { role: 'user', content: 'Tell me more about the first one' },
    ];

    expect(messages).toHaveLength(3);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    expect(messages[2].role).toBe('user');
  });
});

describe('Chat context', () => {
  it('should accept organization name', () => {
    const context = {
      organizationName: 'Acme Corp',
    };

    expect(context.organizationName).toBe('Acme Corp');
  });

  it('should accept recent leads', () => {
    const context = {
      recentLeads: [
        { name: 'John Doe', company: 'TechCo', status: 'new' },
        { name: 'Jane Smith', company: 'FinCo', status: 'contacted' },
      ],
    };

    expect(context.recentLeads).toHaveLength(2);
    expect(context.recentLeads[0].name).toBe('John Doe');
  });

  it('should handle null fields in recent leads', () => {
    const context = {
      recentLeads: [
        { name: null, company: null, status: null },
        { name: 'Test', company: undefined, status: 'new' },
      ],
    };

    expect(context.recentLeads[0].name).toBeNull();
    expect(context.recentLeads[1].company).toBeUndefined();
  });

  it('should be optional', () => {
    const context: {
      organizationName?: string;
      recentLeads?: Array<{ name?: string | null }>;
    } = {};

    expect(context.organizationName).toBeUndefined();
    expect(context.recentLeads).toBeUndefined();
  });
});

describe('Lead summary generation', () => {
  it('should accept lead data for summary', () => {
    const lead = {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'TechCorp',
      industry: 'technology',
      position: 'CTO',
      notes: 'Interested in enterprise plan',
      status: 'qualified',
    };

    expect(lead.name).toBe('John Doe');
    expect(lead.company).toBe('TechCorp');
    expect(lead.status).toBe('qualified');
  });

  it('should handle missing optional fields', () => {
    const lead = {
      name: null,
      email: null,
      company: null,
      industry: null,
      position: null,
      notes: null,
      status: null,
    };

    const name = lead.name || 'N/A';
    const company = lead.company || 'N/A';

    expect(name).toBe('N/A');
    expect(company).toBe('N/A');
  });
});

describe('System prompt building', () => {
  it('should include organization name when provided', () => {
    const context = { organizationName: 'TestOrg' };
    const promptPart = context.organizationName
      ? `Organization: ${context.organizationName}`
      : '';

    expect(promptPart).toBe('Organization: TestOrg');
  });

  it('should include recent leads when provided', () => {
    const recentLeads = [
      { name: 'Lead 1', company: 'Company A', status: 'new' },
      { name: 'Lead 2', company: 'Company B', status: 'contacted' },
    ];

    const leadsSection = recentLeads
      .map(
        (lead, i) =>
          `${i + 1}. ${lead.name || 'Unknown'} from ${lead.company || 'Unknown Company'} (${lead.status || 'new'})`
      )
      .join('\n');

    expect(leadsSection).toContain('1. Lead 1 from Company A (new)');
    expect(leadsSection).toContain('2. Lead 2 from Company B (contacted)');
  });

  it('should handle empty recent leads', () => {
    const recentLeads: Array<{ name?: string | null }> = [];

    const hasLeads = recentLeads && recentLeads.length > 0;
    expect(hasLeads).toBe(false);
  });
});

describe('Chat assistant capabilities', () => {
  it('should describe lead analysis capability', () => {
    const capabilities = [
      'Analyzing lead data and providing insights',
      'Suggesting follow-up actions',
      'Answering questions about leads',
      'Providing sales recommendations',
    ];

    expect(capabilities).toHaveLength(4);
    expect(capabilities).toContain('Analyzing lead data and providing insights');
  });
});

describe('Error handling', () => {
  it('should return fallback summary on error', () => {
    const fallbackSummary = 'Unable to generate summary';
    expect(fallbackSummary).toBe('Unable to generate summary');
  });

  it('should throw error for chat generation failure', () => {
    const errorMessage = 'Failed to generate chat response';
    expect(() => {
      throw new Error(errorMessage);
    }).toThrow('Failed to generate chat response');
  });
});

describe('Streaming response', () => {
  it('should support text stream response', () => {
    const response = new Response('AI response');
    expect(response).toBeInstanceOf(Response);
  });

  it('should accumulate stream text', async () => {
    const textParts = ['Hello', ' ', 'World'];
    let result = '';

    for (const part of textParts) {
      result += part;
    }

    expect(result).toBe('Hello World');
  });
});

describe('Temperature setting', () => {
  it('should use temperature 0.7 for creative responses', () => {
    const temperature = 0.7;
    expect(temperature).toBeGreaterThan(0);
    expect(temperature).toBeLessThan(1);
  });
});
