/**
 * Realtime Hub
 *
 * Central hub for managing SSE connections and broadcasting messages
 */

import type { BroadcastOptions, RealtimeMessage, RealtimeStats, SSEConnection } from './types';
import { CHANNELS, MESSAGE_TYPES } from './types';

/**
 * Realtime Hub for SSE connections
 */
export class RealtimeHub {
  private connections = new Map<string, SSEConnection>();
  private channelSubscriptions = new Map<string, Set<string>>();
  private messageCount = 0;
  private messageTimestamps: number[] = [];

  /**
   * Add a new connection
   */
  addConnection(connection: SSEConnection): void {
    this.connections.set(connection.id, connection);

    // Subscribe to user channel if authenticated
    if (connection.userId) {
      this.subscribe(connection.id, CHANNELS.user(connection.userId));
    }

    // Subscribe to organization channel
    if (connection.organizationId) {
      this.subscribe(connection.id, CHANNELS.organization(connection.organizationId));
    }

    // Subscribe to broadcast channel
    this.subscribe(connection.id, CHANNELS.broadcast());

    // Send connected message
    this.sendToConnection(connection.id, {
      id: this.generateId(),
      type: MESSAGE_TYPES.CONNECTED,
      channel: 'system',
      payload: { connectionId: connection.id },
      timestamp: new Date(),
    });
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Unsubscribe from all channels
    for (const channel of connection.channels) {
      this.unsubscribe(connectionId, channel);
    }

    connection.close();
    this.connections.delete(connectionId);
  }

