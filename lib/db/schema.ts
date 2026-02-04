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

  // Custom fields data (Phase 9 P1)
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),

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

// ============================================================================
// Workflow Automation Feature
// ============================================================================

/**
 * Workflow Trigger Type
 * When the workflow should be triggered
 */
export type WorkflowTrigger =
  | 'lead_created'
  | 'lead_updated'
  | 'status_changed'
  | 'score_changed'
  | 'tag_added'
  | 'tag_removed'
  | 'scheduled';

/**
 * Workflow Action Type
 * What action to perform when triggered
 */
export type WorkflowAction =
  | 'update_status'
  | 'update_score'
  | 'add_tag'
  | 'remove_tag'
  | 'send_notification'
  | 'send_email'
  | 'webhook';

/**
 * Workflow Status
 */
export type WorkflowStatus = 'active' | 'paused' | 'disabled';

/**
 * Condition Operator
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

/**
 * Workflow Condition
 */
export interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

/**
 * Workflow Action Config
 */
export interface WorkflowActionConfig {
  type: WorkflowAction;
  params: Record<string, unknown>;
}

/**
 * Automation Workflows Table
 * Defines automated rules for lead management
 */
export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  /** Trigger that activates this workflow */
  trigger: text('trigger').$type<WorkflowTrigger>().notNull(),
  /** Conditions that must be met (AND logic) */
  conditions: jsonb('conditions').$type<WorkflowCondition[]>().default([]).notNull(),
  /** Actions to perform when triggered */
  actions: jsonb('actions').$type<WorkflowActionConfig[]>().default([]).notNull(),
  /** Workflow status */
  status: text('status').$type<WorkflowStatus>().default('active').notNull(),
  /** Priority order (lower = higher priority) */
  priority: integer('priority').default(100).notNull(),
  /** For scheduled triggers - cron expression */
  cronExpression: text('cron_expression'),
  /** Last executed time */
  lastExecutedAt: timestamp('last_executed_at'),
  /** Total execution count */
  executionCount: integer('execution_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Workflow Execution History
 * Logs of workflow executions
 */
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  /** Trigger that caused execution */
  trigger: text('trigger').$type<WorkflowTrigger>().notNull(),
  /** Conditions evaluated */
  conditionsMatched: boolean('conditions_matched').notNull(),
  /** Actions executed */
  actionsExecuted: jsonb('actions_executed').$type<WorkflowActionConfig[]>().default([]).notNull(),
  /** Execution status */
  status: text('status').$type<'success' | 'failed' | 'skipped'>().notNull(),
  /** Error message if failed */
  errorMessage: text('error_message'),
  /** Execution duration in ms */
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Workflow Relations
 */
export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workflows.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [workflows.createdById],
    references: [users.id],
  }),
  executions: many(workflowExecutions),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
  organization: one(organizations, {
    fields: [workflowExecutions.organizationId],
    references: [organizations.id],
  }),
  lead: one(leads, {
    fields: [workflowExecutions.leadId],
    references: [leads.id],
  }),
}));

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;

// ============================================================================
// Custom Fields Feature
// ============================================================================

/**
 * Custom Field Type
 */
export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'email'
  | 'phone';

/**
 * Custom Field Options (for select/multiselect)
 */
export interface CustomFieldOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * Custom Fields Definition Table
 * Stores custom field definitions for organizations
 */
