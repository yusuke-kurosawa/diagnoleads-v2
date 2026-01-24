import { z } from 'zod';

/**
 * QR Code Generation Input Schema
 */
export const generateQRCodeSchema = z.object({
  diagnosticTemplateId: z.string().uuid(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']).default('medium'),
  format: z.enum(['png', 'svg', 'dataUrl']).default('dataUrl'),
  campaignName: z.string().max(100).optional(),
  utmSource: z.string().max(50).default('qrcode'),
  utmMedium: z.string().max(50).default('offline'),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  color: z
    .object({
      dark: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .default('#000000'),
      light: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .default('#ffffff'),
    })
    .optional(),
});

export type GenerateQRCodeInput = z.infer<typeof generateQRCodeSchema>;

/**
 * QR Code Campaign Schema (for tracking)
 */
export const createQRCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  diagnosticTemplateId: z.string().uuid(),
  utmSource: z.string().max(50).default('qrcode'),
  utmMedium: z.string().max(50).default('offline'),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export type CreateQRCampaignInput = z.infer<typeof createQRCampaignSchema>;

/**
 * QR Code Campaign Response
 */
export interface QRCampaign {
  id: string;
  name: string;
  description?: string;
  diagnosticTemplateId: string;
  shortCode: string;
  trackingUrl: string;
  qrCodeDataUrl: string;
  scanCount: number;
  completionCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

/**
 * QR Code Scan Event
 */
export interface QRScanEvent {
  campaignId: string;
  scannedAt: Date;
  ipAddressHash?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  location?: {
    country?: string;
    city?: string;
  };
}
