# Database Schema Documentation

## Overview

DiagnoLeads v2 uses PostgreSQL with Drizzle ORM for database management. The schema supports multi-tenant architecture with hierarchical organization support.

## Connection

```
DATABASE_URL=postgresql://user:password@localhost:5432/diagnoleads
```

## Tables

### Organizations

Core multi-tenant table. All data is scoped to an organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Organization display name |
| `slug` | TEXT | URL-friendly unique identifier |
| `settings` | JSONB | Custom settings and configuration |
| `parent_organization_id` | UUID | FK to parent organization (null for root) |
| `organization_type` | TEXT | 'holding' \| 'subsidiary' \| 'independent' |
| `hierarchy_path` | LTREE | Path for efficient tree queries |
| `hierarchy_level` | INTEGER | 0 = root, 1 = child, etc. |
| `group_id` | UUID | Root organization ID in the group |
| `data_sharing_policy` | JSONB | Cross-organization access control |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### Organization Types

- **holding**: Parent company in a group structure
- **subsidiary**: Child company owned by a holding
- **independent**: Standalone organization

#### Data Sharing Policy

```json
{
  "allowParentAccess": false,
  "allowChildAccess": false,
  "allowSiblingAccess": false,
  "sharedFields": []
}
```

---

### Users

Authentication and user profile information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | Unique email address |
| `name` | TEXT | Display name |
| `email_verified` | BOOLEAN | Email verification status |
| `image` | TEXT | Profile image URL |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

### Organization Members

Maps users to organizations with roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to organizations |
| `user_id` | UUID | FK to users |
| `role` | TEXT | Member role (see below) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### Roles

| Role | Description |
|------|-------------|
| `owner` | Full control of single organization |
| `admin` | Admin access to single organization |
| `member` | Standard member access |
| `group_owner` | Full control of entire group (holding company owner) |
| `group_admin` | Read access to entire group |
| `parent_viewer` | Read-only access to child organizations |

---

### Accounts

OAuth and credential accounts for BetterAuth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `account_id` | TEXT | External account ID |
| `provider_id` | TEXT | 'credential', 'google', 'github', etc. |
| `access_token` | TEXT | OAuth access token |
| `refresh_token` | TEXT | OAuth refresh token |
| `access_token_expires_at` | TIMESTAMP | Token expiry |
| `refresh_token_expires_at` | TIMESTAMP | Refresh token expiry |
| `scope` | TEXT | OAuth scopes |
| `password` | TEXT | Hashed password (credential provider) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

### Sessions

User authentication sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to users |
| `expires_at` | TIMESTAMP | Session expiry |
| `token` | TEXT | Unique session token |
| `ip_address` | TEXT | Client IP address |
| `user_agent` | TEXT | Client user agent |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

### Verification

Email verification and password reset tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `identifier` | TEXT | Email address |
| `value` | TEXT | Verification token |
| `expires_at` | TIMESTAMP | Token expiry |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

### Leads

Core business entity - diagnostic form submissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to organizations |
| `email` | TEXT | Lead email address |
| `name` | TEXT | Lead name |
| `company` | TEXT | Company name |
| `phone` | TEXT | Phone number |
| `status` | TEXT | 'new' \| 'contacted' \| 'qualified' \| 'converted' |
| `score` | INTEGER | AI-calculated lead score (0-100) |
| `source` | TEXT | 'website' \| 'embed' \| 'api' |
| `responses` | JSONB | Diagnostic form responses |
| `embedding` | VECTOR(1536) | OpenAI text embedding |
| `search_vector` | TSVECTOR | Full-text search index |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### Lead Status Flow

```
new -> contacted -> qualified -> converted
```

---

### Webhooks

Webhook configurations for event notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | FK to organizations |
| `name` | TEXT | Webhook display name |
| `url` | TEXT | Webhook endpoint URL |
| `secret` | TEXT | HMAC signing secret |
| `events` | JSONB | Array of event types |
| `status` | TEXT | 'active' \| 'inactive' \| 'failed' |
| `headers` | JSONB | Custom HTTP headers |
| `retry_config` | JSONB | Retry configuration |
| `last_triggered_at` | TIMESTAMP | Last trigger time |
| `failure_count` | INTEGER | Consecutive failure count |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

#### Webhook Events

| Event | Description |
|-------|-------------|
| `lead.created` | New lead created |
| `lead.updated` | Lead information updated |
| `lead.deleted` | Lead deleted |
| `lead.status_changed` | Lead status changed |
| `lead.scored` | Lead scored by AI |
| `diagnostic.submitted` | Diagnostic form submitted |
| `diagnostic.completed` | Diagnostic completed |
| `organization.member_added` | Member added to org |
| `organization.member_removed` | Member removed from org |
| `blog.published` | Blog post published |
| `faq.published` | FAQ published |

---

### Webhook Deliveries

Delivery logs for webhook events.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `webhook_id` | UUID | FK to webhooks |
| `event_type` | TEXT | Event type that triggered |
| `payload` | JSONB | Event payload sent |
| `status` | TEXT | 'pending' \| 'success' \| 'failed' |
| `status_code` | INTEGER | HTTP response status |
| `response` | TEXT | Response body |
| `error` | TEXT | Error message if failed |
| `attempts` | INTEGER | Delivery attempt count |
| `next_retry_at` | TIMESTAMP | Next retry scheduled |
| `created_at` | TIMESTAMP | Record creation time |
| `completed_at` | TIMESTAMP | Delivery completion time |

---

## Relations

```
organizations ─┬── organization_members ─── users
               ├── leads
               ├── webhooks ─── webhook_deliveries
               └── organizations (self: parent/child)

users ─┬── organization_members ─── organizations
       ├── accounts
       └── sessions
```

## Indexes

Recommended indexes for optimal performance:

```sql
-- Organizations
CREATE INDEX idx_orgs_parent ON organizations(parent_organization_id);
CREATE INDEX idx_orgs_group ON organizations(group_id);
CREATE INDEX idx_orgs_hierarchy ON organizations USING GIST(hierarchy_path);

-- Leads
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(organization_id, status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_search ON leads USING GIN(search_vector);
CREATE INDEX idx_leads_embedding ON leads USING ivfflat(embedding vector_cosine_ops);

-- Webhooks
CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
```

## Migrations

Use Drizzle Kit for migrations:

```bash
# Generate migration
bun x drizzle-kit generate

# Apply migration
bun x drizzle-kit push

# View current schema
bun x drizzle-kit studio
```

## Type Exports

All schema types are exported from `lib/db/schema.ts`:

```typescript
// Entity types (select)
import type {
  Organization,
  User,
  Lead,
  Webhook
} from '@/lib/db/schema';

// Insert types
import type {
  NewOrganization,
  NewUser,
  NewLead,
  NewWebhook
} from '@/lib/db/schema';

// Enums and utility types
import type {
  OrganizationType,
  OrganizationRole,
  WebhookEventType
} from '@/lib/db/schema';
```