export const customFields = pgTable('custom_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Field key (used in lead.customFields JSON) */
  key: text('key').notNull(),
  /** Display name */
  name: text('name').notNull(),
  /** Field description */
  description: text('description'),
  /** Field type */
  fieldType: text('field_type').$type<CustomFieldType>().notNull(),
  /** Options for select/multiselect fields */
  options: jsonb('options').$type<CustomFieldOption[]>().default([]),
  /** Is this field required? */
  isRequired: boolean('is_required').default(false).notNull(),
  /** Default value */
  defaultValue: jsonb('default_value'),
  /** Validation rules (JSON schema-like) */
  validation: jsonb('validation').$type<Record<string, unknown>>(),
  /** Display order */
  displayOrder: integer('display_order').default(0).notNull(),
  /** Show in lead table */
  showInTable: boolean('show_in_table').default(false).notNull(),
  /** Show in lead form */
  showInForm: boolean('show_in_form').default(true).notNull(),
  /** Is field active? */
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Custom Fields Relations
 */
export const customFieldsRelations = relations(customFields, ({ one }) => ({
  organization: one(organizations, {
    fields: [customFields.organizationId],
    references: [organizations.id],
  }),
}));

export type CustomField = typeof customFields.$inferSelect;
export type NewCustomField = typeof customFields.$inferInsert;

// ============================================================================
// Saved Filters (Phase 9 P2: Advanced Filtering)
// ============================================================================

/**
 * Filter Condition Operator Types
 */
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in';

/**
 * Filter Condition Interface
 */
export interface FilterCondition {
  /** Field to filter on */
  field: string;
  /** Comparison operator */
  operator: FilterOperator;
  /** Value to compare against */
  value: unknown;
  /** Second value for 'between' operator */
  value2?: unknown;
}

/**
 * Filter Group Interface
 * Groups conditions with AND/OR logic
 */
export interface FilterGroup {
  /** Logic operator for combining conditions */
  logic: 'and' | 'or';
  /** Conditions in this group */
  conditions: FilterCondition[];
  /** Nested groups for complex queries */
  groups?: FilterGroup[];
}

/**
 * Saved Filters Table
 * Stores reusable filter configurations for leads
 */
export const savedFilters = pgTable('saved_filters', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** User who created this filter */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Filter name */
  name: text('name').notNull(),
  /** Filter description */
  description: text('description'),
  /** Filter configuration */
  filters: jsonb('filters').$type<FilterGroup>().notNull(),
  /** Is this a default/shared filter? */
  isDefault: boolean('is_default').default(false).notNull(),
  /** Is this filter public to all organization members? */
  isPublic: boolean('is_public').default(false).notNull(),
  /** Filter color for UI */
  color: text('color'),
  /** Filter icon */
  icon: text('icon'),
  /** Usage count for analytics */
  usageCount: integer('usage_count').default(0).notNull(),
  /** Last used timestamp */
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Saved Filters Relations
 */
export const savedFiltersRelations = relations(savedFilters, ({ one }) => ({
  organization: one(organizations, {
    fields: [savedFilters.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [savedFilters.userId],
    references: [users.id],
  }),
}));

export type SavedFilter = typeof savedFilters.$inferSelect;
export type NewSavedFilter = typeof savedFilters.$inferInsert;

// ============================================================================
// Custom Reports (Phase 9 P2: Custom Report Builder)
// ============================================================================

/**
 * Report Widget Types
 */
export type ReportWidgetType =
  | 'kpi_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'donut_chart'
  | 'area_chart'
  | 'funnel'
  | 'table'
  | 'text'
  | 'gauge';

/**
 * Report Widget Configuration
 */
export interface ReportWidget {
  id: string;
  type: ReportWidgetType;
  title: string;
  /** Data source: which analytics endpoint to use */
  dataSource: string;
  /** Configuration specific to widget type */
  config: Record<string, unknown>;
  /** Position in grid */
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

/**
 * Custom Reports Table
 * Stores user-created report templates
 */
export const customReports = pgTable('custom_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** User who created this report */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Report name */
  name: text('name').notNull(),
  /** Report description */
  description: text('description'),
  /** Report widgets configuration */
  widgets: jsonb('widgets').$type<ReportWidget[]>().notNull().default([]),
  /** Default date range for the report */
  defaultDateRange: text('default_date_range').$type<'7d' | '30d' | '90d' | 'all'>().default('30d'),
  /** Default filters to apply */
  defaultFilters: jsonb('default_filters').$type<FilterGroup>(),
  /** Is this a default/shared report? */
  isDefault: boolean('is_default').default(false).notNull(),
  /** Is this report public to all organization members? */
  isPublic: boolean('is_public').default(false).notNull(),
  /** Report thumbnail (base64 or URL) */
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Custom Reports Relations
 */
export const customReportsRelations = relations(customReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [customReports.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [customReports.userId],
    references: [users.id],
  }),
}));

export type CustomReport = typeof customReports.$inferSelect;
export type NewCustomReport = typeof customReports.$inferInsert;

// ============================================================================
// Diagnostic Templates (Phase 9 P3: Diagnostic Template Management)
// ============================================================================

/**
 * Diagnostic Question Types
 */
export type DiagnosticQuestionType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'rating'
  | 'slider'
  | 'file';

/**
 * Diagnostic Question Option (for radio, checkbox, select)
 */
export interface DiagnosticQuestionOption {
  id: string;
  label: string;
  value: string;
  /** Score contribution for lead scoring */
  score?: number;
  /** Icon name (optional) */
  icon?: string;
}

/**
 * Conditional Logic for showing/hiding questions
 */
export interface QuestionCondition {
  /** Question ID to check */
  questionId: string;
  /** Operator for comparison */
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty';
  /** Value to compare against */
  value: string | number | boolean;
}

/**
 * Diagnostic Question Configuration
 */
export interface DiagnosticQuestion {
  id: string;
  /** Question type */
  type: DiagnosticQuestionType;
  /** Question label */
  label: string;
  /** Question description/help text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Is this question required? */
  required: boolean;
  /** Options for radio, checkbox, select types */
  options?: DiagnosticQuestionOption[];
  /** Validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
  /** Conditional display logic */
  conditions?: QuestionCondition[];
  /** Condition operator (and/or) when multiple conditions */
  conditionOperator?: 'and' | 'or';
  /** Map to lead field */
  mapToLeadField?: string;
  /** Score weight for this question */
  scoreWeight?: number;
  /** Order in the step */
  order: number;
}

/**
 * Diagnostic Step Configuration
 */
export interface DiagnosticStep {
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Icon for this step */
  icon?: string;
  /** Icon color */
  iconColor?: string;
  /** Questions in this step */
  questions: DiagnosticQuestion[];
  /** Order of this step */
  order: number;
}

/**
 * Diagnostic Template Theme Configuration
 */
export interface DiagnosticTheme {
  /** Primary color */
  primaryColor: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Background color */
  backgroundColor?: string;
  /** Text color */
  textColor?: string;
  /** Border radius */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Custom CSS */
  customCss?: string;
}

/**
 * Diagnostic Completion Configuration
 */
export interface DiagnosticCompletion {
  /** Title shown on completion */
  title: string;
  /** Message shown on completion */
  message: string;
  /** Show score on completion? */
  showScore: boolean;
  /** Redirect URL after completion */
  redirectUrl?: string;
  /** Redirect delay in seconds */
  redirectDelay?: number;
  /** CTA button text */
  ctaText?: string;
  /** CTA button URL */
  ctaUrl?: string;
}

/**
 * Diagnostic Templates Table
 * Stores diagnostic form templates
 */
export const diagnosticTemplates = pgTable('diagnostic_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** User who created this template */
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Template name (internal) */
  name: text('name').notNull(),
  /** Template slug (URL-friendly) */
  slug: text('slug').notNull(),
  /** Template title (public-facing) */
  title: text('title').notNull(),
  /** Template description */
  description: text('description'),
  /** Steps configuration */
  steps: jsonb('steps').$type<DiagnosticStep[]>().notNull().default([]),
  /** Theme configuration */
  theme: jsonb('theme').$type<DiagnosticTheme>(),
  /** Completion configuration */
  completion: jsonb('completion').$type<DiagnosticCompletion>(),
  /** Lead source to use for submissions */
  leadSource: text('lead_source').default('diagnostic'),
  /** Is this template active? */
  isActive: boolean('is_active').default(true).notNull(),
  /** Is this the default template? */
  isDefault: boolean('is_default').default(false).notNull(),
  /** Template version for A/B testing */
  version: integer('version').default(1).notNull(),
  /** Parent template ID (for A/B variants) */
  parentTemplateId: uuid('parent_template_id'),
  /** Submission count */
  submissionCount: integer('submission_count').default(0).notNull(),
  /** Conversion count (completed forms) */
  conversionCount: integer('conversion_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Diagnostic Templates Relations
 */
export const diagnosticTemplatesRelations = relations(diagnosticTemplates, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [diagnosticTemplates.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [diagnosticTemplates.userId],
    references: [users.id],
  }),
  parentTemplate: one(diagnosticTemplates, {
    fields: [diagnosticTemplates.parentTemplateId],
    references: [diagnosticTemplates.id],
    relationName: 'parent',
  }),
  variants: many(diagnosticTemplates, { relationName: 'parent' }),
  abTests: many(diagnosticAbTests),
}));

export type DiagnosticTemplate = typeof diagnosticTemplates.$inferSelect;
export type NewDiagnosticTemplate = typeof diagnosticTemplates.$inferInsert;

// ============================================================================
// A/B Tests (Phase 9 P3: A/B Testing for Diagnostic Forms)
// ============================================================================

/**
 * A/B Test Status
 */
export type AbTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * A/B Test Variant Configuration
 */
export interface AbTestVariant {
  /** Variant ID (matches template ID) */
  templateId: string;
  /** Variant name (e.g., "Control", "Variant A") */
  name: string;
  /** Traffic percentage (0-100) */
  trafficPercent: number;
  /** Impressions count */
  impressions: number;
  /** Submissions count */
  submissions: number;
  /** Conversions count */
  conversions: number;
}

/**
 * A/B Test Goal Types
 */
export type AbTestGoalType =
  | 'submission_rate'
  | 'conversion_rate'
  | 'completion_time'
  | 'score_average';

/**
 * A/B Tests Table
 * Stores A/B test configurations
 */
export const diagnosticAbTests = pgTable('diagnostic_ab_tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Test name */
  name: text('name').notNull(),
  /** Test description */
  description: text('description'),
  /** Base template ID */
  baseTemplateId: uuid('base_template_id')
    .notNull()
    .references(() => diagnosticTemplates.id, { onDelete: 'cascade' }),
  /** Test status */
  status: text('status').$type<AbTestStatus>().default('draft').notNull(),
  /** Goal type for determining winner */
  goalType: text('goal_type').$type<AbTestGoalType>().default('conversion_rate').notNull(),
  /** Minimum sample size per variant */
  minSampleSize: integer('min_sample_size').default(100).notNull(),
  /** Statistical significance threshold (0-100) */
  confidenceLevel: integer('confidence_level').default(95).notNull(),
  /** Variants configuration */
  variants: jsonb('variants').$type<AbTestVariant[]>().notNull().default([]),
  /** Winner variant ID (when completed) */
  winnerId: uuid('winner_id'),
  /** Start date */
  startedAt: timestamp('started_at'),
  /** End date */
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * A/B Tests Relations
 */
export const diagnosticAbTestsRelations = relations(diagnosticAbTests, ({ one }) => ({
  organization: one(organizations, {
    fields: [diagnosticAbTests.organizationId],
    references: [organizations.id],
  }),
  baseTemplate: one(diagnosticTemplates, {
    fields: [diagnosticAbTests.baseTemplateId],
    references: [diagnosticTemplates.id],
  }),
}));

export type DiagnosticAbTest = typeof diagnosticAbTests.$inferSelect;
export type NewDiagnosticAbTest = typeof diagnosticAbTests.$inferInsert;

// ============================================================================
// Lead Scoring Rules (Phase 9 P3: Custom Lead Scoring Rules)
// ============================================================================

/**
 * Scoring Rule Condition Type
 */
export type ScoringConditionType =
  | 'field_value'
  | 'field_contains'
  | 'field_matches'
  | 'source_is'
  | 'industry_is'
  | 'employee_count'
  | 'budget_range'
  | 'timeline'
  | 'custom';

/**
 * Scoring Rule Condition
 */
export interface ScoringCondition {
  id: string;
  type: ScoringConditionType;
  /** Field to check (for field-based conditions) */
  field?: string;
  /** Operator */
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'between'
    | 'in'
    | 'not_in';
  /** Value(s) to compare */
  value: string | number | string[] | number[];
  /** Secondary value (for between operator) */
  value2?: string | number;
}

/**
 * Scoring Rule
 */
export interface ScoringRule {
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Conditions (all must match unless operator is 'or') */
  conditions: ScoringCondition[];
  /** Condition operator */
  conditionOperator: 'and' | 'or';
  /** Score adjustment (-100 to +100) */
  scoreAdjustment: number;
  /** Is this rule active? */
  isActive: boolean;
  /** Priority (higher = evaluated first) */
  priority: number;
}

/**
 * Lead Scoring Rulesets Table
 * Stores custom scoring rule configurations
 */
export const leadScoringRulesets = pgTable('lead_scoring_rulesets', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Ruleset name */
  name: text('name').notNull(),
  /** Ruleset description */
  description: text('description'),
  /** Base score (starting score for all leads) */
  baseScore: integer('base_score').default(50).notNull(),
  /** Minimum score */
  minScore: integer('min_score').default(0).notNull(),
  /** Maximum score */
  maxScore: integer('max_score').default(100).notNull(),
  /** Rules configuration */
  rules: jsonb('rules').$type<ScoringRule[]>().notNull().default([]),
  /** Is this ruleset active? */
  isActive: boolean('is_active').default(true).notNull(),
  /** Is this the default ruleset? */
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Lead Scoring Rulesets Relations
 */
export const leadScoringRulesetsRelations = relations(leadScoringRulesets, ({ one }) => ({
  organization: one(organizations, {
    fields: [leadScoringRulesets.organizationId],
    references: [organizations.id],
  }),
}));

export type LeadScoringRuleset = typeof leadScoringRulesets.$inferSelect;
export type NewLeadScoringRuleset = typeof leadScoringRulesets.$inferInsert;

// ============================================================================
// Embed Widget Configuration (External Site Integration)
// ============================================================================

/**
 * Embed Configs Table
 * Stores configuration for embedding widgets on external sites
 * Security: API key authentication + origin whitelist
 */
export const embedConfigs = pgTable('embed_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Configuration name for identification */
  name: text('name').notNull(),
  /** Description */
  description: text('description'),
  /** API Key for widget authentication (shown once, stored hashed) */
  apiKey: text('api_key').notNull().unique(),
  /** bcrypt hash of API key for verification */
  apiKeyHash: text('api_key_hash').notNull(),
  /** Allowed origins (e.g., ['https://example.com', 'https://*.example.com']) */
  allowedOrigins: jsonb('allowed_origins').$type<string[]>().default([]).notNull(),
  /** Rate limit per minute */
  rateLimitPerMinute: integer('rate_limit_per_minute').default(60).notNull(),
  /** Rate limit per day */
  rateLimitPerDay: integer('rate_limit_per_day').default(10000).notNull(),
  /** Diagnostic template ID to use (optional, defaults to organization default) */
  diagnosticTemplateId: uuid('diagnostic_template_id').references(() => diagnosticTemplates.id, {
    onDelete: 'set null',
  }),
  /** Theme overrides for the widget */
  themeOverrides: jsonb('theme_overrides').$type<{
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
  }>(),
  /** Custom CSS for advanced styling */
  customCss: text('custom_css'),
  /** Lead source to use for submissions from this widget */
  leadSource: text('lead_source').default('embed').notNull(),
  /** Expiration date (optional) */
  expiresAt: timestamp('expires_at'),
  /** Is this config active? */
  isActive: boolean('is_active').default(true).notNull(),
  /** Last used timestamp */
  lastUsedAt: timestamp('last_used_at'),
  /** Total usage count */
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Embed Access Logs Table
 * Audit log for all embed API access (security monitoring)
 */
export const embedAccessLogs = pgTable('embed_access_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  embedConfigId: uuid('embed_config_id').references(() => embedConfigs.id, {
    onDelete: 'set null',
  }),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  /** Request origin header */
  origin: text('origin'),
  /** Client IP address (hashed for privacy) */
  ipAddressHash: text('ip_address_hash'),
  /** User agent string */
  userAgent: text('user_agent'),
  /** API endpoint accessed */
  endpoint: text('endpoint').notNull(),
  /** HTTP method */
  method: text('method').notNull(),
  /** HTTP status code returned */
  statusCode: integer('status_code').notNull(),
  /** Error code if request failed */
  errorCode: text('error_code'),
  /** Error message if request failed */
  errorMessage: text('error_message'),
  /** Lead ID if a lead was created */
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  /** Request duration in milliseconds */
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Embed Configs Relations
 */
export const embedConfigsRelations = relations(embedConfigs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [embedConfigs.organizationId],
    references: [organizations.id],
  }),
  diagnosticTemplate: one(diagnosticTemplates, {
    fields: [embedConfigs.diagnosticTemplateId],
    references: [diagnosticTemplates.id],
  }),
  accessLogs: many(embedAccessLogs),
}));

