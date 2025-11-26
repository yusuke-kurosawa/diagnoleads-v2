/**
 * Slack Integration Service
 *
 * Phase 5.3: Slack統合
 * Sends notifications to Slack channels via webhooks
 */

/**
 * Slack message attachment
 */
export interface SlackAttachment {
  color?: string;
  pretext?: string;
  author_name?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

/**
 * Slack message block
 */
export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'context' | 'actions';
  text?: {
    type: 'plain_text' | 'mrkdwn';
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: 'plain_text' | 'mrkdwn';
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
    action_id?: string;
  }>;
  accessory?: {
    type: string;
    text?: {
      type: string;
      text: string;
    };
    url?: string;
    action_id?: string;
  };
}

/**
 * Slack message options
 */
export interface SlackMessageOptions {
  webhookUrl: string;
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  channel?: string;
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

/**
 * Slack send result
 */
export interface SlackSendResult {
  success: boolean;
  error?: string;
}

/**
 * Send a message to Slack via webhook
 */
export async function sendSlackMessage(options: SlackMessageOptions): Promise<SlackSendResult> {
  const {
    webhookUrl,
    text,
    blocks,
    attachments,
    username = 'DiagnoLeads',
    icon_emoji = ':chart_with_upwards_trend:',
    channel,
    thread_ts,
    unfurl_links = false,
    unfurl_media = true,
  } = options;

  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL is required' };
  }

  try {
    const payload: Record<string, unknown> = {
      username,
      icon_emoji,
      unfurl_links,
      unfurl_media,
    };

    if (text) payload.text = text;
    if (blocks) payload.blocks = blocks;
    if (attachments) payload.attachments = attachments;
    if (channel) payload.channel = channel;
    if (thread_ts) payload.thread_ts = thread_ts;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Slack API error: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a lead notification to Slack
 */
export async function sendLeadNotificationToSlack(
  webhookUrl: string,
  leadData: {
    name?: string;
    email?: string;
    company?: string;
    score?: number;
    source?: string;
    dashboardUrl?: string;
  }
): Promise<SlackSendResult> {
  const scoreColor = (leadData.score || 0) >= 70 ? '#10b981' : (leadData.score || 0) >= 40 ? '#f59e0b' : '#ef4444';

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':star: New Lead Received',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name:*\n${leadData.name || 'Not provided'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Email:*\n${leadData.email || 'Not provided'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Company:*\n${leadData.company || 'Not provided'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Source:*\n${leadData.source || 'Diagnostic Form'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:bar_chart: *Lead Score:* ${leadData.score || 'N/A'}/100`,
      },
    },
    {
      type: 'divider',
    },
  ];

  if (leadData.dashboardUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View in Dashboard',
            emoji: true,
          },
          url: leadData.dashboardUrl,
          action_id: 'view_lead',
        },
      ],
    });
  }

  return sendSlackMessage({
    webhookUrl,
    text: `New lead from ${leadData.name || leadData.email || 'Unknown'}`,
    blocks,
    attachments: [
      {
        color: scoreColor,
        footer: 'DiagnoLeads',
        footer_icon: 'https://diagnoleads.com/icon.png',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}

/**
 * Send a daily/weekly summary to Slack
 */
export async function sendSummaryToSlack(
  webhookUrl: string,
  summaryData: {
    period: 'daily' | 'weekly';
    organizationName?: string;
    newLeads: number;
    convertedLeads: number;
    conversionRate: string;
    topSources?: Array<{ name: string; count: number }>;
    dashboardUrl?: string;
  }
): Promise<SlackSendResult> {
  const periodLabel = summaryData.period === 'daily' ? 'Daily' : 'Weekly';

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:chart_with_upwards_trend: ${periodLabel} Summary`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${summaryData.organizationName || 'Your Organization'}*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `:inbox_tray: *New Leads:*\n${summaryData.newLeads}`,
        },
        {
          type: 'mrkdwn',
          text: `:white_check_mark: *Converted:*\n${summaryData.convertedLeads}`,
        },
        {
          type: 'mrkdwn',
          text: `:dart: *Conversion Rate:*\n${summaryData.conversionRate}`,
        },
      ],
    },
  ];

  if (summaryData.topSources && summaryData.topSources.length > 0) {
    const sourcesText = summaryData.topSources
      .slice(0, 5)
      .map((s, i) => `${i + 1}. ${s.name}: ${s.count}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Top Sources:*\n${sourcesText}`,
      },
    });
  }

  blocks.push({ type: 'divider' });

  if (summaryData.dashboardUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Full Report',
            emoji: true,
          },
          url: summaryData.dashboardUrl,
          action_id: 'view_report',
        },
      ],
    });
  }

  return sendSlackMessage({
    webhookUrl,
    text: `${periodLabel} Summary: ${summaryData.newLeads} new leads, ${summaryData.conversionRate} conversion rate`,
    blocks,
  });
}

/**
 * Send an alert notification to Slack
 */
export async function sendAlertToSlack(
  webhookUrl: string,
  alertData: {
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: Record<string, string>;
  }
): Promise<SlackSendResult> {
  const typeEmoji = {
    error: ':rotating_light:',
    warning: ':warning:',
    info: ':information_source:',
  };

  const typeColor = {
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${typeEmoji[alertData.type]} ${alertData.title}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: alertData.message,
      },
    },
  ];

  if (alertData.details) {
    const detailsFields = Object.entries(alertData.details).map(([key, value]) => ({
      type: 'mrkdwn' as const,
      text: `*${key}:*\n${value}`,
    }));

    blocks.push({
      type: 'section',
      fields: detailsFields.slice(0, 10), // Slack limit
    });
  }

  return sendSlackMessage({
    webhookUrl,
    text: `[${alertData.type.toUpperCase()}] ${alertData.title}`,
    blocks,
    attachments: [
      {
        color: typeColor[alertData.type],
        footer: 'DiagnoLeads',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
}
