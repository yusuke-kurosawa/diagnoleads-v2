/**
 * Realtime Tests
 *
 * Unit tests for the realtime notification system
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RealtimeHub,
  createRealtimeHub,
  getRealtimeHub,
  resetRealtimeHub,
  broadcast,
  sendToUser,
  sendToOrganization,
} from '@/lib/realtime/hub';
import { createTestConnection, formatSSEEvent, parseSSEData } from '@/lib/realtime/sse';
import { CHANNELS, MESSAGE_TYPES } from '@/lib/realtime/types';
import type { RealtimeMessage } from '@/lib/realtime/types';

describe('RealtimeHub', () => {
  let hub: RealtimeHub;

  beforeEach(() => {
    resetRealtimeHub();
    hub = createRealtimeHub();
  });

  afterEach(() => {
    hub.clear();
  });

  describe('addConnection', () => {
    it('should add a connection', () => {
      const { connection } = createTestConnection({ userId: 'user-1' });
      hub.addConnection(connection);

      expect(hub.getConnection(connection.id)).toBeDefined();
    });

    it('should auto-subscribe to user channel', () => {
      const { connection, messages } = createTestConnection({ userId: 'user-1' });
      hub.addConnection(connection);

      expect(connection.channels.has(CHANNELS.user('user-1'))).toBe(true);
    });

    it('should auto-subscribe to organization channel', () => {
      const { connection } = createTestConnection({
        userId: 'user-1',
        organizationId: 'org-1',
      });
      hub.addConnection(connection);

      expect(connection.channels.has(CHANNELS.organization('org-1'))).toBe(true);
    });

    it('should send connected message', () => {
      const { connection, messages } = createTestConnection({ userId: 'user-1' });
      hub.addConnection(connection);

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe(MESSAGE_TYPES.CONNECTED);
    });
  });

  describe('removeConnection', () => {
    it('should remove a connection', () => {
      const { connection } = createTestConnection({ userId: 'user-1' });
      hub.addConnection(connection);
      hub.removeConnection(connection.id);

      expect(hub.getConnection(connection.id)).toBeUndefined();
    });

    it('should unsubscribe from all channels', () => {
      const { connection } = createTestConnection({ userId: 'user-1' });
      hub.addConnection(connection);
      hub.subscribe(connection.id, 'custom-channel');

      hub.removeConnection(connection.id);

      // Verify channels are cleaned up
      expect(hub.getStats().channelSubscriptions).toBe(0);
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should subscribe to a channel', () => {
      const { connection } = createTestConnection({});
      hub.addConnection(connection);

      hub.subscribe(connection.id, 'custom-channel');

      expect(connection.channels.has('custom-channel')).toBe(true);
    });

    it('should unsubscribe from a channel', () => {
      const { connection } = createTestConnection({});
      hub.addConnection(connection);
      hub.subscribe(connection.id, 'custom-channel');

      hub.unsubscribe(connection.id, 'custom-channel');

      expect(connection.channels.has('custom-channel')).toBe(false);
    });
  });

  describe('broadcast', () => {
    it('should broadcast to all connections', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({});
      const { connection: conn2, messages: msgs2 } = createTestConnection({});

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.broadcast('test', { data: 'hello' });

      // Each gets connected message + broadcast
      expect(msgs1.filter((m) => m.type === 'test')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'test')).toHaveLength(1);
    });

    it('should broadcast to specific organization', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({
        organizationId: 'org-1',
      });
      const { connection: conn2, messages: msgs2 } = createTestConnection({
        organizationId: 'org-2',
      });

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.broadcast('test', { data: 'hello' }, { organizationId: 'org-1' });

      expect(msgs1.filter((m) => m.type === 'test')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'test')).toHaveLength(0);
    });

    it('should exclude specified connections', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({});
      const { connection: conn2, messages: msgs2 } = createTestConnection({});

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.broadcast('test', { data: 'hello' }, { excludeConnections: [conn1.id] });

      expect(msgs1.filter((m) => m.type === 'test')).toHaveLength(0);
      expect(msgs2.filter((m) => m.type === 'test')).toHaveLength(1);
    });
  });

  describe('sendToChannel', () => {
    it('should send to channel subscribers', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({});
      const { connection: conn2, messages: msgs2 } = createTestConnection({});

      hub.addConnection(conn1);
      hub.addConnection(conn2);
      hub.subscribe(conn1.id, 'custom-channel');

      hub.sendToChannel('custom-channel', 'test', { data: 'hello' });

      expect(msgs1.filter((m) => m.type === 'test')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'test')).toHaveLength(0);
    });
  });

  describe('sendToUser', () => {
    it('should send to user connections', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({
        userId: 'user-1',
      });
      const { connection: conn2, messages: msgs2 } = createTestConnection({
        userId: 'user-2',
      });

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.sendToUser('user-1', 'notification', { message: 'Hello' });

      expect(msgs1.filter((m) => m.type === 'notification')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'notification')).toHaveLength(0);
    });

    it('should send to multiple connections of same user', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({
        userId: 'user-1',
      });
      const { connection: conn2, messages: msgs2 } = createTestConnection({
        userId: 'user-1',
      });

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.sendToUser('user-1', 'notification', { message: 'Hello' });

      expect(msgs1.filter((m) => m.type === 'notification')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'notification')).toHaveLength(1);
    });
  });

  describe('sendToOrganization', () => {
    it('should send to organization connections', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({
        organizationId: 'org-1',
      });
      const { connection: conn2, messages: msgs2 } = createTestConnection({
        organizationId: 'org-2',
      });

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.sendToOrganization('org-1', 'update', { data: 'test' });

      expect(msgs1.filter((m) => m.type === 'update')).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === 'update')).toHaveLength(0);
    });
  });

  describe('heartbeat', () => {
    it('should send heartbeat to all connections', () => {
      const { connection: conn1, messages: msgs1 } = createTestConnection({});
      const { connection: conn2, messages: msgs2 } = createTestConnection({});

      hub.addConnection(conn1);
      hub.addConnection(conn2);

      hub.heartbeat();

      expect(msgs1.filter((m) => m.type === MESSAGE_TYPES.HEARTBEAT)).toHaveLength(1);
      expect(msgs2.filter((m) => m.type === MESSAGE_TYPES.HEARTBEAT)).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      hub.addConnection(createTestConnection({ organizationId: 'org-1' }).connection);
      hub.addConnection(createTestConnection({ organizationId: 'org-1' }).connection);
      hub.addConnection(createTestConnection({ organizationId: 'org-2' }).connection);

      const stats = hub.getStats();

      expect(stats.totalConnections).toBe(3);
      expect(stats.connectionsByOrganization['org-1']).toBe(2);
      expect(stats.connectionsByOrganization['org-2']).toBe(1);
    });

    it('should track message count', () => {
      const { connection } = createTestConnection({});
      hub.addConnection(connection);

      hub.broadcast('test1', {});
      hub.broadcast('test2', {});

      const stats = hub.getStats();
      expect(stats.messagesSent).toBeGreaterThanOrEqual(3); // connected + 2 broadcasts
    });
  });

  describe('cleanup', () => {
    it('should remove stale connections', () => {
      const { connection } = createTestConnection({});
      hub.addConnection(connection);

      // Set last activity to past
      connection.lastActivity = new Date(Date.now() - 10 * 60 * 1000);

      const cleaned = hub.cleanup(5 * 60 * 1000);

      expect(cleaned).toBe(1);
      expect(hub.getConnection(connection.id)).toBeUndefined();
    });

    it('should keep active connections', () => {
      const { connection } = createTestConnection({});
      hub.addConnection(connection);

      const cleaned = hub.cleanup(5 * 60 * 1000);

      expect(cleaned).toBe(0);
      expect(hub.getConnection(connection.id)).toBeDefined();
    });
  });
});

describe('Default RealtimeHub', () => {
  beforeEach(() => {
    resetRealtimeHub();
  });

  afterEach(() => {
    resetRealtimeHub();
  });

  it('should return singleton instance', () => {
    const hub1 = getRealtimeHub();
    const hub2 = getRealtimeHub();

    expect(hub1).toBe(hub2);
  });

  it('should work with convenience functions', () => {
    const hub = getRealtimeHub();
    const { connection, messages } = createTestConnection({ userId: 'user-1' });

    hub.addConnection(connection);

    sendToUser('user-1', 'test', { data: 'hello' });

    expect(messages.filter((m) => m.type === 'test')).toHaveLength(1);
  });
});

describe('SSE Utilities', () => {
  describe('createTestConnection', () => {
    it('should create a test connection', () => {
      const { connection, messages, close } = createTestConnection({
        id: 'test-conn',
        userId: 'user-1',
      });

      expect(connection.id).toBe('test-conn');
      expect(connection.userId).toBe('user-1');
      expect(messages).toHaveLength(0);
    });

    it('should collect sent messages', () => {
      const { connection, messages } = createTestConnection({});

      connection.send({
        id: 'msg-1',
        type: 'test',
        channel: 'test',
        payload: {},
        timestamp: new Date(),
      });

      expect(messages).toHaveLength(1);
    });

    it('should stop collecting after close', () => {
      const { connection, messages, close } = createTestConnection({});

      close();

      connection.send({
        id: 'msg-1',
        type: 'test',
        channel: 'test',
        payload: {},
        timestamp: new Date(),
      });

      expect(messages).toHaveLength(0);
    });
  });

  describe('parseSSEData', () => {
    it('should parse valid SSE data', () => {
      const message: RealtimeMessage = {
        id: 'msg-1',
        type: 'test',
        channel: 'test',
        payload: { data: 'hello' },
        timestamp: new Date(),
      };

      const parsed = parseSSEData(JSON.stringify(message));

      expect(parsed?.id).toBe('msg-1');
      expect(parsed?.type).toBe('test');
    });

    it('should return null for invalid data', () => {
      const parsed = parseSSEData('not json');
      expect(parsed).toBeNull();
    });
  });

  describe('formatSSEEvent', () => {
    it('should format message as SSE event', () => {
      const message: RealtimeMessage = {
        id: 'msg-1',
        type: 'notification',
        channel: 'user:1',
        payload: { message: 'Hello' },
        timestamp: new Date(),
      };

      const formatted = formatSSEEvent(message);

      expect(formatted).toContain('event: notification');
      expect(formatted).toContain('data:');
      expect(formatted).toContain('id: msg-1');
    });
  });
});

describe('Channel Helpers', () => {
  it('should generate correct channel names', () => {
    expect(CHANNELS.user('user-1')).toBe('user:user-1');
    expect(CHANNELS.organization('org-1')).toBe('org:org-1');
    expect(CHANNELS.lead('org-1', 'lead-1')).toBe('org:org-1:lead:lead-1');
    expect(CHANNELS.broadcast()).toBe('broadcast');
  });
});
