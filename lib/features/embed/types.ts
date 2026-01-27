import { z } from 'zod';

/**
 * Embed Config Schemas
 */
export const createEmbedConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  allowedOrigins: z
    .array(
      z
        .string()
        .url()
        .or(z.string().regex(/^https?:\/\/\*\.[a-zA-Z0-9.-]+$/))
    )
    .min(1, 'At least one allowed origin is required'),
  rateLimitPerMinute: z.number().int().min(1).max(1000).default(60),
  rateLimitPerDay: z.number().int().min(1).max(100000).default(10000),
  diagnosticTemplateId: z.string().uuid().optional(),
  themeOverrides: z
    .object({
      primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      backgroundColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      textColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional(),
    })
    .optional(),
  customCss: z.string().max(10000).optional(),
  leadSource: z.string().min(1).max(50).default('embed'),
  expiresAt: z.string().datetime().optional(),
});

export const updateEmbedConfigSchema = createEmbedConfigSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateEmbedConfigInput = z.infer<typeof createEmbedConfigSchema>;
export type UpdateEmbedConfigInput = z.infer<typeof updateEmbedConfigSchema>;

/**
 * Public API Schemas (for external widget usage)
 */
export const publicDiagnosticRequestSchema = z.object({
  embedConfigId: z.string().uuid(),
});

export const publicLeadSubmissionSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  responses: z.record(z.unknown()).optional(),
  csrfToken: z.string().min(1),
});

export type PublicLeadSubmissionInput = z.infer<typeof publicLeadSubmissionSchema>;

/**
 * Public API Response Types
 */
export interface PublicDiagnosticResponse {
  id: string;
  title: string;
  description?: string;
  steps: PublicDiagnosticStep[];
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
  };
  csrfToken: string;
}

export interface PublicDiagnosticStep {
  id: string;
  title: string;
  description?: string;
  questions: PublicDiagnosticQuestion[];
  order: number;
}

export interface PublicDiagnosticQuestion {
  id: string;
  type: string;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: { id: string; label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

export interface PublicLeadSubmissionResponse {
  success: boolean;
  message: string;
  leadId?: string;
}

/**
 * Embed Access Log Entry
 */
export interface EmbedAccessLogEntry {
  embedConfigId: string | null;
  organizationId: string | null;
  origin: string | null;
  ipAddressHash: string | null;
  userAgent: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  errorCode?: string;
  errorMessage?: string;
  leadId?: string;
  durationMs?: number;
}
