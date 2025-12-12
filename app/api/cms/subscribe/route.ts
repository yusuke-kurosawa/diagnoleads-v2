/**
 * CMS Real-time Subscription API (Server-Sent Events)
 *
 * GET /api/cms/subscribe - Subscribe to CMS events via SSE
 *
 * Query Parameters:
 * - collections: Comma-separated list of collections to watch
 * - clientId: Optional client identifier
 *
 * Example:
 * const eventSource = new EventSource('/api/cms/subscribe?collections=blog-posts,faqs');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('CMS Event:', data);
 * };
 */

import { sseConnectionManager } from '@/lib/cms/core/realtime';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const collectionsParam = searchParams.get('collections');
  const clientId =
    searchParams.get('clientId') ||
    `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const collections = collectionsParam?.split(',').filter(Boolean) || [];

  // レスポンスエンコーダー
  const encoder = new TextEncoder();

  // SSEストリームを作成
  const stream = new ReadableStream({
    start(controller) {
      // クライアントを登録
      sseConnectionManager.addClient(clientId, controller, collections);

      // 接続確認メッセージを送信
      const connectMessage = encoder.encode(
        `data: ${JSON.stringify({
          type: 'connected',
          clientId,
          collections,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
      controller.enqueue(connectMessage);

      // キープアライブのためのハートビート
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = encoder.encode(': heartbeat\n\n');
          controller.enqueue(heartbeat);
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30秒ごと

      // クリーンアップ
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        sseConnectionManager.removeClient(clientId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },

    cancel() {
      sseConnectionManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