/**
 * Embed Access Logs Relations
 */
export const embedAccessLogsRelations = relations(embedAccessLogs, ({ one }) => ({
  embedConfig: one(embedConfigs, {
    fields: [embedAccessLogs.embedConfigId],
    references: [embedConfigs.id],
  }),
  organization: one(organizations, {
    fields: [embedAccessLogs.organizationId],
    references: [organizations.id],
  }),
  lead: one(leads, {
    fields: [embedAccessLogs.leadId],
    references: [leads.id],
  }),
}));

export type EmbedConfig = typeof embedConfigs.$inferSelect;
export type NewEmbedConfig = typeof embedConfigs.$inferInsert;
export type EmbedAccessLog = typeof embedAccessLogs.$inferSelect;
export type NewEmbedAccessLog = typeof embedAccessLogs.$inferInsert;

// ============================================================================
// QR Code Distribution (Offline Event Integration)
// ============================================================================

/**
 * QR Campaigns Table
 * Stores QR code campaigns for offline event lead capture
 */
export const qrCampaigns = pgTable('qr_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  diagnosticTemplateId: uuid('diagnostic_template_id')
    .notNull()
    .references(() => diagnosticTemplates.id, { onDelete: 'cascade' }),
  /** Campaign name for identification */
  name: text('name').notNull(),
  /** Description */
  description: text('description'),
  /** Short code for URL (e.g., abc123) */
  shortCode: text('short_code').notNull().unique(),
  /** Full tracking URL */
  trackingUrl: text('tracking_url').notNull(),
  /** UTM parameters */
  utmSource: text('utm_source').default('qrcode').notNull(),
  utmMedium: text('utm_medium').default('offline').notNull(),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  /** Scan count */
  scanCount: integer('scan_count').default(0).notNull(),
  /** Completion count (leads created) */
  completionCount: integer('completion_count').default(0).notNull(),
  /** Is campaign active? */
  isActive: boolean('is_active').default(true).notNull(),
  /** Expiration date (optional) */
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * QR Scans Table
 * Tracks individual QR code scans for analytics
 */
export const qrScans = pgTable('qr_scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => qrCampaigns.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Hashed IP address for privacy */
  ipAddressHash: text('ip_address_hash'),
  /** User agent string */
  userAgent: text('user_agent'),
  /** Device type */
  deviceType: text('device_type'), // mobile, tablet, desktop
  /** Location data (from IP geolocation) */
  location: jsonb('location').$type<{ country?: string; city?: string }>(),
  /** Session ID to track conversions */
  sessionId: uuid('session_id'),
  /** Did this scan result in a lead? */
  converted: boolean('converted').default(false).notNull(),
  /** Lead ID if converted */
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
});

