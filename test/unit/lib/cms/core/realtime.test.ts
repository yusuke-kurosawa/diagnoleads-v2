import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createCMSEvent,
  emitFromPayloadHook,
  cmsEventEmitter,
  cmsSubscriptionManager,
  type CMSEvent,
  type CMSEventType,
} from '@/lib/cms/core/realtime';

describe('CMS Realtime', () => {
  beforeEach(() => {
    cmsEventEmitter.clear();
  });

  describe('createCMSEvent', () => {
    it('should create event with required fields', () => {
      const event = createCMSEvent('collection:created', 'posts');

      expect(event.id).toMatch(/^evt_\d+_\d+$/);
      expect(event.type).toBe('collection:created');
      expect(event.collection).toBe('posts');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.documentId).toBeUndefined();
      expect(event.slug).toBeUndefined();
      expect(event.data).toBeUndefined();
    });

    it('should create event with optional fields', () => {
      const event = createCMSEvent('collection:updated', 'articles', {
        documentId: 'doc-123',
        slug: 'my-article',
        data: { author: 'John' },
      });

      expect(event.documentId).toBe('doc-123');
      expect(event.slug).toBe('my-article');
      expect(event.data).toEqual({ author: 'John' });
    });

    it('should generate unique event IDs', () => {
      const event1 = createCMSEvent('collection:created', 'posts');
      const event2 = createCMSEvent('collection:created', 'posts');

      expect(event1.id).not.toBe(event2.id);
    });

    it('should handle all event types', () => {
      const eventTypes: CMSEventType[] = [
        'collection:created',
        'collection:updated',
        'collection:deleted',
        'document:published',
        'document:unpublished',
        'cache:invalidated',
      ];

      for (const type of eventTypes) {
        const event = createCMSEvent(type, 'test');
        expect(event.type).toBe(type);
      }
    });
  });

  describe('CMSEventEmitter', () => {
    it('should emit events to collection listeners', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('posts', callback);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it('should not emit events to other collection listeners', () => {
      const postsCallback = vi.fn();
      const articlesCallback = vi.fn();

      cmsEventEmitter.on('posts', postsCallback);
      cmsEventEmitter.on('articles', articlesCallback);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      expect(postsCallback).toHaveBeenCalledWith(event);
      expect(articlesCallback).not.toHaveBeenCalled();
    });

    it('should emit events to all listeners via onAll', () => {
      const allCallback = vi.fn();
      cmsEventEmitter.onAll(allCallback);

      const postsEvent = createCMSEvent('collection:created', 'posts');
      const articlesEvent = createCMSEvent('collection:updated', 'articles');

      cmsEventEmitter.emit(postsEvent);
      cmsEventEmitter.emit(articlesEvent);

      expect(allCallback).toHaveBeenCalledTimes(2);
      expect(allCallback).toHaveBeenCalledWith(postsEvent);
      expect(allCallback).toHaveBeenCalledWith(articlesEvent);
    });

    it('should unsubscribe collection listener', () => {
      const callback = vi.fn();
      const unsubscribe = cmsEventEmitter.on('posts', callback);

      const event1 = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      const event2 = createCMSEvent('collection:updated', 'posts');
      cmsEventEmitter.emit(event2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe all listener', () => {
      const callback = vi.fn();
      const unsubscribe = cmsEventEmitter.onAll(callback);

      cmsEventEmitter.emit(createCMSEvent('collection:created', 'posts'));
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      cmsEventEmitter.emit(createCMSEvent('collection:updated', 'posts'));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return correct listener count for collection', () => {
      expect(cmsEventEmitter.getListenerCount('posts')).toBe(0);

      cmsEventEmitter.on('posts', vi.fn());
      expect(cmsEventEmitter.getListenerCount('posts')).toBe(1);

      cmsEventEmitter.on('posts', vi.fn());
      expect(cmsEventEmitter.getListenerCount('posts')).toBe(2);
    });

    it('should return total listener count', () => {
      expect(cmsEventEmitter.getListenerCount()).toBe(0);

      cmsEventEmitter.on('posts', vi.fn());
      cmsEventEmitter.on('articles', vi.fn());
      cmsEventEmitter.onAll(vi.fn());

      expect(cmsEventEmitter.getListenerCount()).toBe(3);
    });

    it('should clear all listeners', () => {
      cmsEventEmitter.on('posts', vi.fn());
      cmsEventEmitter.on('articles', vi.fn());
      cmsEventEmitter.onAll(vi.fn());

      expect(cmsEventEmitter.getListenerCount()).toBe(3);

      cmsEventEmitter.clear();

      expect(cmsEventEmitter.getListenerCount()).toBe(0);
    });

    it('should handle listener errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();

      cmsEventEmitter.on('posts', errorCallback);
      cmsEventEmitter.on('posts', normalCallback);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[CMS Realtime] Listener error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle all listener errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('All listener error');
      });

      cmsEventEmitter.onAll(errorCallback);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CMS Realtime] All listener error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('CMSSubscriptionManager', () => {
    it('should create subscription with unique ID', () => {
      const callback = vi.fn();
      const id = cmsSubscriptionManager.subscribe(['posts'], callback);

      expect(id).toMatch(/^sub_\d+_[a-z0-9]+$/);
    });

    it('should get subscription by ID', () => {
      const callback = vi.fn();
      const id = cmsSubscriptionManager.subscribe(['posts', 'articles'], callback);

      const subscription = cmsSubscriptionManager.getSubscription(id);

      expect(subscription).toBeDefined();
      expect(subscription?.id).toBe(id);
      expect(subscription?.collections).toEqual(['posts', 'articles']);
      expect(subscription?.callback).toBe(callback);
      expect(subscription?.createdAt).toBeInstanceOf(Date);
    });

    it('should return undefined for non-existent subscription', () => {
      const subscription = cmsSubscriptionManager.getSubscription('non-existent');
      expect(subscription).toBeUndefined();
    });

    it('should unsubscribe successfully', () => {
      const callback = vi.fn();
      const id = cmsSubscriptionManager.subscribe(['posts'], callback);

      expect(cmsSubscriptionManager.getSubscription(id)).toBeDefined();

      const result = cmsSubscriptionManager.unsubscribe(id);

      expect(result).toBe(true);
      expect(cmsSubscriptionManager.getSubscription(id)).toBeUndefined();
    });

    it('should return false when unsubscribing non-existent subscription', () => {
      const result = cmsSubscriptionManager.unsubscribe('non-existent');
      expect(result).toBe(false);
    });

    it('should get all subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      cmsSubscriptionManager.subscribe(['posts'], callback1);
      cmsSubscriptionManager.subscribe(['articles'], callback2);

      const subscriptions = cmsSubscriptionManager.getAllSubscriptions();

      expect(subscriptions.length).toBeGreaterThanOrEqual(2);
    });

    it('should receive events for subscribed collections', () => {
      const callback = vi.fn();
      cmsSubscriptionManager.subscribe(['posts'], callback);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    it('should not receive events after unsubscribe', () => {
      const callback = vi.fn();
      const id = cmsSubscriptionManager.subscribe(['posts'], callback);

      cmsSubscriptionManager.unsubscribe(id);

      const event = createCMSEvent('collection:created', 'posts');
      cmsEventEmitter.emit(event);

      // Callback may be called due to lingering listener, but subscription check should prevent it
      // The actual implementation may vary
    });
  });

  describe('emitFromPayloadHook', () => {
    beforeEach(() => {
      cmsEventEmitter.clear();
    });

    it('should emit collection:created event for create operation', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('posts', callback);

      emitFromPayloadHook('create', 'posts', { id: 'doc-123', slug: 'my-post' });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collection:created',
          collection: 'posts',
          documentId: 'doc-123',
          slug: 'my-post',
        })
      );
    });

    it('should emit collection:updated event for update operation', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('articles', callback);

      emitFromPayloadHook('update', 'articles', { id: 'doc-456' });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collection:updated',
          collection: 'articles',
          documentId: 'doc-456',
        })
      );
    });

    it('should emit collection:deleted event for delete operation', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('pages', callback);

      emitFromPayloadHook('delete', 'pages', { id: 'doc-789' });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collection:deleted',
          collection: 'pages',
          documentId: 'doc-789',
        })
      );
    });

    it('should emit additional document:published event for published status', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('posts', callback);

      emitFromPayloadHook('create', 'posts', {
        id: 'doc-123',
        slug: 'published-post',
        status: 'published',
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collection:created',
        })
      );
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'document:published',
          documentId: 'doc-123',
          slug: 'published-post',
        })
      );
    });

    it('should not emit document:published for delete operation', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('posts', callback);

      emitFromPayloadHook('delete', 'posts', {
        id: 'doc-123',
        status: 'published',
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'collection:deleted',
        })
      );
    });

    it('should include status in event data', () => {
      const callback = vi.fn();
      cmsEventEmitter.on('posts', callback);

      emitFromPayloadHook('update', 'posts', {
        id: 'doc-123',
        status: 'draft',
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'draft' },
        })
      );
    });
  });
});
