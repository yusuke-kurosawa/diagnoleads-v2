/**
 * Slack Service Tests
 *
 * Unit tests for Slack integration service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendSlackMessage,
  sendLeadNotificationToSlack,
  sendSummaryToSlack,
  sendAlertToSlack,
  type SlackMessageOptions,
  type SlackBlock,
} from '@/lib/features/integrations/slack/slack-service';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Slack Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => 'ok',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testWebhookUrl = 'https://hooks.slack.com/services/TEST/WEBHOOK/URL';

  describe('sendSlackMessage', () => {
    it('should send message successfully', async () => {
      const options: SlackMessageOptions = {
        webhookUrl: testWebhookUrl,
        text: 'Test message',
      };

      const result = await sendSlackMessage(options);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        testWebhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return error when webhookUrl is missing', async () => {
      const options = {
        webhookUrl: '',
        text: 'Test message',
      } as SlackMessageOptions;

      const result = await sendSlackMessage(options);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook URL is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should include all message options in payload', async () => {
      const blocks: SlackBlock[] = [
        { type: 'section', text: { type: 'mrkdwn', text: 'Test' } },
      ];

      const options: SlackMessageOptions = {
        webhookUrl: testWebhookUrl,
        text: 'Test message',
        blocks,
        username: 'CustomBot',
        icon_emoji: ':rocket:',
        channel: '#general',
        thread_ts: '1234567890.123456',
      };

      await sendSlackMessage(options);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toBe('Test message');
      expect(body.blocks).toEqual(blocks);
      expect(body.username).toBe('CustomBot');
      expect(body.icon_emoji).toBe(':rocket:');
      expect(body.channel).toBe('#general');
      expect(body.thread_ts).toBe('1234567890.123456');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'invalid_token',
      });

      const result = await sendSlackMessage({
        webhookUrl: testWebhookUrl,
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Slack API error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendSlackMessage({
        webhookUrl: testWebhookUrl,
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should use default username and icon', async () => {
      await sendSlackMessage({
        webhookUrl: testWebhookUrl,
        text: 'Test',
      });

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.username).toBe('DiagnoLeads');
      expect(body.icon_emoji).toBe(':chart_with_upwards_trend:');
    });
  });

  describe('sendLeadNotificationToSlack', () => {
    it('should send lead notification with all fields', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'TechCorp',
        score: 85,
        source: 'Website',
        dashboardUrl: 'https://app.diagnoleads.com/leads/123',
      };

      const result = await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      expect(result.success).toBe(true);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('John Doe');
      expect(body.blocks).toBeDefined();
      expect(body.blocks.length).toBeGreaterThan(0);
    });

    it('should handle missing lead fields', async () => {
      const leadData = {};

      const result = await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      expect(result.success).toBe(true);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('Unknown');
    });

    it('should set green color for high score', async () => {
      const leadData = { score: 85 };

      await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.attachments[0].color).toBe('#10b981'); // Green
    });

    it('should set yellow color for medium score', async () => {
      const leadData = { score: 55 };

      await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.attachments[0].color).toBe('#f59e0b'); // Yellow
    });

    it('should set red color for low score', async () => {
      const leadData = { score: 25 };

      await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.attachments[0].color).toBe('#ef4444'); // Red
    });

    it('should include dashboard button when URL provided', async () => {
      const leadData = {
        name: 'Test',
        dashboardUrl: 'https://app.example.com/lead/123',
      };

      await sendLeadNotificationToSlack(testWebhookUrl, leadData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      const actionsBlock = body.blocks.find((b: SlackBlock) => b.type === 'actions');
      expect(actionsBlock).toBeDefined();
    });
  });

  describe('sendSummaryToSlack', () => {
    it('should send daily summary', async () => {
      const summaryData = {
        period: 'daily' as const,
        organizationName: 'TestOrg',
        newLeads: 15,
        convertedLeads: 5,
        conversionRate: '33.3%',
      };

      const result = await sendSummaryToSlack(testWebhookUrl, summaryData);

      expect(result.success).toBe(true);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('Daily');
      expect(body.text).toContain('15 new leads');
    });

    it('should send weekly summary', async () => {
      const summaryData = {
        period: 'weekly' as const,
        newLeads: 75,
        convertedLeads: 20,
        conversionRate: '26.7%',
      };

      const result = await sendSummaryToSlack(testWebhookUrl, summaryData);

      expect(result.success).toBe(true);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('Weekly');
    });

    it('should include top sources', async () => {
      const summaryData = {
        period: 'daily' as const,
        newLeads: 10,
        convertedLeads: 3,
        conversionRate: '30%',
        topSources: [
          { name: 'Website', count: 5 },
          { name: 'Referral', count: 3 },
          { name: 'LinkedIn', count: 2 },
        ],
      };

      await sendSummaryToSlack(testWebhookUrl, summaryData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      const sourceBlock = body.blocks.find(
        (b: SlackBlock) => b.type === 'section' && b.text?.text?.includes('Top Sources')
      );
      expect(sourceBlock).toBeDefined();
    });

    it('should include report button when URL provided', async () => {
      const summaryData = {
        period: 'daily' as const,
        newLeads: 10,
        convertedLeads: 3,
        conversionRate: '30%',
        dashboardUrl: 'https://app.example.com/reports',
      };

      await sendSummaryToSlack(testWebhookUrl, summaryData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      const actionsBlock = body.blocks.find((b: SlackBlock) => b.type === 'actions');
      expect(actionsBlock).toBeDefined();
    });
  });

  describe('sendAlertToSlack', () => {
    it('should send error alert', async () => {
      const alertData = {
        type: 'error' as const,
        title: 'Webhook Failed',
        message: 'Could not deliver webhook to endpoint',
      };

      const result = await sendAlertToSlack(testWebhookUrl, alertData);

      expect(result.success).toBe(true);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('[ERROR]');
      expect(body.attachments[0].color).toBe('#ef4444');
    });

    it('should send warning alert', async () => {
      const alertData = {
        type: 'warning' as const,
        title: 'Rate Limit Warning',
        message: 'Approaching API rate limit',
      };

      await sendAlertToSlack(testWebhookUrl, alertData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('[WARNING]');
      expect(body.attachments[0].color).toBe('#f59e0b');
    });

    it('should send info alert', async () => {
      const alertData = {
        type: 'info' as const,
        title: 'New Feature',
        message: 'A new feature has been enabled',
      };

      await sendAlertToSlack(testWebhookUrl, alertData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      expect(body.text).toContain('[INFO]');
      expect(body.attachments[0].color).toBe('#3b82f6');
    });

    it('should include details in alert', async () => {
      const alertData = {
        type: 'error' as const,
        title: 'Error',
        message: 'Something went wrong',
        details: {
          'Error Code': '500',
          Endpoint: '/api/webhooks',
          'Request ID': 'req_123',
        },
      };

      await sendAlertToSlack(testWebhookUrl, alertData);

      const [, fetchOptions] = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchOptions.body);

      const detailsBlock = body.blocks.find(
        (b: SlackBlock) => b.type === 'section' && b.fields
      );
      expect(detailsBlock).toBeDefined();
      expect(detailsBlock.fields.length).toBe(3);
    });
  });
});
