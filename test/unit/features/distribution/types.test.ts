/**
 * Distribution Types Tests
 *
 * Tests for Zod schemas validation
 */

import { describe, expect, it } from 'vitest';
import {
  generateQRCodeSchema,
  createQRCampaignSchema,
  type GenerateQRCodeInput,
  type CreateQRCampaignInput,
  type QRCampaign,
  type QRScanEvent,
} from '@/lib/features/distribution/types';

describe('generateQRCodeSchema', () => {
  it('should validate minimal input', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.diagnosticTemplateId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data.size).toBe('medium');
      expect(result.data.format).toBe('dataUrl');
      expect(result.data.utmSource).toBe('qrcode');
      expect(result.data.utmMedium).toBe('offline');
    }
  });

  it('should validate full input', () => {
    const input: GenerateQRCodeInput = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      size: 'large',
      format: 'svg',
      campaignName: 'Summer Campaign',
      utmSource: 'email',
      utmMedium: 'newsletter',
      utmCampaign: 'summer-2024',
      utmContent: 'banner-v1',
      color: {
        dark: '#FF0000',
        light: '#FFFFFF',
      },
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.size).toBe('large');
      expect(result.data.format).toBe('svg');
      expect(result.data.color?.dark).toBe('#FF0000');
    }
  });

  it('should reject invalid UUID', () => {
    const input = {
      diagnosticTemplateId: 'not-a-uuid',
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid size', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      size: 'huge',
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid format', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      format: 'gif',
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid color format', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      color: {
        dark: 'red',
        light: '#FFFFFF',
      },
    };

    const result = generateQRCodeSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should validate all size options', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;

    for (const size of sizes) {
      const result = generateQRCodeSchema.safeParse({
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
        size,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should validate all format options', () => {
    const formats = ['png', 'svg', 'dataUrl'] as const;

    for (const format of formats) {
      const result = generateQRCodeSchema.safeParse({
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should enforce campaignName max length', () => {
    const result = generateQRCodeSchema.safeParse({
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      campaignName: 'a'.repeat(101),
    });

    expect(result.success).toBe(false);
  });
});

describe('createQRCampaignSchema', () => {
  it('should validate minimal input', () => {
    const input = {
      name: 'Test Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Campaign');
      expect(result.data.utmSource).toBe('qrcode');
      expect(result.data.utmMedium).toBe('offline');
    }
  });

  it('should validate full input', () => {
    const input: CreateQRCampaignInput = {
      name: 'Winter Sale',
      description: 'QR code for winter sale flyers',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      utmSource: 'print',
      utmMedium: 'flyer',
      utmCampaign: 'winter-2024',
      utmContent: 'version-a',
      expiresAt: '2024-12-31T23:59:59.000Z',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const input = {
      name: '',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should enforce name max length', () => {
    const input = {
      name: 'a'.repeat(101),
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should enforce description max length', () => {
    const input = {
      name: 'Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      description: 'a'.repeat(501),
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid datetime format', () => {
    const input = {
      name: 'Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      expiresAt: 'not-a-datetime',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should validate ISO datetime format', () => {
    const input = {
      name: 'Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      expiresAt: '2024-06-15T10:30:00.000Z',
    };

    const result = createQRCampaignSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});

describe('Type definitions', () => {
  it('should have correct QRCampaign type structure', () => {
    const campaign: QRCampaign = {
      id: 'campaign-123',
      name: 'Test Campaign',
      description: 'Test description',
      diagnosticTemplateId: 'template-123',
      shortCode: 'ABC123',
      trackingUrl: 'https://example.com/d/ABC123',
      qrCodeDataUrl: 'data:image/png;base64,...',
      scanCount: 100,
      completionCount: 50,
      isActive: true,
      expiresAt: new Date(),
      createdAt: new Date(),
    };

    expect(campaign.id).toBe('campaign-123');
    expect(campaign.scanCount).toBe(100);
    expect(campaign.isActive).toBe(true);
  });

  it('should allow optional fields in QRCampaign', () => {
    const campaign: QRCampaign = {
      id: 'campaign-456',
      name: 'Minimal Campaign',
      diagnosticTemplateId: 'template-456',
      shortCode: 'XYZ789',
      trackingUrl: 'https://example.com/d/XYZ789',
      qrCodeDataUrl: 'data:image/png;base64,...',
      scanCount: 0,
      completionCount: 0,
      isActive: true,
      createdAt: new Date(),
    };

    expect(campaign.description).toBeUndefined();
    expect(campaign.expiresAt).toBeUndefined();
  });

  it('should have correct QRScanEvent type structure', () => {
    const event: QRScanEvent = {
      campaignId: 'campaign-123',
      scannedAt: new Date(),
      ipAddressHash: 'abc123hash',
      userAgent: 'Mozilla/5.0',
      deviceType: 'mobile',
      location: {
        country: 'JP',
        city: 'Tokyo',
      },
    };

    expect(event.campaignId).toBe('campaign-123');
    expect(event.deviceType).toBe('mobile');
    expect(event.location?.country).toBe('JP');
  });

  it('should allow minimal QRScanEvent', () => {
    const event: QRScanEvent = {
      campaignId: 'campaign-789',
      scannedAt: new Date(),
    };

    expect(event.ipAddressHash).toBeUndefined();
    expect(event.location).toBeUndefined();
  });

  it('should validate deviceType options', () => {
    const mobileEvent: QRScanEvent = {
      campaignId: 'c1',
      scannedAt: new Date(),
      deviceType: 'mobile',
    };

    const tabletEvent: QRScanEvent = {
      campaignId: 'c2',
      scannedAt: new Date(),
      deviceType: 'tablet',
    };

    const desktopEvent: QRScanEvent = {
      campaignId: 'c3',
      scannedAt: new Date(),
      deviceType: 'desktop',
    };

    expect(mobileEvent.deviceType).toBe('mobile');
    expect(tabletEvent.deviceType).toBe('tablet');
    expect(desktopEvent.deviceType).toBe('desktop');
  });
});
