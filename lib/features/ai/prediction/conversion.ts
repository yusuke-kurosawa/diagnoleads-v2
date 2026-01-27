/**
 * Conversion Prediction Service
 * Uses AI to predict lead conversion probability
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client lazily
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }
  return anthropicClient;
}

export interface LeadForPrediction {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  status: string;
  score: number | null;
  source: string | null;
  responses: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionPrediction {
  /** Conversion probability (0-100) */
  probability: number;
  /** Confidence level (low, medium, high) */
  confidence: 'low' | 'medium' | 'high';
  /** Predicted days to conversion (null if unlikely) */
  estimatedDaysToConversion: number | null;
  /** Key factors influencing the prediction */
  factors: ConversionFactor[];
  /** Recommended actions to improve conversion */
  recommendations: string[];
  /** Risk factors that may prevent conversion */
  risks: string[];
}

export interface ConversionFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

/**
 * Predict conversion probability for a single lead
 */
export async function predictConversion(lead: LeadForPrediction): Promise<ConversionPrediction> {
  const client = getAnthropicClient();

  const prompt = buildPredictionPrompt(lead);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    return parsePredictionResponse(responseText, lead);
  } catch (error) {
    console.error('Conversion prediction error:', error);
    // Return a fallback prediction based on simple heuristics
    return generateFallbackPrediction(lead);
  }
}

/**
 * Batch predict conversion for multiple leads
 */
export async function predictConversionBatch(
  leads: LeadForPrediction[]
): Promise<Map<string, ConversionPrediction>> {
  const results = new Map<string, ConversionPrediction>();

  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < leads.length; i += batchSize) {
    const batch = leads.slice(i, i + batchSize);
    const predictions = await Promise.all(batch.map((lead) => predictConversion(lead)));
    batch.forEach((lead, index) => {
      results.set(lead.id, predictions[index]);
    });
  }

  return results;
}

/**
 * Build the prompt for conversion prediction
 */
function buildPredictionPrompt(lead: LeadForPrediction): string {
  const leadAge = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return `You are an expert B2B sales analyst. Analyze this lead and predict their conversion probability.

Lead Information:
- Email: ${lead.email}
- Name: ${lead.name || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Phone: ${lead.phone ? 'Provided' : 'Not provided'}
- Current Status: ${lead.status}
- Lead Score: ${lead.score ?? 'Not scored'}
- Source: ${lead.source || 'Unknown'}
- Days Since Creation: ${leadAge}
- Diagnostic Responses: ${JSON.stringify(lead.responses || {}, null, 2)}

Based on this information, provide a conversion prediction in the following JSON format:
{
  "probability": <number 0-100>,
  "confidence": "<low|medium|high>",
  "estimatedDaysToConversion": <number or null>,
  "factors": [
    {
      "name": "<factor name>",
      "impact": "<positive|negative|neutral>",
      "weight": <number 1-10>,
      "description": "<brief description>"
    }
  ],
  "recommendations": ["<action 1>", "<action 2>"],
  "risks": ["<risk 1>", "<risk 2>"]
}

Consider:
1. Lead completeness (contact info, company info)
2. Engagement signals (responses, score)
3. Time factors (lead age, status progression)
4. Source quality
5. Industry patterns for B2B conversion

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Parse the AI response into a ConversionPrediction
 */
function parsePredictionResponse(response: string, lead: LeadForPrediction): ConversionPrediction {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      probability: Math.min(100, Math.max(0, Number(parsed.probability) || 0)),
      confidence: validateConfidence(parsed.confidence),
      estimatedDaysToConversion: parsed.estimatedDaysToConversion ?? null,
      factors: (parsed.factors || []).map((f: ConversionFactor) => ({
        name: String(f.name || ''),
        impact: validateImpact(f.impact),
        weight: Math.min(10, Math.max(1, Number(f.weight) || 5)),
        description: String(f.description || ''),
      })),
      recommendations: (parsed.recommendations || []).map(String),
      risks: (parsed.risks || []).map(String),
    };
  } catch {
    return generateFallbackPrediction(lead);
  }
}

/**
 * Generate a fallback prediction based on simple heuristics
 */
function generateFallbackPrediction(lead: LeadForPrediction): ConversionPrediction {
  let probability = 30; // Base probability
  const factors: ConversionFactor[] = [];

  // Score factor
  if (lead.score !== null) {
    if (lead.score >= 80) {
      probability += 25;
      factors.push({
        name: 'High Lead Score',
        impact: 'positive',
        weight: 8,
        description: 'Lead has a high engagement score',
      });
    } else if (lead.score >= 50) {
      probability += 10;
      factors.push({
        name: 'Medium Lead Score',
        impact: 'positive',
        weight: 5,
        description: 'Lead has a moderate engagement score',
      });
    }
  }

  // Status factor
  if (lead.status === 'qualified') {
    probability += 20;
    factors.push({
      name: 'Qualified Status',
      impact: 'positive',
      weight: 7,
      description: 'Lead has been qualified by sales team',
    });
  } else if (lead.status === 'contacted') {
    probability += 10;
    factors.push({
      name: 'Contacted Status',
      impact: 'positive',
      weight: 5,
      description: 'Lead has been contacted',
    });
  }

  // Completeness factor
  const hasName = !!lead.name;
  const hasCompany = !!lead.company;
  const hasPhone = !!lead.phone;
  const completeness = [hasName, hasCompany, hasPhone].filter(Boolean).length;

  if (completeness >= 2) {
    probability += 10;
    factors.push({
      name: 'Complete Profile',
      impact: 'positive',
      weight: 4,
      description: 'Lead has provided good contact information',
    });
  } else if (completeness === 0) {
    probability -= 10;
    factors.push({
      name: 'Incomplete Profile',
      impact: 'negative',
      weight: 3,
      description: 'Missing key contact information',
    });
  }

  // Source factor
  if (lead.source === 'website') {
    probability += 5;
    factors.push({
      name: 'Website Source',
      impact: 'positive',
      weight: 3,
      description: 'Lead came from direct website engagement',
    });
  }

  // Cap probability
  probability = Math.min(95, Math.max(5, probability));

  // Determine confidence
  const confidence: 'low' | 'medium' | 'high' =
    factors.length >= 3 ? 'high' : factors.length >= 2 ? 'medium' : 'low';

  // Estimate days to conversion
  const estimatedDaysToConversion = probability >= 60 ? Math.round(30 - probability * 0.2) : null;

  // Generate recommendations
  const recommendations: string[] = [];
  if (!hasPhone) {
    recommendations.push('Request phone number for direct contact');
  }
  if (lead.status === 'new') {
    recommendations.push('Initiate first contact within 24 hours');
  }
  if (lead.score === null || lead.score < 50) {
    recommendations.push('Send nurturing content to increase engagement');
  }

  // Identify risks
  const risks: string[] = [];
  if (lead.status === 'new') {
    const leadAge = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (leadAge > 7) {
      risks.push('Lead aging without engagement - risk of going cold');
    }
  }
  if (!hasCompany) {
    risks.push('Unknown company - difficult to qualify business fit');
  }

  return {
    probability,
    confidence,
    estimatedDaysToConversion,
    factors,
    recommendations,
    risks,
  };
}

function validateConfidence(value: unknown): 'low' | 'medium' | 'high' {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'medium';
}

function validateImpact(value: unknown): 'positive' | 'negative' | 'neutral' {
  if (value === 'positive' || value === 'negative' || value === 'neutral') {
    return value;
  }
  return 'neutral';
}
