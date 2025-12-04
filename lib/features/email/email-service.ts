/**
 * Email Service
 *
 * Handles email sending via Resend
 */
import { Resend } from 'resend';

// Initialize Resend client (lazy to handle missing API key)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Send email options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id: string }> {
  const client = getResendClient();
  const from = options.from || process.env.EMAIL_FROM || 'DiagnoLeads <noreply@diagnoleads.com>';

  const result = await client.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });

  if (result.error) {
    throw new Error(`Failed to send email: ${result.error.message}`);
  }

  return { id: result.data?.id || '' };
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