/**
 * QR Campaigns Relations
 */
export const qrCampaignsRelations = relations(qrCampaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [qrCampaigns.organizationId],
    references: [organizations.id],
  }),
  diagnosticTemplate: one(diagnosticTemplates, {
    fields: [qrCampaigns.diagnosticTemplateId],
    references: [diagnosticTemplates.id],
  }),
  scans: many(qrScans),
}));

/**
 * QR Scans Relations
 */
export const qrScansRelations = relations(qrScans, ({ one }) => ({
  campaign: one(qrCampaigns, {
    fields: [qrScans.campaignId],
    references: [qrCampaigns.id],
  }),
  organization: one(organizations, {
    fields: [qrScans.organizationId],
    references: [organizations.id],
  }),
  lead: one(leads, {
    fields: [qrScans.leadId],
    references: [leads.id],
  }),
}));

export type QRCampaign = typeof qrCampaigns.$inferSelect;
export type NewQRCampaign = typeof qrCampaigns.$inferInsert;
export type QRScan = typeof qrScans.$inferSelect;
export type NewQRScan = typeof qrScans.$inferInsert;

// ============================================================================
// Feature Flags (P0 - Sprint 3)
// ============================================================================

/**
 * Feature flag status
 */
export type FeatureFlagStatus = 'active' | 'inactive' | 'archived';

