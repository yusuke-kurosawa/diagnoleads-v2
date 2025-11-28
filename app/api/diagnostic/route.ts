import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Diagnostic Form API
 *
 * 公開診断フォームからの送信を処理
 * - リードとして保存
 * - AIスコアリング（将来実装）
 * - 通知送信（将来実装）
 */

// Validation schema
const diagnosticSchema = z.object({
  companyName: z.string().min(1),
  industry: z.string().min(1),
  employeeCount: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  position: z.string().optional(),
  currentChallenge: z.string().min(1),
  primaryGoal: z.string().min(1),
  timeline: z.string().min(1),
  budget: z.string().min(1),
  additionalInfo: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  locale: z.string().optional(),
  submittedAt: z.string().optional(),
});

// Score calculation based on responses
function calculateScore(data: z.infer<typeof diagnosticSchema>): number {
  let score = 50; // Base score

  // Industry scoring
  const industryScores: Record<string, number> = {
    technology: 15,
    finance: 12,
    healthcare: 10,
    manufacturing: 8,
    retail: 8,
    other: 5,
  };
  score += industryScores[data.industry] || 5;

  // Employee count scoring
  const employeeScores: Record<string, number> = {
    '1-10': 5,
    '11-50': 8,
    '51-200': 12,
    '201-500': 15,
    '501-1000': 18,
    '1000+': 20,
  };
  score += employeeScores[data.employeeCount] || 5;

  // Timeline scoring (urgency)
  const timelineScores: Record<string, number> = {
    immediate: 15,
    '1-3months': 12,
    '3-6months': 8,
    '6months+': 5,
  };
  score += timelineScores[data.timeline] || 5;

  // Budget scoring
  const budgetScores: Record<string, number> = {
    under10k: 5,
    '10k-50k': 10,
    '50k-100k': 15,
    '100k+': 20,
  };
  score += budgetScores[data.budget] || 5;

  // Bonus for complete profile
  if (data.phone) score += 2;
  if (data.position) score += 2;
  if (data.additionalInfo && data.additionalInfo.length > 50) score += 3;

  // Cap at 100
  return Math.min(score, 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = diagnosticSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Calculate lead score
    const score = calculateScore(data);

    // TODO: Save to database as a lead
    // This would typically:
    // 1. Create a new lead in the database
    // 2. Trigger AI scoring for more detailed analysis
    // 3. Send notification emails
    // 4. Queue for CRM integration

    // For now, return a success response with the score
    return NextResponse.json({
      success: true,
      message: 'Diagnostic submitted successfully',
      score,
      leadId: `lead_${Date.now()}`, // Placeholder ID
      data: {
        email: data.email,
        company: data.companyName,
        name: data.name,
      },
    });
  } catch (error) {
    console.error('Diagnostic API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
