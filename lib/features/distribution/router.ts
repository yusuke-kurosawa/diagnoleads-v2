import { db } from '@/lib/db';
import { diagnosticTemplates, qrCampaigns, qrScans } from '@/lib/db/schema';
import { organizationProcedure, router } from '@/lib/trpc/init';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { buildTrackingUrl, generateQRCode, generateShortCode } from './qr-code';
import { createQRCampaignSchema, generateQRCodeSchema } from './types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const distributionRouter = router({
  /**
   * List all QR campaigns for the organization
   */
  listCampaigns: organizationProcedure.query(async ({ ctx }) => {
    const campaigns = await db.query.qrCampaigns.findMany({
      where: eq(qrCampaigns.organizationId, ctx.organization.id),
      orderBy: [desc(qrCampaigns.createdAt)],
      with: {
        diagnosticTemplate: {
          columns: {
            id: true,
            name: true,
            title: true,
          },
        },
      },
    });

    return campaigns;
  }),

  /**
   * Get a single QR campaign by ID
   */
  getCampaign: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const campaign = await db.query.qrCampaigns.findFirst({
        where: and(
          eq(qrCampaigns.id, input.id),
          eq(qrCampaigns.organizationId, ctx.organization.id)
        ),
        with: {
          diagnosticTemplate: true,
        },
      });

      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR campaign not found' });
      }

      // Generate fresh QR code
      const qrCodeDataUrl = await generateQRCode(campaign.trackingUrl, {
        size: 'large',
        format: 'dataUrl',
      });

      return {
        ...campaign,
        qrCodeDataUrl,
      };
    }),

  /**
   * Create a new QR campaign
   */
  createCampaign: organizationProcedure
    .input(createQRCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify template exists and belongs to organization
      const template = await db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, input.diagnosticTemplateId),
          eq(diagnosticTemplates.organizationId, ctx.organization.id)
        ),
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Diagnostic template not found' });
      }

      // Generate unique short code
      let shortCode = generateShortCode(8);
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db.query.qrCampaigns.findFirst({
          where: eq(qrCampaigns.shortCode, shortCode),
        });
        if (!existing) break;
        shortCode = generateShortCode(8);
        attempts++;
      }

      // Build tracking URL
      const trackingUrl = buildTrackingUrl(APP_URL, shortCode, {
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
      });

      const [campaign] = await db
        .insert(qrCampaigns)
        .values({
          organizationId: ctx.organization.id,
          diagnosticTemplateId: input.diagnosticTemplateId,
          name: input.name,
          description: input.description,
          shortCode,
          trackingUrl,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning();

      // Generate QR code
      const qrCodeDataUrl = await generateQRCode(trackingUrl, {
        size: 'large',
        format: 'dataUrl',
      });

      return {
        ...campaign,
        qrCodeDataUrl,
      };
    }),

  /**
   * Update a QR campaign
   */
  updateCampaign: organizationProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).optional(),
          isActive: z.boolean().optional(),
          expiresAt: z.string().datetime().nullable().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.qrCampaigns.findFirst({
        where: and(
          eq(qrCampaigns.id, input.id),
          eq(qrCampaigns.organizationId, ctx.organization.id)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR campaign not found' });
      }

      const [updated] = await db
        .update(qrCampaigns)
        .set({
          ...input.data,
          expiresAt: input.data.expiresAt ? new Date(input.data.expiresAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(qrCampaigns.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Delete a QR campaign
   */
  deleteCampaign: organizationProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.query.qrCampaigns.findFirst({
        where: and(
          eq(qrCampaigns.id, input.id),
          eq(qrCampaigns.organizationId, ctx.organization.id)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR campaign not found' });
      }

      await db.delete(qrCampaigns).where(eq(qrCampaigns.id, input.id));

      return { success: true };
    }),

  /**
   * Generate QR code for an existing campaign
   */
  generateCampaignQR: organizationProcedure
    .input(
      z.object({
        campaignId: z.string().uuid(),
        size: z.enum(['small', 'medium', 'large', 'xlarge']).default('large'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await db.query.qrCampaigns.findFirst({
        where: and(
          eq(qrCampaigns.id, input.campaignId),
          eq(qrCampaigns.organizationId, ctx.organization.id)
        ),
      });

      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR campaign not found' });
      }

      const qrCode = await generateQRCode(campaign.trackingUrl, {
        size: input.size,
        format: 'dataUrl',
      });

      return {
        qrCode: typeof qrCode === 'string' ? qrCode : qrCode.toString('base64'),
        shortCode: campaign.shortCode,
        trackingUrl: campaign.trackingUrl,
      };
    }),

  /**
   * Generate a QR code (on-demand, not stored)
   */
  generateQRCode: organizationProcedure
    .input(generateQRCodeSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify template exists
      const template = await db.query.diagnosticTemplates.findFirst({
        where: and(
          eq(diagnosticTemplates.id, input.diagnosticTemplateId),
          eq(diagnosticTemplates.organizationId, ctx.organization.id)
        ),
      });

      if (!template) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Diagnostic template not found' });
      }

      // Build tracking URL
      const trackingUrl = buildTrackingUrl(APP_URL, template.id, {
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
      });

      // Generate QR code
      const qrCode = await generateQRCode(trackingUrl, {
        size: input.size,
        format: input.format,
        color: input.color,
      });

      return {
        qrCode: typeof qrCode === 'string' ? qrCode : qrCode.toString('base64'),
        trackingUrl,
        format: input.format,
      };
    }),

  /**
   * Get scan statistics for a campaign
   */
  getCampaignStats: organizationProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const campaign = await db.query.qrCampaigns.findFirst({
        where: and(
          eq(qrCampaigns.id, input.campaignId),
          eq(qrCampaigns.organizationId, ctx.organization.id)
        ),
      });

      if (!campaign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'QR campaign not found' });
      }

      const scans = await db.query.qrScans.findMany({
        where: eq(qrScans.campaignId, input.campaignId),
        orderBy: [desc(qrScans.scannedAt)],
      });

      const deviceBreakdown = scans.reduce(
        (acc, scan) => {
          const type = scan.deviceType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const conversionRate =
        scans.length > 0 ? (scans.filter((s) => s.converted).length / scans.length) * 100 : 0;

      return {
        totalScans: campaign.scanCount,
        totalConversions: campaign.completionCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        deviceBreakdown,
        recentScans: scans.slice(0, 10),
      };
    }),
});
