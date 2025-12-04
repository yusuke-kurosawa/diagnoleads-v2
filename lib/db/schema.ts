import { relations } from 'drizzle-orm';
import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Custom PostgreSQL types for AI features
 */
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value.replace(/\{|\}/g, (m) => (m === '{' ? '[' : ']')));
  },
});

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * Custom PostgreSQL ltree type for hierarchical data
 * Used for efficient ancestor/descendant queries
 */
const ltree = customType<{ data: string }>({
  dataType() {
    return 'ltree';
  },
});

/**
 * Organization Type
 * Defines the role of an organization in a hierarchy
 */
export type OrganizationType = 'holding' | 'subsidiary' | 'independent';

/**
 * Data Sharing Policy
 * Controls cross-organization data access
 */
export interface DataSharingPolicy {
  /** Allow parent organization to access this organization's data */
  allowParentAccess: boolean;
  /** Allow child organizations to access this organization's data */
  allowChildAccess: boolean;
  /** Allow sibling organizations (same parent) to access data */
  allowSiblingAccess: boolean;
  /** Specific fields that are shared (empty = all fields) */
  sharedFields?: string[];
}

/**
 * Organizations (Tenants)
 * Core multi-tenant table - all data is scoped to an organization
 *
 * 🏢 CORE COMPETENCE: Hierarchical Organization Support
 * Supports holding companies, group companies, and M&A scenarios.
 *
 * Hierarchy Features:
 *   - parent_organization_id: Link to parent company
 *   - organization_type: 'holding' | 'subsidiary' | 'independent'
 *   - hierarchy_path: ltree for efficient ancestor/descendant queries
 *   - hierarchy_level: 0=root, 1=child, 2=grandchild, etc.
 *   - group_id: Top-level organization ID for group-wide queries
 *   - data_sharing_policy: Cross-organization access control
 *
 * See: docs/MULTI_TENANT_STRATEGY.md for detailed architecture
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings').$type<Record<string, unknown>>().default({}),

  // 🏢 Hierarchy fields (Phase 2.7)
  /** Parent organization ID (null for root/independent organizations) */
  parentOrganizationId: uuid('parent_organization_id'),
  /** Organization type in hierarchy */
  organizationType: text('organization_type')
    .$type<OrganizationType>()
    .default('independent')
    .notNull(),
  /** Hierarchy path for efficient tree queries (e.g., 'root.child.grandchild') */
  hierarchyPath: ltree('hierarchy_path'),
  /** Level in hierarchy (0 = root, 1 = child, etc.) */
  hierarchyLevel: integer('hierarchy_level').default(0).notNull(),
  /** Group identifier (ID of the root organization in the group) */
  groupId: uuid('group_id'),
  /** Data sharing policy for cross-organization access */
  dataSharingPolicy: jsonb('data_sharing_policy').$type<DataSharingPolicy>().default({
    allowParentAccess: false,
    allowChildAccess: false,
    allowSiblingAccess: false,
  }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Users
 * Authentication and user profile information
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Organization Member Role
 * Extended roles supporting hierarchical organization access
 */
export type OrganizationRole =
  | 'owner' // Full control of the organization
  | 'admin' // Admin access to the organization
  | 'member' // Standard member access
  | 'group_owner' // Full control of entire group (all descendant orgs)
  | 'group_admin' // Read access to entire group
  | 'parent_viewer'; // Read-only access to child organizations

/**
 * Organization Members
 * Maps users to organizations with roles
 *
 * Role Hierarchy:
 * - owner: Full control of single organization
 * - admin: Admin access to single organization
 * - member: Standard member access
 * - group_owner: Full control of group (holding company owner)
 * - group_admin: Read access to entire group
 * - parent_viewer: Read-only access to child orgs (for parent company users)
 */
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').$type<OrganizationRole>().notNull().default('member'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Accounts
 * OAuth and credential accounts for BetterAuth
 * Required for email/password authentication
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(), // 'credential', 'google', 'github', etc.
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'), // Hashed password for credential provider

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Verification
 * Email verification and password reset tokens
 */
export const verification = pgTable('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(), // email address
  value: text('value').notNull(), // verification token
  expiresAt: timestamp('expires_at').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Sessions
 * User authentication sessions managed by BetterAuth
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Leads
 * Core business entity - diagnostic form submissions
 */
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Contact information
  email: text('email').notNull(),
  name: text('name'),
  company: text('company'),
  phone: text('phone'),

  // Lead metadata
  status: text('status').notNull().default('new'), // 'new', 'contacted', 'qualified', 'converted'
  score: integer('score'),
  source: text('source'), // 'website', 'embed', 'api'

  // Assessment data
  responses: jsonb('responses').$type<Record<string, unknown>>().default({}),

  // AI features (Phase 3)
  embedding: vector('embedding'), // OpenAI text-embedding-3-small (1536 dimensions)
  searchVector: tsvector('search_vector'), // Full-text search vector (generated)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Relations
 */
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  members: many(organizationMembers),
  leads: many(leads),
  // 🏢 Hierarchy relations
  parentOrganization: one(organizations, {
    fields: [organizations.parentOrganizationId],
    references: [organizations.id],
    relationName: 'parentChild',
  }),
  childOrganizations: many(organizations, {
    relationName: 'parentChild',
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leads.organizationId],
    references: [organizations.id],
  }),
  leadTags: many(leadTags),
  comments: many(leadComments),
}));

