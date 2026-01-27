/**
 * Payload CMS Webhook Hooks
 *
 * コレクション変更時に外部サービスにWebhookを送信
 * - Slack通知
 * - Zapier/Make連携
 * - カスタムWebhook
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';

// =============================================================================
// Types
// =============================================================================

export interface WebhookPayload {
  event: 'create' | 'update' | 'delete';
  collection: string;
  document: {
    id: string;
    title?: string;
    slug?: string;
    status?: string;
    [key: string]: unknown;
  };
  timestamp: string;
  environment: string;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: ('create' | 'update' | 'delete')[];
  collections: string[] | '*';
  enabled: boolean;
}

// =============================================================================
// Webhook Registry
// =============================================================================

const webhookRegistry: WebhookConfig[] = [];

/**
 * Webhookを登録
 */
export function registerWebhook(config: WebhookConfig): void {
  webhookRegistry.push(config);
}

/**
 * 環境変数からWebhookを初期化
 */
export function initializeWebhooks(): void {
  // Slack Webhook
  if (process.env.CMS_SLACK_WEBHOOK_URL) {
    registerWebhook({
      url: process.env.CMS_SLACK_WEBHOOK_URL,
      events: ['create', 'update'],
      collections: ['diagnostic-forms', 'blog-posts', 'landing-pages'],
      enabled: true,
    });
  }

  // Zapier Webhook
  if (process.env.CMS_ZAPIER_WEBHOOK_URL) {
    registerWebhook({
      url: process.env.CMS_ZAPIER_WEBHOOK_URL,
      secret: process.env.CMS_ZAPIER_WEBHOOK_SECRET,
      events: ['create', 'update', 'delete'],
      collections: '*',
      enabled: true,
    });
  }

  // Generic Webhook
  if (process.env.CMS_WEBHOOK_URL) {
    registerWebhook({
      url: process.env.CMS_WEBHOOK_URL,
      secret: process.env.CMS_WEBHOOK_SECRET,
      events: ['create', 'update', 'delete'],
      collections: '*',
      enabled: true,
    });
  }
}

// =============================================================================
// Webhook Sender
// =============================================================================

/**
 * Webhookを送信
 */
async function sendWebhook(config: WebhookConfig, payload: WebhookPayload): Promise<void> {
  if (!config.enabled) return;

  // コレクションフィルター
  if (config.collections !== '*' && !config.collections.includes(payload.collection)) {
    return;
  }

  // イベントフィルター
  if (!config.events.includes(payload.event)) {
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 署名を追加（セキュリティ用）
    if (config.secret) {
      const { createHmac } = await import('node:crypto');
      const signature = createHmac('sha256', config.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[CMS Webhook] Failed to send to ${config.url}: ${response.status}`);
    } else {
      console.log(
        `[CMS Webhook] Sent ${payload.event} event for ${payload.collection}/${payload.document.id}`
      );
    }
  } catch (error) {
    console.error(`[CMS Webhook] Error sending to ${config.url}:`, error);
  }
}

/**
 * すべての登録済みWebhookに送信
 */
async function broadcastWebhook(payload: WebhookPayload): Promise<void> {
  await Promise.allSettled(webhookRegistry.map((config) => sendWebhook(config, payload)));
}

// =============================================================================
// Slack Formatter
// =============================================================================

/**
 * Slack用のペイロードを生成
 */
function formatSlackPayload(payload: WebhookPayload): Record<string, unknown> {
  const emoji = {
    create: ':sparkles:',
    update: ':pencil2:',
    delete: ':wastebasket:',
  }[payload.event];

  const color = {
    create: '#36a64f',
    update: '#2196f3',
    delete: '#f44336',
  }[payload.event];

  const actionText = {
    create: '作成されました',
    update: '更新されました',
    delete: '削除されました',
  }[payload.event];

  return {
    attachments: [
      {
        color,
        pretext: `${emoji} CMS コンテンツが${actionText}`,
        fields: [
          {
            title: 'コレクション',
            value: payload.collection,
            short: true,
          },
          {
            title: 'タイトル',
            value: payload.document.title || payload.document.slug || payload.document.id,
            short: true,
          },
          {
            title: 'ステータス',
            value: payload.document.status || '-',
            short: true,
          },
          {
            title: '環境',
            value: payload.environment,
            short: true,
          },
        ],
        footer: 'DiagnoLeads CMS',
        ts: Math.floor(new Date(payload.timestamp).getTime() / 1000).toString(),
      },
    ],
  };
}

/**
 * Slack専用のWebhook送信
 */
async function sendSlackNotification(payload: WebhookPayload): Promise<void> {
  const slackUrl = process.env.CMS_SLACK_WEBHOOK_URL;
  if (!slackUrl) return;

  const slackPayload = formatSlackPayload(payload);

  try {
    await fetch(slackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });
  } catch (error) {
    console.error('[CMS Webhook] Slack notification failed:', error);
  }
}

// =============================================================================
// Payload Hooks
// =============================================================================

/**
 * ドキュメント作成・更新後にWebhookを送信
 */
export const afterChangeWebhook: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
}) => {
  const payload: WebhookPayload = {
    event: operation as 'create' | 'update',
    collection: collection.slug,
    document: {
      id: String(doc.id),
      title: doc.title || doc.name || doc.question,
      slug: doc.slug,
      status: doc.status || doc._status,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // 非同期でWebhookを送信（レスポンスを待たない）
  broadcastWebhook(payload).catch(console.error);
  sendSlackNotification(payload).catch(console.error);

  return doc;
};

/**
 * ドキュメント削除後にWebhookを送信
 */
export const afterDeleteWebhook: CollectionAfterDeleteHook = async ({ collection, doc }) => {
  const payload: WebhookPayload = {
    event: 'delete',
    collection: collection.slug,
    document: {
      id: String(doc.id),
      title: doc.title || doc.name || doc.question,
      slug: doc.slug,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // 非同期でWebhookを送信
  broadcastWebhook(payload).catch(console.error);
  sendSlackNotification(payload).catch(console.error);

  return doc;
};

/**
 * フックをコレクション設定に追加するヘルパー
 */
export function withWebhooks<T extends { hooks?: Record<string, unknown[]> }>(config: T): T {
  return {
    ...config,
    hooks: {
      ...config.hooks,
      afterChange: [...(config.hooks?.afterChange || []), afterChangeWebhook],
      afterDelete: [...(config.hooks?.afterDelete || []), afterDeleteWebhook],
    },
  } as T;
}

// Initialize webhooks on module load
initializeWebhooks();
