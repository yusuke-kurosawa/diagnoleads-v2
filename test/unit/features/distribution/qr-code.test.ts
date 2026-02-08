/**
 * QR Code Service Tests
 *
 * Tests for QR code generation, tracking URL building, and short code generation
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQRCode'),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-png-buffer')),
    toString: vi.fn().mockResolvedValue('<svg>mock-svg</svg>'),
  },
}));

import { generateQRCode, buildTrackingUrl, generateShortCode } from '@/lib/features/distribution/qr-code';
import QRCode from 'qrcode';

describe('generateQRCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate data URL by default', async () => {
    const url = 'https://example.com/assessment/123';
    
    const result = await generateQRCode(url);

    expect(result).toBe('data:image/png;base64,mockQRCode');
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 256, // medium size default
    }));
  });

  it('should generate SVG format', async () => {
    const url = 'https://example.com/test';
    
    const result = await generateQRCode(url, { format: 'svg' });

    expect(result).toBe('<svg>mock-svg</svg>');
    expect(QRCode.toString).toHaveBeenCalledWith(url, expect.objectContaining({
      type: 'svg',
    }));
  });

  it('should generate PNG buffer format', async () => {
    const url = 'https://example.com/test';
    
    const result = await generateQRCode(url, { format: 'png' });

    expect(result).toEqual(Buffer.from('mock-png-buffer'));
    expect(QRCode.toBuffer).toHaveBeenCalledWith(url, expect.objectContaining({
      type: 'png',
    }));
  });

  it('should respect size option', async () => {
    const url = 'https://example.com/test';

    await generateQRCode(url, { size: 'small' });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      width: 128,
    }));

    vi.clearAllMocks();

    await generateQRCode(url, { size: 'large' });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      width: 512,
    }));

    vi.clearAllMocks();

    await generateQRCode(url, { size: 'xlarge' });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      width: 1024,
    }));
  });

  it('should respect error correction level', async () => {
    const url = 'https://example.com/test';

    await generateQRCode(url, { errorCorrectionLevel: 'L' });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      errorCorrectionLevel: 'L',
    }));
  });

  it('should respect margin option', async () => {
    const url = 'https://example.com/test';

    await generateQRCode(url, { margin: 4 });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      margin: 4,
    }));
  });

  it('should respect custom colors', async () => {
    const url = 'https://example.com/test';
    const color = { dark: '#FF0000', light: '#FFFFFF' };

    await generateQRCode(url, { color });
    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, expect.objectContaining({
      color,
    }));
  });

  it('should use all options together', async () => {
    const url = 'https://example.com/test';

    await generateQRCode(url, {
      size: 'large',
      format: 'dataUrl',
      errorCorrectionLevel: 'M',
      margin: 3,
      color: { dark: '#123456', light: '#FEDCBA' },
    });

    expect(QRCode.toDataURL).toHaveBeenCalledWith(url, {
      errorCorrectionLevel: 'M',
      margin: 3,
      width: 512,
      color: { dark: '#123456', light: '#FEDCBA' },
    });
  });
});

describe('buildTrackingUrl', () => {
  const baseUrl = 'https://app.example.com';
  const assessmentId = 'assessment-123';

  it('should build basic tracking URL with default UTM params', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId);

    expect(result).toContain('https://app.example.com/d/assessment-123');
    expect(result).toContain('utm_source=qrcode');
    expect(result).toContain('utm_medium=offline');
  });

  it('should include custom UTM source', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmSource: 'custom_source',
    });

    expect(result).toContain('utm_source=custom_source');
  });

  it('should include custom UTM medium', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmMedium: 'print',
    });

    expect(result).toContain('utm_medium=print');
  });

  it('should include UTM campaign when provided', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmCampaign: 'summer-2024',
    });

    expect(result).toContain('utm_campaign=summer-2024');
  });

  it('should include UTM content when provided', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmContent: 'flyer-a',
    });

    expect(result).toContain('utm_content=flyer-a');
  });

  it('should include custom parameters', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      customParams: {
        ref: 'partner123',
        locale: 'ja',
      },
    });

    expect(result).toContain('ref=partner123');
    expect(result).toContain('locale=ja');
  });

  it('should handle all options together', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmSource: 'email',
      utmMedium: 'newsletter',
      utmCampaign: 'q1-campaign',
      utmContent: 'banner-v2',
      customParams: {
        variant: 'test',
      },
    });

    expect(result).toContain('utm_source=email');
    expect(result).toContain('utm_medium=newsletter');
    expect(result).toContain('utm_campaign=q1-campaign');
    expect(result).toContain('utm_content=banner-v2');
    expect(result).toContain('variant=test');
  });

  it('should return valid URL', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId);
    const url = new URL(result);

    expect(url.hostname).toBe('app.example.com');
    expect(url.pathname).toBe('/d/assessment-123');
  });

  it('should URL encode special characters', () => {
    const result = buildTrackingUrl(baseUrl, assessmentId, {
      utmCampaign: 'test campaign',
      customParams: {
        name: '田中太郎',
      },
    });

    // Special characters should be encoded
    expect(result).toContain('utm_campaign=test+campaign');
    expect(result).toContain('name=%E7%94%B0%E4%B8%AD%E5%A4%AA%E9%83%8E');
  });
});

describe('generateShortCode', () => {
  it('should generate code with default length of 8', () => {
    const code = generateShortCode();

    expect(code).toHaveLength(8);
  });

  it('should generate code with custom length', () => {
    expect(generateShortCode(6)).toHaveLength(6);
    expect(generateShortCode(10)).toHaveLength(10);
    expect(generateShortCode(12)).toHaveLength(12);
  });

  it('should only contain valid characters', () => {
    const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

    for (let i = 0; i < 100; i++) {
      const code = generateShortCode();
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    }
  });

  it('should not contain ambiguous characters (0, O, I, l, 1)', () => {
    const ambiguousChars = '0OIl1';

    for (let i = 0; i < 100; i++) {
      const code = generateShortCode(20);
      for (const char of code) {
        expect(ambiguousChars).not.toContain(char);
      }
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();

    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode());
    }

    // With high probability, all 100 codes should be unique
    expect(codes.size).toBe(100);
  });

  it('should handle edge case of length 1', () => {
    const code = generateShortCode(1);

    expect(code).toHaveLength(1);
    expect('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789').toContain(code);
  });
});
