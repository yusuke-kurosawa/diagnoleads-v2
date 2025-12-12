/**
 * Figma Webhook Handler for CMS Sync
 *
 * POST /api/cms/figma/webhook
 *
 * Handles Figma webhook events for:
 * - File updates (FILE_UPDATE)
 * - Component updates (LIBRARY_PUBLISH)
 * - Comment notifications (FILE_COMMENT)
 *
 * @see https://www.figma.com/developers/api#webhooks_v2
 */

import crypto from 'node:crypto';
import { cmsEventEmitter, createCMSEvent } from '@/lib/cms/core/realtime';
import { figmaClient, figmaSitesManager } from '@/lib/cms/integrations/figma';
import { type NextRequest, NextResponse } from 'next/server';

// Figma webhook event types
type FigmaWebhookEvent = 'FILE_UPDATE' | 'FILE_DELETE' | 'FILE_COMMENT' | 'LIBRARY_PUBLISH';

interface FigmaWebhookPayload {
  event_type: FigmaWebhookEvent;
  passcode: string;
  timestamp: string;
  webhook_id: string;
  file_key?: string;
  file_name?: string;
  comment_id?: string;
  library_items?: Array<{
    key: string;
    name: string;
  }>;
}

/**
 * Verify webhook signature (if secret is configured)
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.FIGMA_WEBHOOK_SECRET;

  if (!secret) {
    // If no secret is configured, skip verification
    console.warn(
      '[Figma Webhook] No FIGMA_WEBHOOK_SECRET configured, skipping signature verification'
    );
    return true;
  }

  if (!signature) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-figma-signature');

    // Verify signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[Figma Webhook] Invalid signature');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const payload: FigmaWebhookPayload = JSON.parse(body);
    console.log(`[Figma Webhook] Received event: ${payload.event_type}`);

    switch (payload.event_type) {
      case 'FILE_UPDATE': {
        if (!payload.file_key) break;

        // Check if we have registered pages for this file
        const pages = figmaSitesManager
          .getAllPages()
          .filter((p) => p.figmaFileId === payload.file_key);

        if (pages.length === 0) {
          console.log(`[Figma Webhook] No registered pages for file: ${payload.file_key}`);
          break;
        }

        // Emit update events for each page
        for (const page of pages) {
          cmsEventEmitter.emit(
            createCMSEvent('collection:updated', page.payloadCollection, {
              slug: page.slug,
              data: {
                source: 'figma',
                fileKey: payload.file_key,
                fileName: payload.file_name,
                timestamp: payload.timestamp,
              },
            })
          );

          // Optionally auto-sync content
          if (process.env.FIGMA_AUTO_SYNC === 'true') {
            try {
              await figmaSitesManager.syncPageContent(page);
              console.log(`[Figma Webhook] Auto-synced page: ${page.slug}`);
            } catch (error) {
              console.error(`[Figma Webhook] Auto-sync failed for ${page.slug}:`, error);
            }
          }
        }

        break;
      }

      case 'LIBRARY_PUBLISH': {
        // Design system components updated
        if (payload.library_items && payload.library_items.length > 0) {
          console.log(`[Figma Webhook] Library publish: ${payload.library_items.length} items`);

          // Sync design tokens if configured
          if (payload.file_key && figmaClient.isConfigured()) {
            try {
              await figmaClient.syncDesignTokens(payload.file_key);
              console.log('[Figma Webhook] Design tokens synced');
            } catch (error) {
              console.error('[Figma Webhook] Token sync failed:', error);
            }
          }
        }
        break;
      }

      case 'FILE_COMMENT': {
        // Comment notifications (optional: forward to Slack/Discord)
        console.log(`[Figma Webhook] New comment on file: ${payload.file_key}`);
        break;
      }

      case 'FILE_DELETE': {
        console.log(`[Figma Webhook] File deleted: ${payload.file_key}`);
        break;
      }
    }

    return NextResponse.json({
      success: true,
      event: payload.event_type,
      timestamp: payload.timestamp,
    });
  } catch (error) {
    console.error('[Figma Webhook] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to verify webhook is configured
export async function GET() {
  return NextResponse.json({
    configured: figmaClient.isConfigured(),
    autoSync: process.env.FIGMA_AUTO_SYNC === 'true',
    registeredPages: figmaSitesManager.getAllPages().length,
  });
}
