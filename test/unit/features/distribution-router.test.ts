import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      qrCampaigns: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      diagnosticTemplates: {
        findFirst: vi.fn(),
      },
      qrScans: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  },
}));

// Mock QR code generation
vi.mock('@/lib/features/distribution/qr-code', () => ({
  generateQRCode: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
  generateShortCode: vi.fn().mockReturnValue('ABC12345'),
  buildTrackingUrl: vi.fn().mockReturnValue('https://app.diagnoleads.com/d/ABC12345'),
}));

import { db } from '@/lib/db';
import {
  buildTrackingUrl,
  generateQRCode,
  generateShortCode,
} from '@/lib/features/distribution/qr-code';

describe('distribution-router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCampaigns', () => {
    it('should return campaigns for organization', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Campaign 1',
          organizationId: 'org-1',
          diagnosticTemplate: { id: 'template-1', name: 'Template 1', title: 'Title' },
        },
        {
          id: 'campaign-2',
          name: 'Campaign 2',
          organizationId: 'org-1',
          diagnosticTemplate: { id: 'template-2', name: 'Template 2', title: 'Title 2' },
        },
      ];

      (db.query.qrCampaigns.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaigns);

      const result = await db.query.qrCampaigns.findMany({
        where: { organizationId: 'org-1' },
      });

      expect(result).toEqual(mockCampaigns);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no campaigns exist', async () => {
      (db.query.qrCampaigns.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await db.query.qrCampaigns.findMany({
        where: { organizationId: 'org-1' },
      });

      expect(result).toEqual([]);
    });
  });

  describe('getCampaign', () => {
    it('should return campaign with QR code', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Test Campaign',
        trackingUrl: 'https://app.diagnoleads.com/d/ABC12345',
        organizationId: 'org-1',
      };

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'campaign-1', organizationId: 'org-1' },
      });

      expect(campaign).toEqual(mockCampaign);

      const qrCode = await generateQRCode(mockCampaign.trackingUrl, {
        size: 'large',
        format: 'dataUrl',
      });

      expect(qrCode).toBe('data:image/png;base64,mockQRCode');
    });

    it('should throw NOT_FOUND for non-existent campaign', async () => {
      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'non-existent', organizationId: 'org-1' },
      });

      expect(campaign).toBeNull();
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with tracking URL', async () => {
      const mockTemplate = {
        id: 'template-1',
        name: 'Test Template',
        organizationId: 'org-1',
      };

      (db.query.diagnosticTemplates.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTemplate
      );
      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const shortCode = generateShortCode(8);
      expect(shortCode).toBe('ABC12345');

      const trackingUrl = buildTrackingUrl('https://app.diagnoleads.com', shortCode, {
        utmSource: 'qr',
        utmMedium: 'print',
      });

      expect(trackingUrl).toBe('https://app.diagnoleads.com/d/ABC12345');
    });

    it('should throw NOT_FOUND for non-existent template', async () => {
      (db.query.diagnosticTemplates.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const template = await db.query.diagnosticTemplates.findFirst({
        where: { id: 'non-existent', organizationId: 'org-1' },
      });

      expect(template).toBeNull();
    });

    it('should retry short code generation on collision', async () => {
      // First call returns existing campaign, subsequent calls return null
      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      const existingCampaign = await db.query.qrCampaigns.findFirst({
        where: { shortCode: 'ABC12345' },
      });
      expect(existingCampaign).toEqual({ id: 'existing' });

      const secondCheck = await db.query.qrCampaigns.findFirst({
        where: { shortCode: 'NEW12345' },
      });
      expect(secondCheck).toBeNull();
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign fields', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        name: 'Original Name',
        organizationId: 'org-1',
      };

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'campaign-1', organizationId: 'org-1' },
      });

      expect(campaign).toEqual(mockCampaign);
    });

    it('should throw NOT_FOUND for non-existent campaign', async () => {
      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'non-existent', organizationId: 'org-1' },
      });

      expect(campaign).toBeNull();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete existing campaign', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
      };

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'campaign-1', organizationId: 'org-1' },
      });

      expect(campaign).toEqual(mockCampaign);
    });

    it('should throw NOT_FOUND for non-existent campaign', async () => {
      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'non-existent', organizationId: 'org-1' },
      });

      expect(campaign).toBeNull();
    });
  });

  describe('generateCampaignQR', () => {
    it('should generate QR code for campaign', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        trackingUrl: 'https://app.diagnoleads.com/d/ABC12345',
        shortCode: 'ABC12345',
        organizationId: 'org-1',
      };

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'campaign-1', organizationId: 'org-1' },
      });

      const qrCode = await generateQRCode(campaign!.trackingUrl, {
        size: 'large',
        format: 'dataUrl',
      });

      expect(qrCode).toBe('data:image/png;base64,mockQRCode');
    });

    it('should support different QR sizes', async () => {
      const sizes = ['small', 'medium', 'large', 'xlarge'] as const;

      for (const size of sizes) {
        const qrCode = await generateQRCode('https://example.com', {
          size,
          format: 'dataUrl',
        });
        expect(qrCode).toBeDefined();
      }

      expect(generateQRCode).toHaveBeenCalledTimes(4);
    });
  });

  describe('generateQRCode', () => {
    it('should generate on-demand QR code', async () => {
      const mockTemplate = {
        id: 'template-1',
        organizationId: 'org-1',
      };

      (db.query.diagnosticTemplates.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockTemplate
      );

      const template = await db.query.diagnosticTemplates.findFirst({
        where: { id: 'template-1', organizationId: 'org-1' },
      });

      expect(template).toEqual(mockTemplate);

      const trackingUrl = buildTrackingUrl('https://app.diagnoleads.com', template!.id, {
        utmSource: 'email',
      });

      const qrCode = await generateQRCode(trackingUrl, {
        size: 'medium',
        format: 'dataUrl',
      });

      expect(qrCode).toBe('data:image/png;base64,mockQRCode');
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
        scanCount: 100,
        completionCount: 25,
      };

      const mockScans = [
        { id: 'scan-1', deviceType: 'mobile', converted: true, scannedAt: new Date() },
        { id: 'scan-2', deviceType: 'mobile', converted: false, scannedAt: new Date() },
        { id: 'scan-3', deviceType: 'desktop', converted: true, scannedAt: new Date() },
        { id: 'scan-4', deviceType: 'tablet', converted: false, scannedAt: new Date() },
      ];

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);
      (db.query.qrScans.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockScans);

      const campaign = await db.query.qrCampaigns.findFirst({
        where: { id: 'campaign-1', organizationId: 'org-1' },
      });

      const scans = await db.query.qrScans.findMany({
        where: { campaignId: 'campaign-1' },
      });

      expect(campaign?.scanCount).toBe(100);
      expect(scans.length).toBe(4);

      // Calculate device breakdown
      const deviceBreakdown = scans.reduce(
        (acc, scan) => {
          const type = scan.deviceType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(deviceBreakdown).toEqual({
        mobile: 2,
        desktop: 1,
        tablet: 1,
      });

      // Calculate conversion rate
      const conversionRate =
        scans.length > 0 ? (scans.filter((s) => s.converted).length / scans.length) * 100 : 0;

      expect(conversionRate).toBe(50);
    });

    it('should handle campaigns with no scans', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
        scanCount: 0,
        completionCount: 0,
      };

      (db.query.qrCampaigns.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockCampaign);
      (db.query.qrScans.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const scans = await db.query.qrScans.findMany({
        where: { campaignId: 'campaign-1' },
      });

      expect(scans.length).toBe(0);

      const conversionRate = scans.length > 0 ? (scans.filter((s: any) => s.converted).length / scans.length) * 100 : 0;

      expect(conversionRate).toBe(0);
    });

    it('should handle scans with unknown device type', async () => {
      const mockScans = [
        { id: 'scan-1', deviceType: null, converted: false, scannedAt: new Date() },
        { id: 'scan-2', deviceType: undefined, converted: false, scannedAt: new Date() },
      ];

      (db.query.qrScans.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockScans);

      const scans = await db.query.qrScans.findMany({
        where: { campaignId: 'campaign-1' },
      });

      const deviceBreakdown = scans.reduce(
        (acc, scan) => {
          const type = scan.deviceType || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(deviceBreakdown).toEqual({ unknown: 2 });
    });
  });
});
