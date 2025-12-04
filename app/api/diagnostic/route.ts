import { db } from '@/lib/db/client';
import { leads, organizations } from '@/lib/db/schema';
import { env } from '@/lib/env';
import { generateDiagnosticResultEmail, isEmailConfigured, sendEmail } from '@/lib/features/email';
import { triggerWebhooks } from '@/lib/features/webhooks/services/webhook-service';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Diagnostic Form API
 *
 * 公開診断フォームからの送信を処理
 * - リードとしてDBに保存
 * - Webhookをトリガー
 * - AIスコアリング（将来実装）
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

/**
 * Get or create the default organization for public diagnostic submissions
 */
async function getDefaultOrganization(): Promise<string> {
  // First, check if DEFAULT_ORGANIZATION_ID is set in env
  if (env.DEFAULT_ORGANIZATION_ID) {
    // Verify it exists
    const org = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.id, env.DEFAULT_ORGANIZATION_ID))
      .limit(1);

    if (org.length > 0) {
      return env.DEFAULT_ORGANIZATION_ID;
    }
  }

  // Look for existing "Public Leads" organization
  const publicOrg = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, 'public-leads'))
    .limit(1);

  if (publicOrg.length > 0) {
    return publicOrg[0].id;
  }

  // Create "Public Leads" organization
  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: 'Public Leads',
      slug: 'public-leads',
      organizationType: 'independent',
      settings: {
        description: 'Organization for leads from public diagnostic forms',
        isPublic: true,
      },
    })
    .returning({ id: organizations.id });

  return newOrg.id;
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

    // Get organization ID for public leads
    const organizationId = await getDefaultOrganization();

    // Save lead to database
    const [lead] = await db
      .insert(leads)
      .values({
        organizationId,
        email: data.email,
        name: data.name,
        company: data.companyName,
        phone: data.phone || null,
        status: 'new',
        score,
        source: 'website',
        responses: {
          industry: data.industry,
          employeeCount: data.employeeCount,
          position: data.position,
          currentChallenge: data.currentChallenge,
          primaryGoal: data.primaryGoal,
          timeline: data.timeline,
          budget: data.budget,
          additionalInfo: data.additionalInfo,
          marketingConsent: data.marketingConsent,
          locale: data.locale,
          submittedAt: data.submittedAt || new Date().toISOString(),
        },
      })
      .returning({ id: leads.id });

    // Trigger webhooks for diagnostic.submitted event (non-blocking)
    triggerWebhooks(organizationId, 'diagnostic.submitted', {
      leadId: lead.id,
      email: data.email,
      name: data.name,
      company: data.companyName,
      score,
      source: 'website',
      submittedAt: data.submittedAt || new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to trigger webhooks:', error);
    });

    // Send diagnostic result email (non-blocking)
    if (isEmailConfigured()) {
      const emailData = generateDiagnosticResultEmail({
        name: data.name,
        company: data.companyName,
        email: data.email,
        score,
        industry: data.industry,
        employeeCount: data.employeeCount,
        timeline: data.timeline,
        budget: data.budget,
        challenge: data.currentChallenge,
        goal: data.primaryGoal,
        locale: (data.locale as 'en' | 'ja') || 'en',
      });

      sendEmail({
        to: data.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      }).catch((error) => {
        console.error('Failed to send diagnostic result email:', error);
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Diagnostic submitted successfully',
      score,
      leadId: lead.id,
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
