/**
 * Distribution Feature Types and Schemas Tests
 * Tests the Zod schemas for QR code campaigns
 */
import { describe, expect, it } from 'vitest';
import { 
  generateQRCodeSchema, 
  createQRCampaignSchema 
} from '@/lib/features/distribution/types';

describe('QR Code Distribution Schemas', () => {
  describe('generateQRCodeSchema', () => {
    it('should validate valid QR code generation input', () => {
      const validInput = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = generateQRCodeSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for diagnosticTemplateId', () => {
      const invalidInput = {
        diagnosticTemplateId: 'not-a-uuid',
      };

      const result = generateQRCodeSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept all valid size options', () => {
      const sizes = ['small', 'medium', 'large', 'xlarge'] as const;
      
      for (const size of sizes) {
        const input = {
          diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
          size,
        };
        const result = generateQRCodeSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid size option', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        size: 'huge',
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept all valid format options', () => {
      const formats = ['png', 'svg', 'dataUrl'] as const;
      
      for (const format of formats) {
        const input = {
          diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
          format,
        };
        const result = generateQRCodeSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it('should accept UTM parameters', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        utmSource: 'brochure',
        utmMedium: 'print',
        utmCampaign: 'spring-2024',
        utmContent: 'front-page',
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject UTM source exceeding 50 characters', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        utmSource: 'a'.repeat(51),
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept valid color configuration', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        color: {
          dark: '#333333',
          light: '#ffffff',
        },
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid hex color code', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        color: {
          dark: 'invalid',
          light: '#ffffff',
        },
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should use default values when not provided', () => {
      const input = {
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = generateQRCodeSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.size).toBe('medium');
        expect(result.data.format).toBe('dataUrl');
        expect(result.data.utmSource).toBe('qrcode');
        expect(result.data.utmMedium).toBe('offline');
      }
    });
  });

  describe('createQRCampaignSchema', () => {
    it('should validate valid campaign creation input', () => {
      const validInput = {
        name: 'Trade Show 2024',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidInput = {
        name: '',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 100 characters', () => {
      const invalidInput = {
        name: 'a'.repeat(101),
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const input = {
        name: 'Campaign',
        description: 'A detailed description of this campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject description exceeding 500 characters', () => {
      const input = {
        name: 'Campaign',
        description: 'a'.repeat(501),
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept UTM parameters', () => {
      const input = {
        name: 'Campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        utmSource: 'poster',
        utmMedium: 'offline',
        utmCampaign: 'holiday-2024',
        utmContent: 'store-entrance',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept valid expiresAt datetime', () => {
      const input = {
        name: 'Campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid expiresAt format', () => {
      const input = {
        name: 'Campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        expiresAt: '2025/12/31',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should use default values for UTM parameters', () => {
      const input = {
        name: 'Campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = createQRCampaignSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.utmSource).toBe('qrcode');
        expect(result.data.utmMedium).toBe('offline');
      }
    });

    it('should accept full campaign configuration', () => {
      const fullInput = {
        name: 'Complete Campaign',
        description: 'A fully configured QR campaign',
        diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
        utmSource: 'flyer',
        utmMedium: 'print',
        utmCampaign: 'launch-2024',
        utmContent: 'version-a',
        expiresAt: '2025-06-30T23:59:59Z',
      };

      const result = createQRCampaignSchema.safeParse(fullInput);
      expect(result.success).toBe(true);
    });
  });
});

describe('QR Campaign Validation Edge Cases', () => {
  it('should handle campaign name with special characters', () => {
    const input = {
      name: 'Campaign (2024) - Spring Edition!',
      diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = createQRCampaignSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should handle campaign name with unicode characters', () => {
    const input = {
      name: 'キャンペーン 2024',
      diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = createQRCampaignSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept campaign name at exactly 100 characters', () => {
    const input = {
      name: 'a'.repeat(100),
      diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = createQRCampaignSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept description at exactly 500 characters', () => {
    const input = {
      name: 'Campaign',
      description: 'a'.repeat(500),
      diagnosticTemplateId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = createQRCampaignSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
