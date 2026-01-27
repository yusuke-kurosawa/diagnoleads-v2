/**
 * Embed Feature Types and Schemas Tests
 * Tests the Zod schemas and type definitions for embed configuration
 */
import { describe, expect, it } from 'vitest';
import { createEmbedConfigSchema, updateEmbedConfigSchema } from '@/lib/features/embed/types';

describe('Embed Config Schemas', () => {
  describe('createEmbedConfigSchema', () => {
    it('should validate valid config', () => {
      const validConfig = {
        name: 'Test Widget',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
      };

      const result = createEmbedConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidConfig = {
        name: '',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
      };

      const result = createEmbedConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject empty allowed origins', () => {
      const invalidConfig = {
        name: 'Test Widget',
        allowedOrigins: [],
        leadSource: 'website',
      };

      const result = createEmbedConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const configWithDescription = {
        name: 'Test Widget',
        description: 'A test widget for demonstration',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
      };

      const result = createEmbedConfigSchema.safeParse(configWithDescription);
      expect(result.success).toBe(true);
    });

    it('should accept rate limit settings', () => {
      const configWithRateLimits = {
        name: 'Test Widget',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
        rateLimitPerMinute: 30,
        rateLimitPerDay: 5000,
      };

      const result = createEmbedConfigSchema.safeParse(configWithRateLimits);
      expect(result.success).toBe(true);
    });

    it('should accept theme overrides', () => {
      const configWithTheme = {
        name: 'Test Widget',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
        themeOverrides: {
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderRadius: 'md' as const,
        },
      };

      const result = createEmbedConfigSchema.safeParse(configWithTheme);
      expect(result.success).toBe(true);
    });

    it('should validate border radius enum values', () => {
      const validRadii = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const;

      for (const radius of validRadii) {
        const config = {
          name: 'Test Widget',
          allowedOrigins: ['https://example.com'],
          leadSource: 'website',
          themeOverrides: { borderRadius: radius },
        };

        const result = createEmbedConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });

    it('should accept multiple allowed origins', () => {
      const configWithMultipleOrigins = {
        name: 'Test Widget',
        allowedOrigins: [
          'https://example.com',
          'https://*.example.com',
          'https://staging.example.com',
        ],
        leadSource: 'website',
      };

      const result = createEmbedConfigSchema.safeParse(configWithMultipleOrigins);
      expect(result.success).toBe(true);
    });

    it('should accept custom CSS', () => {
      const configWithCss = {
        name: 'Test Widget',
        allowedOrigins: ['https://example.com'],
        leadSource: 'website',
        customCss: '.widget-container { padding: 20px; }',
      };

      const result = createEmbedConfigSchema.safeParse(configWithCss);
      expect(result.success).toBe(true);
    });
  });

  describe('updateEmbedConfigSchema', () => {
    it('should validate partial update with name', () => {
      const partialUpdate = {
        name: 'Updated Name',
      };

      const result = updateEmbedConfigSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate isActive update', () => {
      const statusUpdate = {
        isActive: false,
      };

      const result = updateEmbedConfigSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate allowed origins update', () => {
      const originsUpdate = {
        allowedOrigins: ['https://newdomain.com'],
      };

      const result = updateEmbedConfigSchema.safeParse(originsUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate theme overrides update', () => {
      const themeUpdate = {
        themeOverrides: {
          primaryColor: '#ff0000',
        },
      };

      const result = updateEmbedConfigSchema.safeParse(themeUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow empty update (all fields optional)', () => {
      const emptyUpdate = {};

      const result = updateEmbedConfigSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields update', () => {
      const multiFieldUpdate = {
        name: 'Updated Widget',
        description: 'New description',
        isActive: true,
        rateLimitPerMinute: 120,
        rateLimitPerDay: 20000,
      };

      const result = updateEmbedConfigSchema.safeParse(multiFieldUpdate);
      expect(result.success).toBe(true);
    });
  });
});

describe('Embed Config Validation Edge Cases', () => {
  it('should handle very long names (up to 100 chars)', () => {
    const longName = 'A'.repeat(100);
    const config = {
      name: longName,
      allowedOrigins: ['https://example.com'],
      leadSource: 'website',
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject names exceeding 100 chars', () => {
    const tooLongName = 'A'.repeat(101);
    const config = {
      name: tooLongName,
      allowedOrigins: ['https://example.com'],
      leadSource: 'website',
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should accept wildcard subdomain origins', () => {
    const config = {
      name: 'Test Widget',
      allowedOrigins: ['https://*.example.com'],
      leadSource: 'website',
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject bare wildcard origin (use security isOriginAllowed for runtime)', () => {
    // Note: The schema requires URL format or wildcard subdomain format
    // Bare '*' is handled at runtime by isOriginAllowed function, not in schema
    const config = {
      name: 'Test Widget',
      allowedOrigins: ['*'],
      leadSource: 'website',
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should accept hex color codes in theme', () => {
    const config = {
      name: 'Test Widget',
      allowedOrigins: ['https://example.com'],
      leadSource: 'website',
      themeOverrides: {
        primaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
      },
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should reject non-hex color formats (only hex supported)', () => {
    const config = {
      name: 'Test Widget',
      allowedOrigins: ['https://example.com'],
      leadSource: 'website',
      themeOverrides: {
        primaryColor: 'rgb(255, 255, 255)',
      },
    };

    const result = createEmbedConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});