  /**
   * Subscribe connection to a channel
   */
  subscribe(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    connection.channels.add(channel);

    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
    }
    this.channelSubscriptions.get(channel)!.add(connectionId);
  }

  /**
   * Unsubscribe connection from a channel
   */
  unsubscribe(connectionId: string, channel: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.channels.delete(channel);
    }

    const subscribers = this.channelSubscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.channelSubscriptions.delete(channel);
      }
    }
  }

  /**
   * Broadcast a message
   */
  broadcast<T>(type: string, payload: T, options: BroadcastOptions = {}): void {
    const message: RealtimeMessage<T> = {
      id: this.generateId(),
      type,
      channel: options.channel ?? CHANNELS.broadcast(),
      payload,
      timestamp: new Date(),
      priority: options.priority,
      category: options.category,
    };

    const targetConnections = this.getTargetConnections(options);

    for (const connectionId of targetConnections) {
      if (options.excludeConnections?.includes(connectionId)) {
        continue;
      }
      this.sendToConnection(connectionId, message);
    }
  }

  /**
   * Send message to a specific channel
   */
  sendToChannel<T>(channel: string, type: string, payload: T): void {
    const subscribers = this.channelSubscriptions.get(channel);
    if (!subscribers) return;

    const message: RealtimeMessage<T> = {
      id: this.generateId(),
      type,
      channel,
      payload,
      timestamp: new Date(),
    };

    for (const connectionId of subscribers) {
      this.sendToConnection(connectionId, message);
    }
  }

  /**
   * Send message to a specific user
   */
  sendToUser<T>(userId: string, type: string, payload: T): void {
    this.sendToChannel(CHANNELS.user(userId), type, payload);
  }

  /**
   * Send message to an organization
   */
  sendToOrganization<T>(organizationId: string, type: string, payload: T): void {
    this.sendToChannel(CHANNELS.organization(organizationId), type, payload);
  }

  /**
   * Send message to a specific connection
   */
  sendToConnection<T>(connectionId: string, message: RealtimeMessage<T>): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) return false;

    try {
      connection.send(message);
      connection.lastActivity = new Date();
      this.recordMessage();
      return true;
    } catch (error) {
      console.error(`Failed to send to connection ${connectionId}:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Send heartbeat to all connections
   */
  heartbeat(): void {
    const message: RealtimeMessage = {
      id: this.generateId(),
      type: MESSAGE_TYPES.HEARTBEAT,
      channel: 'system',
      payload: { timestamp: Date.now() },
      timestamp: new Date(),
    };

    for (const connectionId of this.connections.keys()) {
      this.sendToConnection(connectionId, message);
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): SSEConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get connections for a user
   */
  getConnectionsForUser(userId: string): SSEConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.userId === userId);
  }

  /**
   * Get connections for an organization
   */
  getConnectionsForOrganization(organizationId: string): SSEConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.organizationId === organizationId);
  }

  /**
   * Get all connection IDs
   */
  getConnectionIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get stats
   */
  getStats(): RealtimeStats {
    const connectionsByOrganization: Record<string, number> = {};

    for (const connection of this.connections.values()) {
      if (connection.organizationId) {
        connectionsByOrganization[connection.organizationId] =
          (connectionsByOrganization[connection.organizationId] ?? 0) + 1;
      }
    }

    // Calculate messages per second (last 60 seconds)
    const now = Date.now();
    const recentMessages = this.messageTimestamps.filter((t) => now - t < 60000);
    const messagesPerSecond = recentMessages.length / 60;

    return {
      totalConnections: this.connections.size,
      connectionsByOrganization,
      channelSubscriptions: this.channelSubscriptions.size,
      messagesSent: this.messageCount,
      messagesPerSecond,
    };
  }

  /**
   * Cleanup stale connections
   */
  cleanup(maxIdleMs = 5 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastActivity.getTime() > maxIdleMs) {
        this.removeConnection(connectionId);
        cleaned++;
      }
    }

    // Cleanup old message timestamps
    this.messageTimestamps = this.messageTimestamps.filter((t) => now - t < 60000);

    return cleaned;
  }

  /**
   * Clear all connections (for testing)
   */
  clear(): void {
    for (const connectionId of Array.from(this.connections.keys())) {
      this.removeConnection(connectionId);
    }
    this.channelSubscriptions.clear();
    this.messageCount = 0;
    this.messageTimestamps = [];
  }

  private getTargetConnections(options: BroadcastOptions): string[] {
    // If specific channel, use channel subscribers
    if (options.channel) {
      return Array.from(this.channelSubscriptions.get(options.channel) ?? []);
    }

    // If specific user
    if (options.userId) {
      return this.getConnectionsForUser(options.userId).map((c) => c.id);
    }

    // If specific organization
    if (options.organizationId) {
      return this.getConnectionsForOrganization(options.organizationId).map((c) => c.id);
    }

    // Broadcast to all
    return Array.from(this.connections.keys());
  }

  private recordMessage(): void {
    this.messageCount++;
    this.messageTimestamps.push(Date.now());
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Default hub instance
let defaultHub: RealtimeHub | null = null;

/**
 * Get the default realtime hub
 */
export function getRealtimeHub(): RealtimeHub {
  if (!defaultHub) {
    defaultHub = new RealtimeHub();
  }
  return defaultHub;
}

/**
 * Create a new realtime hub
 */
export function createRealtimeHub(): RealtimeHub {
  return new RealtimeHub();
}

/**
 * Reset the default hub (for testing)
 */
export function resetRealtimeHub(): void {
  if (defaultHub) {
    defaultHub.clear();
  }
  defaultHub = null;
}

// Convenience functions

/**
 * Broadcast a message using the default hub
 */
export function broadcast<T>(type: string, payload: T, options?: BroadcastOptions): void {
  getRealtimeHub().broadcast(type, payload, options);
}

/**
 * Send to a user using the default hub
 */
export function sendToUser<T>(userId: string, type: string, payload: T): void {
  getRealtimeHub().sendToUser(userId, type, payload);
}

/**
 * Send to an organization using the default hub
 */
export function sendToOrganization<T>(organizationId: string, type: string, payload: T): void {
  getRealtimeHub().sendToOrganization(organizationId, type, payload);
}
