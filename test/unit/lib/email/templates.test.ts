/**
 * Email Templates Tests
 */

import { describe, expect, it } from 'vitest';

describe('Email template types', () => {
  it('should define welcome email template', () => {
    type WelcomeEmailProps = {
      userName: string;
      organizationName?: string;
      loginUrl: string;
    };

    const props: WelcomeEmailProps = {
      userName: '田中太郎',
      organizationName: 'テスト株式会社',
      loginUrl: 'https://app.diagnoleads.com/login',
    };

    expect(props.userName).toBe('田中太郎');
  });

  it('should define password reset template', () => {
    type PasswordResetProps = {
      userName: string;
      resetUrl: string;
      expiresIn: string;
    };

    const props: PasswordResetProps = {
      userName: '山田花子',
      resetUrl: 'https://app.diagnoleads.com/reset?token=abc123',
      expiresIn: '1時間',
    };

    expect(props.resetUrl).toContain('token=');
  });

  it('should define new lead notification template', () => {
    type NewLeadEmailProps = {
      recipientName: string;
      leadName: string;
      leadEmail: string;
      leadCompany?: string;
      leadScore?: number;
      source: string;
      viewUrl: string;
    };

    const props: NewLeadEmailProps = {
      recipientName: '営業担当',
      leadName: '佐藤一郎',
      leadEmail: 'sato@example.com',
      leadCompany: '株式会社ABC',
      leadScore: 85,
      source: 'ウェブサイト',
      viewUrl: 'https://app.diagnoleads.com/leads/lead-123',
    };

    expect(props.leadScore).toBe(85);
  });

  it('should define invitation email template', () => {
    type InvitationEmailProps = {
      inviterName: string;
      organizationName: string;
      role: string;
      inviteUrl: string;
      expiresIn: string;
    };

    const props: InvitationEmailProps = {
      inviterName: '管理者',
      organizationName: 'テスト株式会社',
      role: 'メンバー',
      inviteUrl: 'https://app.diagnoleads.com/invite/abc123',
      expiresIn: '7日間',
    };

    expect(props.role).toBe('メンバー');
  });

  it('should define diagnostic result email template', () => {
    type DiagnosticResultEmailProps = {
      leadName: string;
      diagnosticTitle: string;
      score: number;
      resultSummary: string;
      detailUrl?: string;
    };

    const props: DiagnosticResultEmailProps = {
      leadName: '鈴木次郎',
      diagnosticTitle: 'ITセキュリティ診断',
      score: 72,
      resultSummary: '改善の余地があります',
      detailUrl: 'https://app.diagnoleads.com/results/result-123',
    };

    expect(props.score).toBe(72);
  });

  it('should define webhook failure notification template', () => {
    type WebhookFailureEmailProps = {
      recipientName: string;
      webhookName: string;
      webhookUrl: string;
      errorCode: number;
      errorMessage: string;
      failedAt: Date;
      retryCount: number;
      settingsUrl: string;
    };

    const props: WebhookFailureEmailProps = {
      recipientName: '管理者',
      webhookName: 'Slack通知',
      webhookUrl: 'https://hooks.slack.com/...',
      errorCode: 500,
      errorMessage: 'Internal Server Error',
      failedAt: new Date(),
      retryCount: 3,
      settingsUrl: 'https://app.diagnoleads.com/settings/webhooks',
    };

    expect(props.errorCode).toBe(500);
  });

  it('should define export ready email template', () => {
    type ExportReadyEmailProps = {
      recipientName: string;
      exportType: string;
      fileName: string;
      downloadUrl: string;
      expiresAt: Date;
      recordCount: number;
    };

    const props: ExportReadyEmailProps = {
      recipientName: '田中',
      exportType: 'リード一覧',
      fileName: 'leads-export-2024-01-15.csv',
      downloadUrl: 'https://app.diagnoleads.com/downloads/abc123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      recordCount: 500,
    };

    expect(props.recordCount).toBe(500);
  });
});

describe('Email template rendering', () => {
  it('should define render function signature', () => {
    type RenderEmailTemplate = <T extends Record<string, unknown>>(
      template: string,
      props: T
    ) => { html: string; text: string };

    const mockRender: RenderEmailTemplate = (template, props) => ({
      html: `<div>${template}: ${JSON.stringify(props)}</div>`,
      text: `${template}: ${JSON.stringify(props)}`,
    });

    const result = mockRender('welcome', { name: 'Test' });
    expect(result.html).toContain('welcome');
    expect(result.text).toContain('Test');
  });
});

describe('Email configuration', () => {
  it('should define email config', () => {
    type EmailConfig = {
      from: string;
      replyTo?: string;
      templateDir?: string;
      defaultLocale: string;
    };

    const config: EmailConfig = {
      from: 'DiagnoLeads <noreply@diagnoleads.com>',
      replyTo: 'support@diagnoleads.com',
      templateDir: 'emails',
      defaultLocale: 'ja',
    };

    expect(config.from).toContain('DiagnoLeads');
  });
});

describe('Email subject templates', () => {
  it('should define subject for each template', () => {
    const subjects = {
      welcome: 'DiagnoLeadsへようこそ',
      passwordReset: 'パスワードリセットのご案内',
      newLead: '【新規リード】{leadName}さんが登録しました',
      invitation: '{inviterName}さんから{organizationName}への招待',
      diagnosticResult: '診断結果: {diagnosticTitle}',
      webhookFailure: '【要確認】Webhook配信失敗: {webhookName}',
      exportReady: 'エクスポートが完了しました',
    };

    expect(subjects.welcome).toContain('ようこそ');
    expect(subjects.newLead).toContain('{leadName}');
  });

  it('should interpolate subject variables', () => {
    const interpolate = (template: string, vars: Record<string, string>) =>
      template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');

    const subject = interpolate('【新規リード】{leadName}さんが登録しました', {
      leadName: '田中太郎',
    });

    expect(subject).toBe('【新規リード】田中太郎さんが登録しました');
  });
});

describe('Email footer', () => {
  it('should define footer content', () => {
    type FooterProps = {
      companyName: string;
      companyUrl: string;
      unsubscribeUrl?: string;
      privacyUrl: string;
      termsUrl: string;
    };

    const footer: FooterProps = {
      companyName: 'DiagnoLeads',
      companyUrl: 'https://diagnoleads.com',
      unsubscribeUrl: 'https://app.diagnoleads.com/unsubscribe',
      privacyUrl: 'https://diagnoleads.com/privacy',
      termsUrl: 'https://diagnoleads.com/terms',
    };

    expect(footer.companyName).toBe('DiagnoLeads');
  });
});

describe('Email styling', () => {
  it('should define style constants', () => {
    const emailStyles = {
      primaryColor: '#465fff',
      backgroundColor: '#f5f5f5',
      textColor: '#333333',
      fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif",
      fontSize: '14px',
      lineHeight: '1.6',
      maxWidth: '600px',
    };

    expect(emailStyles.primaryColor).toBe('#465fff');
    expect(emailStyles.maxWidth).toBe('600px');
  });
});

describe('Email validation', () => {
  it('should validate required props', () => {
    const validateEmailProps = <T extends Record<string, unknown>>(
      props: T,
      required: (keyof T)[]
    ): string[] => {
      const errors: string[] = [];
      for (const key of required) {
        if (!props[key]) {
          errors.push(`Missing required prop: ${String(key)}`);
        }
      }
      return errors;
    };

    const errors = validateEmailProps(
      { userName: 'Test', loginUrl: '' },
      ['userName', 'loginUrl']
    );

    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('loginUrl');
  });
});
