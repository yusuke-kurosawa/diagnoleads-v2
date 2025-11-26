/**
 * Resend Email Service
 *
 * Phase 5.2: メール統合
 * Uses Resend for transactional email delivery
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email template types
 */
export type EmailTemplateType =
  | 'lead_notification'
  | 'diagnostic_result'
  | 'welcome'
  | 'member_invitation'
  | 'password_reset'
  | 'weekly_report';

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplateType;
  data: Record<string, unknown>;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email sending result
 */
export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Default sender email
 */
const DEFAULT_FROM = process.env.EMAIL_FROM || 'DiagnoLeads <noreply@diagnoleads.com>';

/**
 * Generate email HTML from template and data
 */
function generateEmailHtml(template: EmailTemplateType, data: Record<string, unknown>): string {
  const templates: Record<EmailTemplateType, (data: Record<string, unknown>) => string> = {
    lead_notification: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Notification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">New Lead Received</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">A new lead has been submitted through your diagnostic form.</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h2 style="color: #1a1a1a; font-size: 16px; margin-bottom: 16px;">Lead Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 120px;">Name</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 500;">${d.name || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Email</td>
          <td style="padding: 8px 0; color: #1a1a1a;">${d.email || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Company</td>
          <td style="padding: 8px 0; color: #1a1a1a;">${d.company || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Score</td>
          <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${d.score || 'N/A'}/100</td>
        </tr>
      </table>
    </div>

    <a href="${d.dashboardUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">View in Dashboard</a>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">This is an automated notification from DiagnoLeads.</p>
  </div>
</body>
</html>
`,

    diagnostic_result: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Diagnostic Results</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Your Diagnostic Results</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">Thank you for completing the business diagnostic. Here are your results:</p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); border-radius: 50%; width: 120px; height: 120px; line-height: 120px;">
        <span style="color: #ffffff; font-size: 36px; font-weight: 700;">${d.score || 0}</span>
      </div>
      <p style="color: #6b7280; margin-top: 8px;">Your Lead Generation Potential Score</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h2 style="color: #1a1a1a; font-size: 16px; margin-bottom: 12px;">Key Insights</h2>
      <p style="color: #4a4a4a; line-height: 1.6;">${d.insights || 'Our team will analyze your responses and provide personalized recommendations.'}</p>
    </div>

    <p style="color: #4a4a4a; line-height: 1.6;">A member of our team will contact you shortly with detailed recommendations tailored to your business needs.</p>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.</p>
  </div>
</body>
</html>
`,

    welcome: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DiagnoLeads</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Welcome to DiagnoLeads!</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">Hi ${d.name || 'there'},</p>
    <p style="color: #4a4a4a; line-height: 1.6;">Welcome to DiagnoLeads! We're excited to have you on board.</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h2 style="color: #1a1a1a; font-size: 16px; margin-bottom: 12px;">Get Started</h2>
      <ul style="color: #4a4a4a; line-height: 1.8; padding-left: 20px;">
        <li>Create your first diagnostic form</li>
        <li>Configure AI lead scoring</li>
        <li>Set up webhook integrations</li>
        <li>Invite team members</li>
      </ul>
    </div>

    <a href="${d.dashboardUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Go to Dashboard</a>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.</p>
  </div>
</body>
</html>
`,

    member_invitation: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">You've Been Invited!</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">${d.inviterName || 'Someone'} has invited you to join <strong>${d.organizationName || 'their organization'}</strong> on DiagnoLeads.</p>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="color: #6b7280; margin: 0;">Your role: <strong style="color: #1a1a1a;">${d.role || 'Member'}</strong></p>
    </div>

    <a href="${d.inviteUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">Accept Invitation</a>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">This invitation will expire in 7 days.</p>
  </div>
</body>
</html>
`,

    password_reset: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Reset Your Password</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${d.resetUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500;">Reset Password</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">This link will expire in 1 hour.</p>
  </div>
</body>
</html>
`,

    weekly_report: (d) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 24px;">Weekly Report</h1>
    <p style="color: #4a4a4a; line-height: 1.6;">Here's your weekly summary for ${d.organizationName || 'your organization'}.</p>

    <div style="display: flex; gap: 16px; margin: 24px 0;">
      <div style="flex: 1; background-color: #eff6ff; border-radius: 8px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #2563eb;">${d.newLeads || 0}</div>
        <div style="color: #6b7280; font-size: 14px;">New Leads</div>
      </div>
      <div style="flex: 1; background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #16a34a;">${d.convertedLeads || 0}</div>
        <div style="color: #6b7280; font-size: 14px;">Converted</div>
      </div>
      <div style="flex: 1; background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center;">
        <div style="font-size: 32px; font-weight: 700; color: #d97706;">${d.conversionRate || '0%'}</div>
        <div style="color: #6b7280; font-size: 14px;">Conversion Rate</div>
      </div>
    </div>

    <a href="${d.dashboardUrl || '#'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">View Full Report</a>

    <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.</p>
  </div>
</body>
</html>
`,
  };

  return templates[template](data);
}

/**
 * Generate plain text version of email
 */
function generateEmailText(template: EmailTemplateType, data: Record<string, unknown>): string {
  const templates: Record<EmailTemplateType, (data: Record<string, unknown>) => string> = {
    lead_notification: (d) => `
New Lead Received

A new lead has been submitted through your diagnostic form.

Lead Details:
- Name: ${d.name || 'Not provided'}
- Email: ${d.email || 'Not provided'}
- Company: ${d.company || 'Not provided'}
- Score: ${d.score || 'N/A'}/100

View in Dashboard: ${d.dashboardUrl || '#'}

This is an automated notification from DiagnoLeads.
`,
    diagnostic_result: (d) => `
Your Diagnostic Results

Thank you for completing the business diagnostic.

Your Lead Generation Potential Score: ${d.score || 0}/100

Key Insights:
${d.insights || 'Our team will analyze your responses and provide personalized recommendations.'}

A member of our team will contact you shortly with detailed recommendations tailored to your business needs.

© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.
`,
    welcome: (d) => `
Welcome to DiagnoLeads!

Hi ${d.name || 'there'},

Welcome to DiagnoLeads! We're excited to have you on board.

Get Started:
- Create your first diagnostic form
- Configure AI lead scoring
- Set up webhook integrations
- Invite team members

Go to Dashboard: ${d.dashboardUrl || '#'}

© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.
`,
    member_invitation: (d) => `
You've Been Invited!

${d.inviterName || 'Someone'} has invited you to join ${d.organizationName || 'their organization'} on DiagnoLeads.

Your role: ${d.role || 'Member'}

Accept Invitation: ${d.inviteUrl || '#'}

This invitation will expire in 7 days.
`,
    password_reset: (d) => `
Reset Your Password

We received a request to reset your password.

Reset Password: ${d.resetUrl || '#'}

If you didn't request this, you can safely ignore this email.

This link will expire in 1 hour.
`,
    weekly_report: (d) => `
Weekly Report

Here's your weekly summary for ${d.organizationName || 'your organization'}.

- New Leads: ${d.newLeads || 0}
- Converted: ${d.convertedLeads || 0}
- Conversion Rate: ${d.conversionRate || '0%'}

View Full Report: ${d.dashboardUrl || '#'}

© ${new Date().getFullYear()} DiagnoLeads. All rights reserved.
`,
  };

  return templates[template](data);
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, template, data, from, replyTo, cc, bcc, attachments } = options;

  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const html = generateEmailHtml(template, data);
    const text = generateEmailText(template, data);

    const result = await resend.emails.send({
      from: from || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
      cc,
      bcc,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
      })),
    });

    if (result.error) {
      console.error('[Email] Send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Send error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send lead notification email
 */
export async function sendLeadNotificationEmail(
  to: string | string[],
  leadData: {
    name?: string;
    email?: string;
    company?: string;
    score?: number;
    dashboardUrl?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `New Lead: ${leadData.name || leadData.email || 'Unknown'}`,
    template: 'lead_notification',
    data: leadData,
  });
}

/**
 * Send diagnostic result email
 */
export async function sendDiagnosticResultEmail(
  to: string,
  resultData: {
    score: number;
    insights?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Your Diagnostic Results from DiagnoLeads',
    template: 'diagnostic_result',
    data: resultData,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  userData: {
    name?: string;
    dashboardUrl?: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to DiagnoLeads!',
    template: 'welcome',
    data: userData,
  });
}

/**
 * Send member invitation email
 */
export async function sendMemberInvitationEmail(
  to: string,
  invitationData: {
    inviterName?: string;
    organizationName?: string;
    role?: string;
    inviteUrl: string;
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `You've been invited to join ${invitationData.organizationName || 'an organization'} on DiagnoLeads`,
    template: 'member_invitation',
    data: invitationData,
  });
}
