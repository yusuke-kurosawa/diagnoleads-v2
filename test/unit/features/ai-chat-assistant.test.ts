import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the AI SDK
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn()),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

import { streamText } from 'ai';
import {
  type ChatMessage,
  generateChatResponse,
  generateLeadSummary,
} from '@/lib/features/ai/chat/assistant';

describe('ai-chat-assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateChatResponse', () => {
    it('should generate chat response with messages', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Hello!')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      const result = await generateChatResponse(messages);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
        })
      );
      expect(result).toBeInstanceOf(Response);
    });

    it('should include organization context in system prompt', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Response with context')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [{ role: 'user', content: 'Tell me about leads' }];
      const context = {
        organizationName: 'Acme Corp',
      };

      await generateChatResponse(messages, context);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Acme Corp'),
        })
      );
    });

    it('should include recent leads in context', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Response with leads')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [{ role: 'user', content: 'What are my recent leads?' }];
      const context = {
        recentLeads: [
          { name: 'John Doe', company: 'Tech Inc', status: 'contacted' },
          { name: 'Jane Smith', company: 'Sales Co', status: 'new' },
        ],
      };

      await generateChatResponse(messages, context);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('John Doe'),
        })
      );
    });

    it('should handle leads with null fields', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Response')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [{ role: 'user', content: 'Check leads' }];
      const context = {
        recentLeads: [
          { name: null, company: null, status: null },
          { name: 'Test', company: undefined, status: 'new' },
        ],
      };

      await generateChatResponse(messages, context);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Unknown'),
        })
      );
    });

    it('should handle empty context', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Response')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await generateChatResponse(messages, {});

      expect(streamText).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      (streamText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(generateChatResponse(messages)).rejects.toThrow('Failed to generate chat response');
    });

    it('should handle multiple messages in conversation', async () => {
      const mockResponse = {
        toTextStreamResponse: vi.fn().mockReturnValue(new Response('Response')),
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      await generateChatResponse(messages);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'How are you?' },
          ]),
        })
      );
    });
  });

  describe('generateLeadSummary', () => {
    it('should generate summary for a lead', async () => {
      const mockTextStream = {
        [Symbol.asyncIterator]: async function* () {
          yield 'This is ';
          yield 'a lead ';
          yield 'summary.';
        },
      };
      const mockResponse = {
        textStream: mockTextStream,
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const lead = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Tech Inc',
        industry: 'Technology',
        position: 'CEO',
        notes: 'Interested in product',
        status: 'contacted',
      };

      const result = await generateLeadSummary(lead);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('John Doe'),
        })
      );
      expect(result).toBe('This is a lead summary.');
    });

    it('should handle lead with null fields', async () => {
      const mockTextStream = {
        [Symbol.asyncIterator]: async function* () {
          yield 'Summary for unknown lead.';
        },
      };
      const mockResponse = {
        textStream: mockTextStream,
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const lead = {
        name: null,
        email: null,
        company: null,
        industry: null,
        position: null,
        notes: null,
        status: null,
      };

      const result = await generateLeadSummary(lead);

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('N/A'),
        })
      );
      expect(result).toBe('Summary for unknown lead.');
    });

    it('should handle partial lead data', async () => {
      const mockTextStream = {
        [Symbol.asyncIterator]: async function* () {
          yield 'Partial summary.';
        },
      };
      const mockResponse = {
        textStream: mockTextStream,
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const lead = {
        name: 'Jane',
        company: 'Acme',
      };

      const result = await generateLeadSummary(lead);

      expect(result).toBe('Partial summary.');
    });

    it('should return error message on API failure', async () => {
      (streamText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      const lead = {
        name: 'Test Lead',
      };

      const result = await generateLeadSummary(lead);

      expect(result).toBe('Unable to generate summary');
    });

    it('should trim whitespace from summary', async () => {
      const mockTextStream = {
        [Symbol.asyncIterator]: async function* () {
          yield '  Summary with spaces  ';
        },
      };
      const mockResponse = {
        textStream: mockTextStream,
      };
      (streamText as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const lead = { name: 'Test' };

      const result = await generateLeadSummary(lead);

      expect(result).toBe('Summary with spaces');
    });
  });
});
