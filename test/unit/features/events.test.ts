/**
 * Event System Tests
 *
 * Unit tests for the event bus
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EventBus,
  createEventBus,
  getEventBus,
  resetEventBus,
  emit,
  on,
  once,
} from '@/lib/events/bus';
import type { BaseEvent, EventType, LeadCreatedPayload } from '@/lib/events/types';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    resetEventBus();
    bus = createEventBus();
  });

  afterEach(() => {
    bus.removeAllListeners();
  });

  describe('on', () => {
    it('should subscribe to an event', async () => {
      const handler = vi.fn();
      bus.on('lead.created', handler);

      await bus.emit('lead.created', { leadId: 'lead-1' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lead.created',
          payload: { leadId: 'lead-1' },
        })
      );
    });

    it('should subscribe to multiple event types', async () => {
      const handler = vi.fn();
      bus.on(['lead.created', 'lead.updated'], handler);

      await bus.emit('lead.created', {});
      await bus.emit('lead.updated', {});
      await bus.emit('lead.deleted', {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should return unsubscribe function', async () => {
      const handler = vi.fn();
      const unsubscribe = bus.on('lead.created', handler);

      await bus.emit('lead.created', {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await bus.emit('lead.created', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should respect priority order', async () => {
      const order: number[] = [];

      bus.on('lead.created', () => order.push(1), { priority: 1 });
      bus.on('lead.created', () => order.push(3), { priority: 3 });
      bus.on('lead.created', () => order.push(2), { priority: 2 });

      await bus.emit('lead.created', {}, { sync: true });

      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe('once', () => {
    it('should only trigger once', async () => {
      const handler = vi.fn();
      bus.once('lead.created', handler);

      await bus.emit('lead.created', {});
      await bus.emit('lead.created', {});

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('onAny', () => {
    it('should receive all events', async () => {
      const handler = vi.fn();
      bus.onAny(handler);

      await bus.emit('lead.created', {});
      await bus.emit('lead.updated', {});
      await bus.emit('organization.created', {});

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('off', () => {
    it('should unsubscribe by ID', async () => {
      const handler = vi.fn();
      bus.on('lead.created', handler);

      // Get subscription ID from history after emit
      await bus.emit('lead.created', {});
      const history = bus.getHistory();
      const subId = history[0].handlers[0];

      const removed = bus.off(subId);
      expect(removed).toBe(true);

      await bus.emit('lead.created', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return false for non-existent subscription', () => {
      const removed = bus.off('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('emit', () => {
    it('should include event metadata', async () => {
      const handler = vi.fn();
      bus.on('lead.created', handler);

      await bus.emit(
        'lead.created',
        { leadId: 'lead-1' },
        {
          organizationId: 'org-1',
          userId: 'user-1',
          metadata: { source: 'api' },
        }
      );

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          userId: 'user-1',
          metadata: { source: 'api' },
        })
      );
    });

    it('should handle delayed emit', async () => {
      vi.useFakeTimers();
      const handler = vi.fn();
      bus.on('lead.created', handler);

      bus.emit('lead.created', {}, { delay: 1000 });

      expect(handler).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1000);

      expect(handler).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should handle async handlers', async () => {
      const results: number[] = [];

      bus.on('lead.created', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(1);
      });

      bus.on('lead.created', async () => {
        results.push(2);
      });

      await bus.emit('lead.created', {});

      expect(results).toContain(1);
      expect(results).toContain(2);
    });

    it('should catch handler errors when configured', async () => {
      const errorBus = createEventBus({ catchErrors: true });
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      errorBus.on('lead.created', handler);

      await expect(errorBus.emit('lead.created', {})).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('history', () => {
    it('should record event history', async () => {
      bus.on('lead.created', vi.fn());

      await bus.emit('lead.created', { leadId: 'lead-1' });
      await bus.emit('lead.updated', { leadId: 'lead-1' });

      const history = bus.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].event.type).toBe('lead.created');
      expect(history[1].event.type).toBe('lead.updated');
    });

    it('should clear history', async () => {
      await bus.emit('lead.created', {});
      await bus.emit('lead.updated', {});

      bus.clearHistory();

      expect(bus.getHistory()).toHaveLength(0);
    });

    it('should limit history entries', async () => {
      bus.on('lead.created', vi.fn());

      // Emit more than 1000 events
      for (let i = 0; i < 1100; i++) {
        await bus.emit('lead.created', { i });
      }

      expect(bus.getHistory().length).toBeLessThanOrEqual(1000);
    });
  });

  describe('listenerCount', () => {
    it('should return correct count', () => {
      bus.on('lead.created', vi.fn());
      bus.on('lead.created', vi.fn());
      bus.on('lead.updated', vi.fn());

      expect(bus.listenerCount('lead.created')).toBe(2);
      expect(bus.listenerCount('lead.updated')).toBe(1);
      expect(bus.listenerCount('lead.deleted')).toBe(0);
    });

    it('should include wildcard listeners', () => {
      bus.on('lead.created', vi.fn());
      bus.onAny(vi.fn());

      expect(bus.listenerCount('lead.created')).toBe(2);
    });
  });

  describe('eventTypes', () => {
    it('should return subscribed event types', () => {
      bus.on('lead.created', vi.fn());
      bus.on('lead.updated', vi.fn());
      bus.on('organization.created', vi.fn());

      const types = bus.eventTypes();

      expect(types).toContain('lead.created');
      expect(types).toContain('lead.updated');
      expect(types).toContain('organization.created');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('lead.created', handler1);
      bus.on('lead.updated', handler2);

      bus.removeAllListeners();

      await bus.emit('lead.created', {});
      await bus.emit('lead.updated', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should remove listeners for specific type', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bus.on('lead.created', handler1);
      bus.on('lead.updated', handler2);

      bus.removeAllListeners('lead.created');

      await bus.emit('lead.created', {});
      await bus.emit('lead.updated', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
});

describe('Default Event Bus', () => {
  beforeEach(() => {
    resetEventBus();
  });

  it('should return singleton instance', () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();

    expect(bus1).toBe(bus2);
  });

  it('should work with convenience functions', async () => {
    const handler = vi.fn();

    on('lead.created', handler);
    await emit('lead.created', { leadId: 'lead-1' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should work with once convenience function', async () => {
    const handler = vi.fn();

    once('lead.created', handler);
    await emit('lead.created', {});
    await emit('lead.created', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('Type Safety', () => {
  it('should enforce typed payloads', async () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.on<LeadCreatedPayload>('lead.created', (event) => {
      // TypeScript should know event.payload has leadId
      handler(event.payload.leadId);
    });

    await bus.emit<LeadCreatedPayload>('lead.created', {
      leadId: 'lead-123',
      email: 'test@example.com',
    });

    expect(handler).toHaveBeenCalledWith('lead-123');
  });
});
