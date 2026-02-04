/**
 * Event System Types
 *
 * Type definitions for the event-driven architecture
 */

/**
 * Event categories
 */
export type EventCategory =
  | 'lead'
  | 'organization'
  | 'member'
  | 'webhook'
  | 'diagnostic'
  | 'ai'
  | 'auth'
  | 'system';

/**
 * All event types
 */
export type EventType =
  // Lead events
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'lead.scored'
  | 'lead.converted'
  | 'lead.assigned'
  | 'lead.tagged'
  | 'lead.exported'
  // Organization events
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  | 'organization.settings.updated'
  // Member events
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role.changed'
  // Webhook events
  | 'webhook.created'
  | 'webhook.delivered'
  | 'webhook.failed'
  // Diagnostic events
  | 'diagnostic.submitted'
  | 'diagnostic.completed'
  // AI events
  | 'ai.scoring.started'
  | 'ai.scoring.completed'
  | 'ai.embedding.generated'
  // Auth events
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password.changed'
  // System events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error';

/**
 * Base event interface
 */
export interface BaseEvent<T = unknown> {
  /** Unique event ID */
  id: string;
  /** Event type */
  type: EventType;
  /** Event timestamp */
  timestamp: Date;
  /** Organization context */
  organizationId?: string;
  /** User who triggered the event */
  userId?: string;
  /** Event payload */
  payload: T;
  /** Event metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Event handler function
 */
export type EventHandler<T = unknown> = (event: BaseEvent<T>) => Promise<void> | void;

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string;
  type: EventType | EventType[];
  handler: EventHandler;
  priority?: number;
  once?: boolean;
}

/**
 * Event emitter options
 */
export interface EmitOptions {
  /** Organization context */
  organizationId?: string;
  /** User context */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Delay before processing (milliseconds) */
  delay?: number;
  /** Whether to wait for all handlers to complete */
  sync?: boolean;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
  /** Maximum listeners per event */
  maxListeners?: number;
  /** Whether to catch and log handler errors */
  catchErrors?: boolean;
  /** Default timeout for handlers (ms) */
  handlerTimeout?: number;
}

/**
 * Event history entry
 */
export interface EventHistoryEntry {
  event: BaseEvent;
  handledAt: Date;
  handlers: string[];
  errors?: string[];
}

// Payload types for specific events

export interface LeadCreatedPayload {
  leadId: string;
  email?: string;
  source?: string;
}

export interface LeadUpdatedPayload {
  leadId: string;
  changes: Record<string, { before: unknown; after: unknown }>;
}

export interface LeadScoredPayload {
  leadId: string;
  score: number;
  previousScore?: number;
  factors?: string[];
}

export interface LeadConvertedPayload {
  leadId: string;
  convertedTo: string;
  conversionValue?: number;
}

export interface MemberInvitedPayload {
  email: string;
  role: string;
  invitedBy: string;
}

export interface WebhookDeliveredPayload {
  webhookId: string;
  url: string;
  statusCode: number;
  duration: number;
}

export interface DiagnosticSubmittedPayload {
  diagnosticId: string;
  formId: string;
  responses: Record<string, unknown>;
}

/**
 * Event type to payload mapping
 */
export interface EventPayloadMap {
  'lead.created': LeadCreatedPayload;
  'lead.updated': LeadUpdatedPayload;
  'lead.scored': LeadScoredPayload;
  'lead.converted': LeadConvertedPayload;
  'member.invited': MemberInvitedPayload;
  'webhook.delivered': WebhookDeliveredPayload;
  'diagnostic.submitted': DiagnosticSubmittedPayload;
  [key: string]: unknown;
}
