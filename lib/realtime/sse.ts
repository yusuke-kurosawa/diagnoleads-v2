/**
 * SSE Utilities
 *
 * Server-Sent Events helpers for Next.js
 */

import { getRealtimeHub } from './hub';
import type { RealtimeMessage, SSEConnection } from './types';

/**
 * Create an SSE response for Next.js
 */
export function createSSEResponse(options: {
  userId?: string;
  organizationId?: string;
  onClose?: () => void;
}): Response {
  const hub = getRealtimeHub();
  const connectionId = generateConnectionId();

  let controller: ReadableStreamDefaultController<Uint8Array>;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;

      const connection: SSEConnection = {
        id: connectionId,
        userId: options.userId,
        organizationId: options.organizationId,
        channels: new Set(),
        createdAt: new Date(),
        lastActivity: new Date(),
        send: (message: RealtimeMessage) => {
          try {
            const data = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // Connection closed
          }
        },
        close: () => {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        },
      };

      hub.addConnection(connection);
    },

    cancel() {
      hub.removeConnection(connectionId);
      options.onClose?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Connection-Id': connectionId,
    },
  });
}

/**
 * Create SSE connection for testing
 */
export function createTestConnection(options: {
  id?: string;
  userId?: string;
  organizationId?: string;
}): {
  connection: SSEConnection;
  messages: RealtimeMessage[];
  close: () => void;
} {
  const messages: RealtimeMessage[] = [];
  let isClosed = false;

  const connection: SSEConnection = {
    id: options.id ?? generateConnectionId(),
    userId: options.userId,
    organizationId: options.organizationId,
    channels: new Set(),
    createdAt: new Date(),
    lastActivity: new Date(),
    send: (message: RealtimeMessage) => {
      if (!isClosed) {
        messages.push(message);
      }
    },
    close: () => {
      isClosed = true;
    },
  };

  return {
    connection,
    messages,
    close: () => {
      isClosed = true;
    },
  };
}

/**
 * Parse SSE event data
 */
export function parseSSEData<T = unknown>(eventData: string): RealtimeMessage<T> | null {
  try {
    return JSON.parse(eventData) as RealtimeMessage<T>;
  } catch {
    return null;
  }
}

/**
 * Format message as SSE event
 */
export function formatSSEEvent(message: RealtimeMessage): string {
  const lines: string[] = [];

  if (message.type) {
    lines.push(`event: ${message.type}`);
  }

  lines.push(`data: ${JSON.stringify(message)}`);
  lines.push(`id: ${message.id}`);
  lines.push('');

  return lines.join('\n') + '\n';
}

function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
