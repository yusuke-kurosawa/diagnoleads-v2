import { env } from '@/lib/env';
import { Resend } from 'resend';

export const resend = new Resend(env.RESEND_API_KEY);

export const FROM_EMAIL = 'DiagnoLeads <noreply@diagnoleads.com>';

type SendEmailOptions =
  | {
      to: string | string[];
      subject: string;
      react: React.ReactElement;
      text?: never;
    }
  | {
      to: string | string[];
      subject: string;
      react?: never;
      text: string;
    };

/**
 * メール送信のヘルパー関数
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, react, text } = options;

  try {
    const emailOptions = react
      ? { from: FROM_EMAIL, to, subject, react }
      : { from: FROM_EMAIL, to, subject, text: text! };

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email send exception:', error);
    throw error;
  }
}