/**
 * Rollout strategy
 */
export type RolloutStrategy =
  | 'all'
  | 'none'
  | 'percentage'
  | 'organization'
  | 'user'
  | 'environment';

/**
 * Feature Flags Table
 * Manages feature toggles for gradual rollouts and A/B testing
 */
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  /** Unique key for the flag (e.g., 'ai_lead_scoring') */
  key: text('key').notNull(),
  /** Human-readable name */
  name: text('name').notNull(),
  /** Description of the feature */
  description: text('description'),
  /** Flag status */
  status: text('status').$type<FeatureFlagStatus>().default('inactive').notNull(),
  /** Rollout strategy */
  strategy: text('strategy').$type<RolloutStrategy>().default('none').notNull(),
  /** Percentage for percentage-based rollout (0-100) */
  rolloutPercentage: integer('rollout_percentage'),
  /** Target organization IDs for organization strategy */
  targetOrganizationIds: jsonb('target_organization_ids').$type<string[]>(),
  /** Target user IDs for user strategy */
  targetUserIds: jsonb('target_user_ids').$type<string[]>(),
  /** Target environments for environment strategy */
  environments: jsonb('environments').$type<string[]>(),
  /** Additional metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Feature Flags Relations
 */
export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  organization: one(organizations, {
    fields: [featureFlags.organizationId],
    references: [organizations.id],
  }),
}));

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

// ============================================================================
// Audit Logs (P0 - Sprint 3)
// ============================================================================

/**
 * Audit action types
 */
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export';

/**
 * Audit Logs Table
 * Records all important actions for compliance and debugging
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Action performed */
  action: text('action').$type<AuditAction>().notNull(),
  /** Resource type (e.g., 'lead', 'organization') */
  resource: text('resource').notNull(),
  /** Resource ID */
  resourceId: text('resource_id'),
  /** Changes made (for update actions) */
  changes: jsonb('changes').$type<{ before?: unknown; after?: unknown }>(),
  /** Request metadata */
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  /** Additional context */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  /** Timestamp */
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Audit Logs Relations
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
