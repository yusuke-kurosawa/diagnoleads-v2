import QRCode from 'qrcode';

export interface QRCodeOptions {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  format?: 'png' | 'svg' | 'dataUrl';
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

const SIZE_MAP = {
  small: 128,
  medium: 256,
  large: 512,
  xlarge: 1024,
};

/**
 * Generate a QR code for an assessment URL
 */
export async function generateQRCode(
  url: string,
  options: QRCodeOptions = {}
): Promise<string | Buffer> {
  const {
    size = 'medium',
    format = 'dataUrl',
    errorCorrectionLevel = 'H',
    margin = 2,
    color = { dark: '#000000', light: '#ffffff' },
  } = options;

  const width = SIZE_MAP[size];

  const qrOptions = {
    errorCorrectionLevel,
    margin,
    width,
    color,
  };

  if (format === 'svg') {
    return QRCode.toString(url, { ...qrOptions, type: 'svg' });
  }

  if (format === 'png') {
    return QRCode.toBuffer(url, { ...qrOptions, type: 'png' });
  }

  // Default: dataUrl
  return QRCode.toDataURL(url, qrOptions);
}

/**
 * Build a tracking URL with UTM parameters
 */
export function buildTrackingUrl(
  baseUrl: string,
  assessmentId: string,
  options: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    customParams?: Record<string, string>;
  } = {}
): string {
  const url = new URL(`${baseUrl}/d/${assessmentId}`);

  const {
    utmSource = 'qrcode',
    utmMedium = 'offline',
    utmCampaign,
    utmContent,
    customParams = {},
  } = options;

  url.searchParams.set('utm_source', utmSource);
  url.searchParams.set('utm_medium', utmMedium);

  if (utmCampaign) {
    url.searchParams.set('utm_campaign', utmCampaign);
  }

  if (utmContent) {
    url.searchParams.set('utm_content', utmContent);
  }

  for (const [key, value] of Object.entries(customParams)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Generate a short code for an assessment (for easier QR codes)
 */
export function generateShortCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
