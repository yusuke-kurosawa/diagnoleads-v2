/**
 * AI Lead Scoring Service using Claude 4.5 Sonnet
 *
 * Analyzes leads and provides intelligent scoring based on:
 * - Company size and industry
 * - Lead activity and engagement
 * - Potential value indicators
 */

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Lead score response schema
const LeadScoreSchema = z.object({
  score: z.number().min(0).max(100).describe('Lead score from 0-100'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level'),
  reasoning: z.string().describe('Explanation of the score'),
  recommendedActions: z.array(z.string()).describe('Suggested next steps'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Priority level'),
});

export type LeadScore = z.infer<typeof LeadScoreSchema>;

/**
 * Score a lead using Claude AI
 * @param lead - Lead information to analyze
 * @returns AI-generated lead score and recommendations
 */
export async function scoreLeadWithAI(lead: {
  name?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  position?: string | null;
  notes?: string | null;
  status?: string | null;
  createdAt?: Date;
}): Promise<LeadScore> {
  try {
    const prompt = `You are an expert B2B sales analyst. Analyze the following lead and provide a comprehensive score.

Lead Information:
- Name: ${lead.name || 'N/A'}
- Email: ${lead.email || 'N/A'}
- Company: ${lead.company || 'N/A'}
- Industry: ${lead.industry || 'N/A'}
- Position: ${lead.position || 'N/A'}
- Status: ${lead.status || 'N/A'}
- Notes: ${lead.notes || 'N/A'}
- Created: ${lead.createdAt ? lead.createdAt.toISOString() : 'N/A'}

Provide a JSON response with:
1. score (0-100): Overall lead quality score
2. confidence (low/medium/high): How confident you are in this score
3. reasoning: Brief explanation of the score
4. recommendedActions: Array of 2-3 specific action items
5. priority (low/medium/high/urgent): Priority level for follow-up

Consider factors like:
- Company size and reputation
- Decision-maker position
- Industry fit
- Lead engagement level
- Timing and urgency signals`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Parse JSON response (Claude might wrap it in markdown code blocks)
    const jsonMatch =
      content.text.match(/```json\n([\s\S]*?)\n```/) || content.text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonText);

    // Validate with Zod
    return LeadScoreSchema.parse(parsed);
  } catch (error) {
    console.error('Error scoring lead with AI:', error);

    // Return fallback score
    return {
      score: 50,
      confidence: 'low',
      reasoning: 'Unable to analyze lead due to an error',
      recommendedActions: ['Review lead information', 'Follow up manually'],
      priority: 'medium',
    };
  }
}

/**
 * Batch score multiple leads
 * @param leads - Array of leads to score
 * @returns Array of scores
 */
export async function scoreLeadsBatch(
  leads: Array<{
    id: string;
    name?: string | null;
    email?: string | null;
    company?: string | null;
    industry?: string | null;
    position?: string | null;
    notes?: string | null;
    status?: string | null;
    createdAt?: Date;
  }>
): Promise<Map<string, LeadScore>> {
  const scores = new Map<string, LeadScore>();

  // Process leads in parallel (with concurrency limit)
  const BATCH_SIZE = 5;
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (lead) => ({
        id: lead.id,
        score: await scoreLeadWithAI(lead),
      }))
    );

    for (const result of results) {
      scores.set(result.id, result.score);
    }
  }

  return scores;
}
