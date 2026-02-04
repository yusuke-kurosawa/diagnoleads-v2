/**
 * Realtime Types
 *
 * Type definitions for real-time notifications
 */

/**
 * Notification channel types
 */
export type ChannelType = 'user' | 'organization' | 'broadcast';

/**
 * Notification priority
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification category
 */
export type NotificationCategory =
  | 'lead'
  | 'organization'
  | 'member'
  | 'system'
  | 'alert'
  | 'update'
  | 'message';

/**
 * Realtime message
 */
export interface RealtimeMessage<T = unknown> {
  id: string;
  type: string;
  channel: string;
  payload: T;
  timestamp: Date;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  metadata?: Record<string, unknown>;
}

/**
 * SSE connection
 */
export interface SSEConnection {
  id: string;
  userId?: string;
  organizationId?: string;
  channels: Set<string>;
  createdAt: Date;
  lastActivity: Date;
  send: (message: RealtimeMessage) => void;
  close: () => void;
}

/**
 * Channel subscription
 */
export interface ChannelSubscription {
  channel: string;
  connectionId: string;
  subscribedAt: Date;
}

/**
 * Notification payload types
 */
export interface LeadNotificationPayload {
  leadId: string;
  action: 'created' | 'updated' | 'scored' | 'assigned';
  leadName?: string;
  changes?: Record<string, unknown>;
}

export interface MemberNotificationPayload {
  memberId: string;
  action: 'invited' | 'joined' | 'removed';
  memberName?: string;
  role?: string;
}

export interface SystemNotificationPayload {
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
}

export interface AlertNotificationPayload {
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source?: string;
}

/**
 * Broadcast options
 */
export interface BroadcastOptions {
  /** Target organization */
  organizationId?: string;
  /** Target user */
  userId?: string;
  /** Target channel */
  channel?: string;
  /** Notification priority */
  priority?: NotificationPriority;
  /** Notification category */
  category?: NotificationCategory;
  /** Exclude connections */
  excludeConnections?: string[];
}

/**
 * Connection stats
 */
export interface RealtimeStats {
  totalConnections: number;
  connectionsByOrganization: Record<string, number>;
  channelSubscriptions: number;
  messagesSent: number;
  messagesPerSecond: number;
}

/**
 * Channel helpers
 */
export const CHANNELS = {
  user: (userId: string) => `user:${userId}`,
  organization: (orgId: string) => `org:${orgId}`,
  lead: (orgId: string, leadId: string) => `org:${orgId}:lead:${leadId}`,
  broadcast: () => 'broadcast',
} as const;

/**
 * Message types
 */
export const MESSAGE_TYPES = {
  // Lead
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_SCORED: 'lead.scored',
  LEAD_ASSIGNED: 'lead.assigned',
  // Member
  MEMBER_INVITED: 'member.invited',
  MEMBER_JOINED: 'member.joined',
  // System
  NOTIFICATION: 'notification',
  ALERT: 'alert',
  // Connection
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat',
} as const;
