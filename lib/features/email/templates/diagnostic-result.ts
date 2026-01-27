/**
 * Diagnostic Result Email Template
 *
 * HTML email template for sending diagnostic results to leads
 */

export interface DiagnosticResultEmailData {
  name: string;
  company: string;
  email: string;
  score: number;
  industry?: string;
  employeeCount?: string;
  timeline?: string;
  budget?: string;
  challenge?: string;
  goal?: string;
  locale?: 'en' | 'ja';
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'; // Green
  if (score >= 40) return '#eab308'; // Yellow
  return '#ef4444'; // Red
}

/**
 * Get score label based on value
 */
function getScoreLabel(score: number, locale: 'en' | 'ja'): string {
  if (locale === 'ja') {
    if (score >= 70) return '高い可能性';
    if (score >= 40) return '中程度の可能性';
    return '要フォローアップ';
  }
  if (score >= 70) return 'High Potential';
  if (score >= 40) return 'Medium Potential';
  return 'Needs Follow-up';
}

/**
 * Get translations for the email
 */
function getTranslations(locale: 'en' | 'ja') {
  return locale === 'ja'
    ? {
        subject: 'あなたの診断結果が届きました',
        greeting: (name: string) => `${name}様`,
        intro:
          'この度は診断フォームをご送信いただき、誠にありがとうございます。以下があなたの診断結果です。',
        scoreTitle: 'あなたのスコア',
        scoreLabel: (score: number) => getScoreLabel(score, 'ja'),
        profileTitle: 'ビジネスプロフィール',
        company: '会社名',
        industry: '業種',
        employeeCount: '従業員数',
        timeline: '導入予定時期',
        budget: '予算',
        challenge: '現在の課題',
        goal: '目標',
        nextSteps: '次のステップ',
        nextStepsContent: `
          <p>当社の専門家がまもなくご連絡いたします。お急ぎの場合は、以下の方法でお問い合わせください：</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>メール: contact@diagnoleads.com</li>
            <li>電話: 03-1234-5678</li>
          </ul>
        `,
        footer: 'ご質問がございましたら、お気軽にお問い合わせください。',
        signature: 'DiagnoLeadsチーム',
      }
    : {
        subject: 'Your Diagnostic Results Are Ready',
        greeting: (name: string) => `Hello ${name},`,
        intro: 'Thank you for completing our diagnostic form. Below are your personalized results.',
        scoreTitle: 'Your Score',
        scoreLabel: (score: number) => getScoreLabel(score, 'en'),
        profileTitle: 'Business Profile',
        company: 'Company',
        industry: 'Industry',
        employeeCount: 'Company Size',
        timeline: 'Timeline',
        budget: 'Budget',
        challenge: 'Current Challenge',
        goal: 'Primary Goal',
        nextSteps: 'Next Steps',
        nextStepsContent: `
          <p>One of our specialists will be in touch with you shortly. In the meantime, feel free to reach out:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Email: contact@diagnoleads.com</li>
            <li>Phone: +1 (555) 123-4567</li>
          </ul>
        `,
        footer: "If you have any questions, please don't hesitate to contact us.",
        signature: 'The DiagnoLeads Team',
      };
}

/**
 * Generate diagnostic result email HTML
 */
export function generateDiagnosticResultEmail(data: DiagnosticResultEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const locale = data.locale || 'en';
  const t = getTranslations(locale);
  const scoreColor = getScoreColor(data.score);

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 40px 30px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">DiagnoLeads</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 18px; color: #18181b;">${t.greeting(data.name || data.email)}</p>
              <p style="margin: 0 0 30px; font-size: 16px; color: #52525b; line-height: 1.6;">${t.intro}</p>

              <!-- Score Card -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">${t.scoreTitle}</p>
                    <p style="margin: 0; font-size: 64px; font-weight: 700; color: ${scoreColor};">${data.score}</p>
                    <p style="margin: 10px 0 0; font-size: 16px; color: ${scoreColor}; font-weight: 600;">${t.scoreLabel(data.score)}</p>
                  </td>
                </tr>
              </table>

              <!-- Business Profile -->
              <h2 style="margin: 0 0 20px; font-size: 18px; color: #18181b; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px;">${t.profileTitle}</h2>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                ${data.company ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.company}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.company}</td></tr>` : ''}
                ${data.industry ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.industry}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.industry}</td></tr>` : ''}
                ${data.employeeCount ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.employeeCount}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.employeeCount}</td></tr>` : ''}
                ${data.timeline ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.timeline}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.timeline}</td></tr>` : ''}
                ${data.budget ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.budget}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.budget}</td></tr>` : ''}
                ${data.challenge ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.challenge}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.challenge}</td></tr>` : ''}
                ${data.goal ? `<tr><td style="padding: 10px 0; color: #71717a; width: 40%;">${t.goal}</td><td style="padding: 10px 0; color: #18181b; font-weight: 500;">${data.goal}</td></tr>` : ''}
              </table>

              <!-- Next Steps -->
              <h2 style="margin: 0 0 20px; font-size: 18px; color: #18181b; border-bottom: 2px solid #e4e4e7; padding-bottom: 10px;">${t.nextSteps}</h2>
              <div style="font-size: 16px; color: #52525b; line-height: 1.6; margin-bottom: 30px;">
                ${t.nextStepsContent}
              </div>

              <!-- Footer message -->
              <p style="margin: 0 0 10px; font-size: 16px; color: #52525b;">${t.footer}</p>
              <p style="margin: 0; font-size: 16px; color: #18181b; font-weight: 600;">${t.signature}</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #71717a;">&copy; ${new Date().getFullYear()} DiagnoLeads. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = `
${t.greeting(data.name || data.email)}

${t.intro}

${t.scoreTitle}: ${data.score} (${t.scoreLabel(data.score)})

${t.profileTitle}:
${data.company ? `- ${t.company}: ${data.company}` : ''}
${data.industry ? `- ${t.industry}: ${data.industry}` : ''}
${data.employeeCount ? `- ${t.employeeCount}: ${data.employeeCount}` : ''}
${data.timeline ? `- ${t.timeline}: ${data.timeline}` : ''}
${data.budget ? `- ${t.budget}: ${data.budget}` : ''}
${data.challenge ? `- ${t.challenge}: ${data.challenge}` : ''}
${data.goal ? `- ${t.goal}: ${data.goal}` : ''}

${t.nextSteps}:
${locale === 'ja' ? '当社の専門家がまもなくご連絡いたします。' : 'One of our specialists will be in touch with you shortly.'}

${t.footer}

${t.signature}
  `.trim();

  return {
    subject: t.subject,
    html,
    text,
  };
}