/**
 * Type exports for use in the application
 */
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

// Note: OrganizationType and DataSharingPolicy are already exported above at definition

/**
 * Organization with hierarchy info (for queries that include parent/children)
 */
export type OrganizationWithHierarchy = Organization & {
  parentOrganization?: Organization | null;
  childOrganizations?: Organization[];
};

// ============================================================================
// Phase 5: Webhook & Integration Tables
// ============================================================================

/**
 * Webhook Event Types
 */
export type WebhookEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'lead.status_changed'
  | 'lead.scored'
  | 'diagnostic.submitted'
  | 'diagnostic.completed'
  | 'organization.member_added'
  | 'organization.member_removed'
  | 'blog.published'
  | 'faq.published';

/**
 * Webhook Status
 */
export type WebhookStatus = 'active' | 'inactive' | 'failed';

/**
 * Webhook Delivery Status
 */
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed';

/**
 * Webhook Retry Configuration
 */
export interface WebhookRetryConfig {
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Webhooks Table
 * Stores webhook configurations for each organization
 */
export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').$type<WebhookEventType[]>().notNull(),
  status: text('status').$type<WebhookStatus>().default('active').notNull(),
  headers: jsonb('headers').$type<Record<string, string>>().default({}),
  retryConfig: jsonb('retry_config').$type<WebhookRetryConfig>().default({
    maxRetries: 3,
    retryDelayMs: 5000,
  }),
  lastTriggeredAt: timestamp('last_triggered_at'),
  failureCount: integer('failure_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Webhook Deliveries Table
 * Stores delivery logs for each webhook event
 */
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  webhookId: uuid('webhook_id')
    .notNull()
    .references(() => webhooks.id, { onDelete: 'cascade' }),
  eventType: text('event_type').$type<WebhookEventType>().notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  status: text('status').$type<WebhookDeliveryStatus>().default('pending').notNull(),
  statusCode: integer('status_code'),
  response: text('response'),
  error: text('error'),
  attempts: integer('attempts').default(0).notNull(),
  nextRetryAt: timestamp('next_retry_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

/**
 * Webhook Relations
 */
export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhooks.organizationId],
    references: [organizations.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

/**
 * Webhook Type Exports
 */
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Notification Type
 */
export type NotificationType =
  | 'lead_created'
  | 'lead_status_changed'
  | 'lead_scored'
  | 'import_completed'
  | 'export_completed'
  | 'member_invited'
  | 'member_removed'
  | 'system';

/**
 * Notifications Table
 * Stores in-app notifications for users
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  type: text('type').$type<NotificationType>().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: jsonb('data').$type<Record<string, unknown>>(),
  read: boolean('read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Notification Preferences Table
 * User preferences for notification channels and types
 */
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // In-app notifications
  inAppLeadCreated: boolean('in_app_lead_created').default(true).notNull(),
  inAppLeadStatusChanged: boolean('in_app_lead_status_changed').default(true).notNull(),
  inAppLeadScored: boolean('in_app_lead_scored').default(true).notNull(),
  inAppImportExport: boolean('in_app_import_export').default(true).notNull(),
  inAppMemberChanges: boolean('in_app_member_changes').default(true).notNull(),
  // Email notifications
  emailLeadCreated: boolean('email_lead_created').default(false).notNull(),
  emailLeadStatusChanged: boolean('email_lead_status_changed').default(false).notNull(),
  emailLeadScored: boolean('email_lead_scored').default(false).notNull(),
  emailDailyDigest: boolean('email_daily_digest').default(false).notNull(),
  emailWeeklyReport: boolean('email_weekly_report').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Notification Relations
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [notificationPreferences.organizationId],
    references: [organizations.id],
  }),
}));

