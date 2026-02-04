/**
 * Event Bus
 *
 * Central event bus for pub/sub communication
 */

import type {
  BaseEvent,
  EventBusConfig,
  EventHandler,
  EventHistoryEntry,
  EventSubscription,
  EventType,
  EmitOptions,
} from './types';

/**
 * Event Bus implementation
 */
export class EventBus {
  private subscriptions = new Map<EventType, Set<EventSubscription>>();
  private wildcardSubscriptions = new Set<EventSubscription>();
  private history: EventHistoryEntry[] = [];
  private config: Required<EventBusConfig>;

  constructor(config: EventBusConfig = {}) {
    this.config = {
      maxListeners: config.maxListeners ?? 100,
      catchErrors: config.catchErrors ?? true,
      handlerTimeout: config.handlerTimeout ?? 30000,
    };
  }

  /**
   * Subscribe to an event type
   */
  on<T = unknown>(
    type: EventType | EventType[],
    handler: EventHandler<T>,
    options: { priority?: number; once?: boolean } = {}
  ): () => void {
    const subscription: EventSubscription = {
      id: this.generateId(),
      type,
      handler: handler as EventHandler,
      priority: options.priority ?? 0,
      once: options.once ?? false,
    };

    if (Array.isArray(type)) {
      for (const t of type) {
        this.addSubscription(t, subscription);
      }
    } else {
      this.addSubscription(type, subscription);
    }

    // Return unsubscribe function
    return () => this.off(subscription.id);
  }

  /**
   * Subscribe to an event type (once)
   */
  once<T = unknown>(
    type: EventType | EventType[],
    handler: EventHandler<T>,
    options: { priority?: number } = {}
  ): () => void {
    return this.on(type, handler, { ...options, once: true });
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler, options: { priority?: number } = {}): () => void {
    const subscription: EventSubscription = {
      id: this.generateId(),
      type: [] as EventType[],
      handler,
      priority: options.priority ?? 0,
    };

    this.wildcardSubscriptions.add(subscription);

    return () => {
      this.wildcardSubscriptions.delete(subscription);
    };
  }

  /**
   * Unsubscribe by subscription ID
   */
  off(subscriptionId: string): boolean {
    for (const [, subs] of this.subscriptions) {
      for (const sub of subs) {
        if (sub.id === subscriptionId) {
          subs.delete(sub);
          return true;
        }
      }
    }

    for (const sub of this.wildcardSubscriptions) {
      if (sub.id === subscriptionId) {
        this.wildcardSubscriptions.delete(sub);
        return true;
      }
    }

    return false;
  }

  /**
   * Emit an event
   */
  async emit<T = unknown>(type: EventType, payload: T, options: EmitOptions = {}): Promise<void> {
    const event: BaseEvent<T> = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      organizationId: options.organizationId,
      userId: options.userId,
      payload,
      metadata: options.metadata,
    };

    // Handle delay
    if (options.delay && options.delay > 0) {
      setTimeout(() => this.processEvent(event, options.sync), options.delay);
      return;
    }

    await this.processEvent(event, options.sync);
  }

  /**
   * Get event history
   */
  getHistory(limit = 100): EventHistoryEntry[] {
    return this.history.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Get subscription count for an event type
   */
  listenerCount(type: EventType): number {
    const subs = this.subscriptions.get(type);
    return (subs?.size ?? 0) + this.wildcardSubscriptions.size;
  }

  /**
   * Get all event types with subscriptions
   */
  eventTypes(): EventType[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Remove all subscriptions
   */
  removeAllListeners(type?: EventType): void {
    if (type) {
      this.subscriptions.delete(type);
    } else {
      this.subscriptions.clear();
      this.wildcardSubscriptions.clear();
    }
  }

  private addSubscription(type: EventType, subscription: EventSubscription): void {
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }

    const subs = this.subscriptions.get(type)!;

    if (subs.size >= this.config.maxListeners) {
      console.warn(`Max listeners (${this.config.maxListeners}) reached for event: ${type}`);
    }

    subs.add(subscription);
  }

  private async processEvent<T>(event: BaseEvent<T>, sync = false): Promise<void> {
    const handlers = this.getHandlersForEvent(event.type);
    const errors: string[] = [];
    const handlerNames: string[] = [];

    // Sort by priority (higher first)
    handlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    const executeHandler = async (sub: EventSubscription): Promise<void> => {
      handlerNames.push(sub.id);

      try {
        const result = sub.handler(event as BaseEvent);

        if (result instanceof Promise) {
          await Promise.race([
            result,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Handler timeout')), this.config.handlerTimeout)
            ),
          ]);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${sub.id}: ${errorMessage}`);

        if (!this.config.catchErrors) {
          throw error;
        }

        console.error(`Event handler error [${event.type}]:`, error);
      }

      // Remove once handlers
      if (sub.once) {
        this.off(sub.id);
      }
    };

    if (sync) {
      // Execute sequentially
      for (const handler of handlers) {
        await executeHandler(handler);
      }
    } else {
      // Execute in parallel
      await Promise.all(handlers.map(executeHandler));
    }

    // Record in history
    this.history.push({
      event: event as BaseEvent,
      handledAt: new Date(),
      handlers: handlerNames,
      errors: errors.length > 0 ? errors : undefined,
    });

    // Trim history
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }
  }

  private getHandlersForEvent(type: EventType): EventSubscription[] {
    const handlers: EventSubscription[] = [];

    // Get type-specific handlers
    const typeSubs = this.subscriptions.get(type);
    if (typeSubs) {
      handlers.push(...Array.from(typeSubs));
    }

    // Get wildcard handlers
    handlers.push(...Array.from(this.wildcardSubscriptions));

    return handlers;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Default event bus instance
let defaultBus: EventBus | null = null;

/**
 * Get the default event bus instance
 */
export function getEventBus(): EventBus {
  if (!defaultBus) {
    defaultBus = new EventBus();
  }
  return defaultBus;
}

/**
 * Create a new event bus
 */
export function createEventBus(config?: EventBusConfig): EventBus {
  return new EventBus(config);
}

/**
 * Reset the default event bus (for testing)
 */
export function resetEventBus(): void {
  if (defaultBus) {
    defaultBus.removeAllListeners();
  }
  defaultBus = null;
}

// Convenience functions using default bus

/**
 * Emit an event on the default bus
 */
export async function emit<T = unknown>(
  type: EventType,
  payload: T,
  options?: EmitOptions
): Promise<void> {
  return getEventBus().emit(type, payload, options);
}

/**
 * Subscribe to an event on the default bus
 */
export function on<T = unknown>(
  type: EventType | EventType[],
  handler: EventHandler<T>,
  options?: { priority?: number; once?: boolean }
): () => void {
  return getEventBus().on(type, handler, options);
}

/**
 * Subscribe to an event once on the default bus
 */
export function once<T = unknown>(
  type: EventType | EventType[],
  handler: EventHandler<T>
): () => void {
  return getEventBus().once(type, handler);
}
