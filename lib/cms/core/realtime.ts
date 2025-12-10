/**
 * CMS Real-time Subscription System
 *
 * Server-Sent Events (SSE) based real-time content updates
 * - コレクション変更のリアルタイム通知
 * - ドキュメント更新の購読
 * - Payload CMSフック連携
 */

// =============================================================================
// Types
// =============================================================================

export type CMSEventType =
  | 'collection:created'
  | 'collection:updated'
  | 'collection:deleted'
  | 'document:published'
  | 'document:unpublished'
  | 'cache:invalidated';

export interface CMSEvent {
  id: string;
  type: CMSEventType;
  collection: string;
  documentId?: string;
  slug?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface Subscription {
  id: string;
  collections: string[];
  callback: (event: CMSEvent) => void;
  createdAt: Date;
}

// =============================================================================
// Event Emitter
// =============================================================================

type EventListener = (event: CMSEvent) => void;

class CMSEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private allListeners: Set<EventListener> = new Set();

  /**
   * 特定コレクションのイベントを購読
   */
  on(collection: string, listener: EventListener): () => void {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(listener);

    // アンサブスクライブ関数を返す
    return () => {
      this.listeners.get(collection)?.delete(listener);
    };
  }

  /**
   * すべてのイベントを購読
   */
  onAll(listener: EventListener): () => void {
    this.allListeners.add(listener);
    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * イベントを発行
   */
  emit(event: CMSEvent): void {
    // コレクション固有のリスナーに通知
    const collectionListeners = this.listeners.get(event.collection);
    if (collectionListeners) {
      for (const listener of collectionListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error('[CMS Realtime] Listener error:', error);
        }
      }
    }

    // すべてのリスナーに通知
    for (const listener of this.allListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[CMS Realtime] All listener error:', error);
      }
    }
  }

  /**
   * リスナー数を取得
   */
  getListenerCount(collection?: string): number {
    if (collection) {
      return this.listeners.get(collection)?.size || 0;
    }
    let total = this.allListeners.size;
    for (const listeners of this.listeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * すべてのリスナーをクリア
   */
  clear(): void {
    this.listeners.clear();
    this.allListeners.clear();
  }
}

// =============================================================================
// SSE Connection Manager
// =============================================================================

interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  collections: string[];
  connectedAt: Date;
}

class SSEConnectionManager {
  private clients: Map<string, SSEClient> = new Map();
  private eventEmitter: CMSEventEmitter;

  constructor(emitter: CMSEventEmitter) {
    this.eventEmitter = emitter;

    // イベントエミッターにリスナーを登録
    this.eventEmitter.onAll((event) => {
      this.broadcastEvent(event);
    });
  }

  /**
   * 新しいSSEクライアントを追加
   */
  addClient(
    clientId: string,
    controller: ReadableStreamDefaultController,
    collections: string[] = []
  ): void {
    this.clients.set(clientId, {
      id: clientId,
      controller,
      collections,
      connectedAt: new Date(),
    });

    console.log(`[CMS Realtime] Client connected: ${clientId}, total: ${this.clients.size}`);
  }

  /**
   * クライアントを削除
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`[CMS Realtime] Client disconnected: ${clientId}, total: ${this.clients.size}`);
  }

  /**
   * イベントをクライアントにブロードキャスト
   */
  private broadcastEvent(event: CMSEvent): void {
    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(eventData);

    for (const client of this.clients.values()) {
      // コレクションフィルター
      if (client.collections.length > 0 && !client.collections.includes(event.collection)) {
        continue;
      }

      try {
        client.controller.enqueue(encoded);
      } catch (error) {
        console.error(`[CMS Realtime] Error sending to client ${client.id}:`, error);
        this.removeClient(client.id);
      }
    }
  }

  /**
   * 接続中のクライアント数を取得
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 接続情報を取得
   */
  getConnectionInfo(): Array<{
    id: string;
    collections: string[];
    connectedAt: Date;
  }> {
    return Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      collections: client.collections,
      connectedAt: client.connectedAt,
    }));
  }
}

// =============================================================================
// Subscription Manager
// =============================================================================

export class CMSSubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventEmitter: CMSEventEmitter;

  constructor(emitter: CMSEventEmitter) {
    this.eventEmitter = emitter;
  }

  /**
   * 新しい購読を作成
   */
  subscribe(collections: string[], callback: (event: CMSEvent) => void): string {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const subscription: Subscription = {
      id,
      collections,
      callback,
      createdAt: new Date(),
    };

    this.subscriptions.set(id, subscription);

    // 各コレクションに対してリスナーを登録
    for (const collection of collections) {
      this.eventEmitter.on(collection, (event) => {
        if (this.subscriptions.has(id)) {
          callback(event);
        }
      });
    }

    return id;
  }

  /**
   * 購読を解除
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * 購読情報を取得
   */
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * すべての購読を取得
   */
  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

let eventIdCounter = 0;

/**
 * 新しいCMSイベントを作成
 */
export function createCMSEvent(
  type: CMSEventType,
  collection: string,
  options?: {
    documentId?: string;
    slug?: string;
    data?: Record<string, unknown>;
  }
): CMSEvent {
  return {
    id: `evt_${Date.now()}_${++eventIdCounter}`,
    type,
    collection,
    documentId: options?.documentId,
    slug: options?.slug,
    timestamp: new Date(),
    data: options?.data,
  };
}

/**
 * Payload CMSフックからイベントを発行
 */
export function emitFromPayloadHook(
  operation: 'create' | 'update' | 'delete',
  collection: string,
  doc: { id: string; slug?: string; status?: string }
): void {
  const eventTypes: Record<string, CMSEventType> = {
    create: 'collection:created',
    update: 'collection:updated',
    delete: 'collection:deleted',
  };

  const event = createCMSEvent(eventTypes[operation], collection, {
    documentId: doc.id,
    slug: doc.slug,
    data: { status: doc.status },
  });

  cmsEventEmitter.emit(event);

  // publishedステータスの場合は追加イベント
  if (doc.status === 'published' && operation !== 'delete') {
    cmsEventEmitter.emit(
      createCMSEvent('document:published', collection, {
        documentId: doc.id,
        slug: doc.slug,
      })
    );
  }
}

// =============================================================================
// Singleton Instances
// =============================================================================

export const cmsEventEmitter = new CMSEventEmitter();
export const sseConnectionManager = new SSEConnectionManager(cmsEventEmitter);
export const cmsSubscriptionManager = new CMSSubscriptionManager(cmsEventEmitter);