/**
 * Notification Type Exports
 */
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

// ============================================
// Tags (Phase 9 - P1 Features)
// ============================================

/**
 * Tags for categorizing leads
 * Organization-scoped tags with customizable colors
 */
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#3b82f6'), // Default blue
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Lead-Tag junction table (many-to-many)
 */
export const leadTags = pgTable('lead_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tags.organizationId],
    references: [organizations.id],
  }),
  leadTags: many(leadTags),
}));

export const leadTagsRelations = relations(leadTags, ({ one }) => ({
  lead: one(leads, {
    fields: [leadTags.leadId],
    references: [leads.id],
  }),
  tag: one(tags, {
    fields: [leadTags.tagId],
    references: [tags.id],
  }),
}));

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type LeadTag = typeof leadTags.$inferSelect;
export type NewLeadTag = typeof leadTags.$inferInsert;

// ============================================================================
// Lead Comments / Notes Feature
// ============================================================================

/**
 * Comment Type
 * Distinguishes between different types of comments
 */
export type CommentType = 'comment' | 'note' | 'activity';

/**
 * Lead Comments Table
 * Stores comments, notes, and activity logs for leads
 */
export const leadComments = pgTable('lead_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  type: text('type').$type<CommentType>().default('comment').notNull(),
  /** For activity logs - stores metadata about the activity */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  /** Parent comment ID for threaded replies */
  parentId: uuid('parent_id'),
  /** Whether this comment is pinned */
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Lead Comments Relations
 */
export const leadCommentsRelations = relations(leadComments, ({ one, many }) => ({
  lead: one(leads, {
    fields: [leadComments.leadId],
    references: [leads.id],
  }),
  user: one(users, {
    fields: [leadComments.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [leadComments.organizationId],
    references: [organizations.id],
  }),
  parent: one(leadComments, {
    fields: [leadComments.parentId],
    references: [leadComments.id],
    relationName: 'replies',
  }),
  replies: many(leadComments, {
    relationName: 'replies',
  }),
}));

export type LeadComment = typeof leadComments.$inferSelect;
export type NewLeadComment = typeof leadComments.$inferInsert;

// ============================================================================
// Scheduled Reports Feature
// ============================================================================

/**
 * Report Schedule Frequency
 */
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/**
 * Report Type
 */
export type ReportType =
  | 'lead_summary'
  | 'conversion_analysis'
  | 'source_performance'
  | 'team_performance'
  | 'custom';

/**
 * Report Format
 */
export type ReportFormat = 'pdf' | 'csv' | 'excel';

/**
 * Report Status
 */
export type ReportStatus = 'active' | 'paused' | 'disabled';

/**
 * Report Delivery Status
 */
export type ReportDeliveryStatus = 'pending' | 'sent' | 'failed';

/**
 * Report Configuration
 */
export interface ReportConfig {
  /** Include lead status breakdown */
  includeStatusBreakdown?: boolean;
  /** Include source analysis */
  includeSourceAnalysis?: boolean;
  /** Include conversion funnel */
  includeConversionFunnel?: boolean;
  /** Include score distribution */
  includeScoreDistribution?: boolean;
  /** Include recent leads list */
  includeRecentLeads?: boolean;
  /** Number of recent leads to include */
  recentLeadsCount?: number;
  /** Date range for the report (days) */
  dateRangeDays?: number;
  /** Custom filters */
  filters?: {
    status?: string[];
    source?: string[];
    minScore?: number;
    maxScore?: number;
  };
}

/**
 * Scheduled Reports Table
 * Stores report schedule configurations
 */
export const scheduledReports = pgTable('scheduled_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  reportType: text('report_type').$type<ReportType>().default('lead_summary').notNull(),
  frequency: text('frequency').$type<ReportFrequency>().default('weekly').notNull(),
  /** Day of week for weekly reports (0=Sunday, 6=Saturday) */
  dayOfWeek: integer('day_of_week').default(1), // Monday
  /** Day of month for monthly reports (1-28) */
  dayOfMonth: integer('day_of_month').default(1),
  /** Hour to send the report (0-23) */
  sendHour: integer('send_hour').default(9).notNull(),
  /** Timezone for scheduling */
  timezone: text('timezone').default('Asia/Tokyo').notNull(),
  format: text('format').$type<ReportFormat>().default('pdf').notNull(),
  /** Email recipients (comma-separated) */
  recipients: text('recipients').notNull(),
  /** Report configuration */
  config: jsonb('config').$type<ReportConfig>().default({
    includeStatusBreakdown: true,
    includeSourceAnalysis: true,
    includeConversionFunnel: true,
    dateRangeDays: 30,
  }),
  status: text('status').$type<ReportStatus>().default('active').notNull(),
  lastSentAt: timestamp('last_sent_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Report History Table
 * Stores history of generated reports
 */
export const reportHistory = pgTable('report_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  scheduledReportId: uuid('scheduled_report_id')
    .notNull()
    .references(() => scheduledReports.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Report period start date */
  periodStart: timestamp('period_start').notNull(),
  /** Report period end date */
  periodEnd: timestamp('period_end').notNull(),
  /** Number of leads in the report */
  leadCount: integer('lead_count').default(0).notNull(),
  /** Summary statistics stored as JSON */
  summary: jsonb('summary').$type<Record<string, unknown>>(),
  deliveryStatus: text('delivery_status')
    .$type<ReportDeliveryStatus>()
    .default('pending')
    .notNull(),
  /** Error message if delivery failed */
  errorMessage: text('error_message'),
  /** File URL if stored */
  fileUrl: text('file_url'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Scheduled Reports Relations
 */
export const scheduledReportsRelations = relations(scheduledReports, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [scheduledReports.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [scheduledReports.createdById],
    references: [users.id],
  }),
  history: many(reportHistory),
}));

/**
 * Report History Relations
 */
export const reportHistoryRelations = relations(reportHistory, ({ one }) => ({
  scheduledReport: one(scheduledReports, {
    fields: [reportHistory.scheduledReportId],
    references: [scheduledReports.id],
  }),
  organization: one(organizations, {
    fields: [reportHistory.organizationId],
    references: [organizations.id],
  }),
}));

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type NewScheduledReport = typeof scheduledReports.$inferInsert;
export type ReportHistory = typeof reportHistory.$inferSelect;
export type NewReportHistory = typeof reportHistory.$inferInsert;
