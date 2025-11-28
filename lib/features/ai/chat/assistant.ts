/**
 * AI Chat Assistant
 *
 * Streaming chat interface using Vercel AI SDK and Claude 4.5 Sonnet.
 * Provides contextual assistance for lead management and insights.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

// Initialize Anthropic provider
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generate streaming chat response
 * @param messages - Conversation history
 * @param context - Additional context (lead data, org info, etc.)
 * @returns Streaming text response
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  context?: {
    organizationName?: string;
    recentLeads?: Array<{
      name?: string | null;
      company?: string | null;
      status?: string | null;
    }>;
  }
) {
  // Build system prompt with context
  const systemPrompt = `You are DiagnoLeads AI Assistant, a helpful AI that assists with B2B lead management.

You can help users with:
- Analyzing lead data and providing insights
- Suggesting follow-up actions
- Answering questions about leads
- Providing sales recommendations

${context?.organizationName ? `Organization: ${context.organizationName}` : ''}

${
  context?.recentLeads && context.recentLeads.length > 0
    ? `
Recent Leads:
${context.recentLeads.map((lead, i) => `${i + 1}. ${lead.name || 'Unknown'} from ${lead.company || 'Unknown Company'} (${lead.status || 'new'})`).join('\n')}
`
    : ''
}

Be concise, helpful, and professional. Focus on actionable insights.`;

  try {
    const result = await streamText({
      model: anthropic('claude-sonnet-4-20250514') as any,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}

/**
 * Generate lead summary
 * @param lead - Lead data to summarize
 * @returns AI-generated summary
 */
export async function generateLeadSummary(lead: {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  position?: string | null;
  notes?: string | null;
  status?: string | null;
}): Promise<string> {
  const prompt = `Provide a concise 2-3 sentence summary of this lead:

Name: ${lead.name || 'N/A'}
Company: ${lead.company || 'N/A'}
Industry: ${lead.industry || 'N/A'}
Position: ${lead.position || 'N/A'}
Status: ${lead.status || 'N/A'}
Notes: ${lead.notes || 'N/A'}

Focus on key business value and next steps.`;

  try {
    const result = await streamText({
      model: anthropic('claude-sonnet-4-20250514') as any,
      prompt,
    });

    // Convert stream to text
    let summary = '';
    for await (const textPart of result.textStream) {
      summary += textPart;
    }

    return summary.trim();
  } catch (error) {
    console.error('Error generating lead summary:', error);
    return 'Unable to generate summary';
  }
}
