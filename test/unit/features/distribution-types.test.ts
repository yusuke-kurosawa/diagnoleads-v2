/**
 * Distribution Types Tests
 *
 * Unit tests for QR code distribution type definitions and schemas
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

describe('GenerateQRCodeInput type', () => {
  it('should create valid input', () => {
    const input: GenerateQRCodeInput = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      size: 'medium',
      format: 'dataUrl',
      utmSource: 'qrcode',
      utmMedium: 'offline',
    };

    expect(input.size).toBe('medium');
  });
});

describe('generateQRCodeSchema', () => {
  it('should accept minimal valid input', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = generateQRCodeSchema.parse(input);
    expect(result.diagnosticTemplateId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.size).toBe('medium'); // default
    expect(result.format).toBe('dataUrl'); // default
    expect(result.utmSource).toBe('qrcode'); // default
    expect(result.utmMedium).toBe('offline'); // default
  });

  it('should accept all size options', () => {
    const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
    for (const size of sizes) {
      const result = generateQRCodeSchema.parse({
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
        size,
      });
      expect(result.size).toBe(size);
    }
  });

  it('should accept all format options', () => {
    const formats = ['png', 'svg', 'dataUrl'] as const;
    for (const format of formats) {
      const result = generateQRCodeSchema.parse({
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
        format,
      });
      expect(result.format).toBe(format);
    }
  });

  it('should accept campaign and UTM parameters', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      campaignName: 'Summer Sale',
      utmSource: 'flyer',
      utmMedium: 'print',
      utmCampaign: 'summer-2024',
      utmContent: 'discount-offer',
    };

    const result = generateQRCodeSchema.parse(input);
    expect(result.campaignName).toBe('Summer Sale');
    expect(result.utmCampaign).toBe('summer-2024');
  });

  it('should accept color options', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    };

    const result = generateQRCodeSchema.parse(input);
    expect(result.color?.dark).toBe('#000000');
    expect(result.color?.light).toBe('#ffffff');
  });

  it('should reject invalid color format', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      color: {
        dark: 'invalid',
        light: '#ffffff',
      },
    };

    expect(() => generateQRCodeSchema.parse(input)).toThrow();
  });

  it('should reject invalid UUID', () => {
    const input = {
      diagnosticTemplateId: 'invalid-uuid',
    };

    expect(() => generateQRCodeSchema.parse(input)).toThrow();
  });

  it('should enforce campaign name max length', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      campaignName: 'a'.repeat(101),
    };

    expect(() => generateQRCodeSchema.parse(input)).toThrow();
  });
});

describe('CreateQRCampaignInput type', () => {
  it('should create valid input', () => {
    const input: CreateQRCampaignInput = {
      name: 'Test Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      utmSource: 'qrcode',
      utmMedium: 'offline',
    };

    expect(input.name).toBe('Test Campaign');
  });
});

describe('createQRCampaignSchema', () => {
  it('should accept minimal valid input', () => {
    const input = {
      name: 'Test Campaign',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = createQRCampaignSchema.parse(input);
    expect(result.name).toBe('Test Campaign');
    expect(result.utmSource).toBe('qrcode'); // default
    expect(result.utmMedium).toBe('offline'); // default
  });

  it('should accept full input', () => {
    const input = {
      name: 'Holiday Campaign',
      description: 'QR code for holiday promotions',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      utmSource: 'poster',
      utmMedium: 'outdoor',
      utmCampaign: 'holiday-2024',
      utmContent: 'main-poster',
      expiresAt: '2024-12-31T23:59:59Z',
    };

    const result = createQRCampaignSchema.parse(input);
    expect(result.description).toBe('QR code for holiday promotions');
    expect(result.expiresAt).toBe('2024-12-31T23:59:59Z');
  });

  it('should require name', () => {
    const input = {
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => createQRCampaignSchema.parse(input)).toThrow();
  });

  it('should enforce name length constraints', () => {
    expect(() =>
      createQRCampaignSchema.parse({
        name: '',
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).toThrow();

    expect(() =>
      createQRCampaignSchema.parse({
        name: 'a'.repeat(101),
        diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      })
    ).toThrow();
  });

  it('should enforce description max length', () => {
    const input = {
      name: 'Test',
      description: 'a'.repeat(501),
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => createQRCampaignSchema.parse(input)).toThrow();
  });

  it('should validate expiresAt datetime format', () => {
    const input = {
      name: 'Test',
      diagnosticTemplateId: '123e4567-e89b-12d3-a456-426614174000',
      expiresAt: 'invalid-date',
    };

    expect(() => createQRCampaignSchema.parse(input)).toThrow();
  });
});

describe('QRCampaign interface', () => {
  it('should create valid campaign', () => {
    const campaign: QRCampaign = {
      id: 'campaign-123',
      name: 'Test Campaign',
      description: 'A test campaign',
      diagnosticTemplateId: 'template-123',
      shortCode: 'ABC123',
      trackingUrl: 'https://example.com/d/ABC123',
      qrCodeDataUrl: 'data:image/png;base64,...',
      scanCount: 100,
      completionCount: 25,
      isActive: true,
      expiresAt: new Date('2024-12-31'),
      createdAt: new Date(),
    };

    expect(campaign.shortCode).toBe('ABC123');
    expect(campaign.scanCount).toBe(100);
    expect(campaign.completionCount).toBe(25);
  });

  it('should allow optional fields', () => {
    const campaign: QRCampaign = {
      id: 'campaign-123',
      name: 'Test Campaign',
      diagnosticTemplateId: 'template-123',
      shortCode: 'ABC123',
      trackingUrl: 'https://example.com/d/ABC123',
      qrCodeDataUrl: 'data:image/png;base64,...',
      scanCount: 0,
      completionCount: 0,
      isActive: true,
      createdAt: new Date(),
    };

    expect(campaign.description).toBeUndefined();
    expect(campaign.expiresAt).toBeUndefined();
  });
});

describe('QRScanEvent interface', () => {
  it('should create valid scan event', () => {
    const event: QRScanEvent = {
      campaignId: 'campaign-123',
      scannedAt: new Date(),
      ipAddressHash: 'abc123',
      userAgent: 'Mozilla/5.0',
      deviceType: 'mobile',
      location: {
        country: 'Japan',
        city: 'Tokyo',
      },
    };

    expect(event.deviceType).toBe('mobile');
    expect(event.location?.country).toBe('Japan');
  });

  it('should accept all device types', () => {
    const deviceTypes: Array<QRScanEvent['deviceType']> = ['mobile', 'tablet', 'desktop'];
    for (const deviceType of deviceTypes) {
      const event: QRScanEvent = {
        campaignId: 'campaign-123',
        scannedAt: new Date(),
        deviceType,
      };
      expect(event.deviceType).toBe(deviceType);
    }
  });

  it('should allow minimal event', () => {
    const event: QRScanEvent = {
      campaignId: 'campaign-123',
      scannedAt: new Date(),
    };

    expect(event.ipAddressHash).toBeUndefined();
    expect(event.userAgent).toBeUndefined();
    expect(event.deviceType).toBeUndefined();
    expect(event.location).toBeUndefined();
  });
});
