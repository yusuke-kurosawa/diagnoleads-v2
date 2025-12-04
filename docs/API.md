# DiagnoLeads v2 API Documentation

> **OpenAPI Specification**: [openapi/openapi.json](../openapi/openapi.json)
>
> **View Interactive Docs**: `npx @redocly/cli preview-docs openapi/openapi.json`

## Overview

DiagnoLeads v2 provides a REST-like API for managing leads, organizations, and AI-powered features.

## Base URLs

| Environment | URL |
|------------|-----|
| Development | `http://localhost:3000` |
| Production | `https://diagnoleads.com` |

## Authentication

Most endpoints require authentication. Use the session cookie or Bearer token obtained from `/api/auth`.

```bash
# Example with Bearer token
curl -H "Authorization: Bearer <token>" \
  https://diagnoleads.com/api/trpc/leads.list?organizationId=<uuid>
```

## Rate Limiting

| Endpoint Type | Limit |
|--------------|-------|
| Standard | 100 requests/minute |
| AI endpoints | 20 requests/minute |

---

## Endpoints

### System

#### Health Check
```
GET /api/health
```

Returns service health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Diagnostic (Public)

#### Submit Diagnostic Form
```
POST /api/diagnostic
```

Submit a public diagnostic form and receive an AI-generated lead score.

**Request Body:**
```json
{
  "companyName": "Acme Corp",
  "industry": "technology",
  "employeeCount": "51-200",
  "name": "John Doe",
  "email": "john@acme.com",
  "phone": "+1-555-0100",
  "position": "CTO",
  "currentChallenge": "lead_generation",
  "primaryGoal": "increase_leads",
  "timeline": "immediate",
  "budget": "50k-100k",
  "additionalInfo": "Looking to scale our sales pipeline",
  "marketingConsent": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Diagnostic submitted successfully",
  "score": 85,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "email": "john@acme.com",
    "company": "Acme Corp",
    "name": "John Doe"
  }
}
```

---

### Leads

#### List Leads
```
GET /api/trpc/leads.list
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | UUID | Yes | Organization ID |
| limit | integer | No | Items per page (default: 20) |
| offset | integer | No | Items to skip (default: 0) |
| status | string | No | Filter by status (new, contacted, qualified, converted) |
| source | string | No | Filter by source (website, embed, api) |
| search | string | No | Search in name, email, company |

**Response:**
```json
{
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "organizationId": "...",
      "email": "john@acme.com",
      "name": "John Doe",
      "company": "Acme Corp",
      "status": "new",
      "score": 85,
      "source": "website",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
```

#### Create Lead
```
POST /api/trpc/leads.create
```

**Request Body:**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "jane@corp.com",
  "name": "Jane Smith",
  "company": "Corp Inc",
  "status": "new",
  "source": "api"
}
```

#### Get Lead
```
GET /api/trpc/leads.get?organizationId=<uuid>&id=<uuid>
```

#### Update Lead
```
POST /api/trpc/leads.update
```

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "...",
  "status": "contacted",
  "score": 90
}
```

#### Delete Lead
```
POST /api/trpc/leads.delete
```

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "organizationId": "..."
}
```

---

### Analytics

#### Get Overview Statistics
```
GET /api/trpc/analytics.getOverview
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organizationId | UUID | Yes | Organization ID |
| dateFrom | date | No | Start date filter |
| dateTo | date | No | End date filter |

**Response:**
```json
{
  "totalLeads": 500,
  "newLeads": 120,
  "contactedLeads": 200,
  "qualifiedLeads": 150,
  "convertedLeads": 30,
  "conversionRate": 6.0,
  "averageScore": 72.5
}
```

#### Get Conversion Funnel
```
GET /api/trpc/analytics.getConversionFunnel
```

**Response:**
```json
{
  "stages": [
    { "name": "new", "count": 500, "cumulativeCount": 500, "percentage": 100, "conversionRate": null },
    { "name": "contacted", "count": 350, "cumulativeCount": 350, "percentage": 70, "conversionRate": 70 },
    { "name": "qualified", "count": 150, "cumulativeCount": 150, "percentage": 30, "conversionRate": 42.8 },
    { "name": "converted", "count": 30, "cumulativeCount": 30, "percentage": 6, "conversionRate": 20 }
  ],
  "totalLeads": 500,
  "overallConversionRate": 6.0,
  "averageConversionDays": 14.5
}
```

---

### AI Features

#### Score Lead with AI
```
POST /api/trpc/ai.scoreLead
```

Uses Claude AI to analyze and score a lead based on company profile and engagement signals.

**Request Body:**
```json
{
  "organizationId": "...",
  "leadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "score": 85,
  "confidence": "high",
  "reasoning": "Large technology company with immediate timeline and substantial budget indicates strong purchase intent.",
  "recommendedActions": [
    "Schedule discovery call within 24 hours",
    "Prepare custom demo focusing on scale features"
  ],
  "priority": "high"
}
```

#### Semantic Search
```
POST /api/trpc/ai.semanticSearch
```

Search leads using natural language with AI embeddings.

**Request Body:**
```json
{
  "organizationId": "...",
  "query": "technology companies interested in scaling",
  "limit": 10
}
```

**Response:**
```json
[
  {
    "id": "...",
    "email": "john@acme.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "score": 85,
    "similarity": 0.92
  }
]
```

#### Chat with AI Assistant
```
POST /api/chat
```

Send messages to the AI assistant and receive streaming responses.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "What are my highest-scoring leads this week?" }
  ]
}
```

**Response:** Server-Sent Events (text/event-stream)

---

### Organizations

#### List Organizations
```
GET /api/trpc/organizations.list
```

Returns organizations the authenticated user is a member of.

#### Create Organization
```
POST /api/trpc/organizations.create
```

**Request Body:**
```json
{
  "name": "My Company",
  "slug": "my-company"
}
```

---

### Members

#### List Members
```
GET /api/trpc/members.list?organizationId=<uuid>
```

#### Invite Member
```
POST /api/trpc/members.invite
```

**Request Body:**
```json
{
  "organizationId": "...",
  "email": "newuser@company.com",
  "role": "member"
}
```

**Roles:**
- `owner` - Full control of organization
- `admin` - Admin access
- `member` - Standard member access
- `group_owner` - Full control of group hierarchy
- `group_admin` - Read access to entire group
- `parent_viewer` - Read-only access to child organizations

---

### Webhooks

#### List Webhooks
```
GET /api/trpc/webhooks.list?organizationId=<uuid>
```

#### Create Webhook
```
POST /api/trpc/webhooks.create
```

**Request Body:**
```json
{
  "organizationId": "...",
  "name": "Lead Notifications",
  "url": "https://example.com/webhook",
  "events": ["lead.created", "lead.status_changed"]
}
```

**Available Events:**
- `lead.created` - New lead created
- `lead.updated` - Lead information updated
- `lead.deleted` - Lead deleted
- `lead.status_changed` - Lead status changed
- `lead.scored` - Lead scored by AI
- `diagnostic.submitted` - Diagnostic form submitted
- `diagnostic.completed` - Diagnostic completed
- `organization.member_added` - Member added
- `organization.member_removed` - Member removed
- `blog.published` - Blog post published
- `faq.published` - FAQ published

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Descriptive error message",
    "code": "ERROR_CODE"
  }
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| BAD_REQUEST | 400 | Invalid request data |
| INTERNAL_SERVER_ERROR | 500 | Server error |

---

## Webhook Signature Verification

Webhooks are signed using HMAC-SHA256. The signature is included in the `X-Webhook-Signature` header.

Format: `t=<timestamp>,v1=<signature>`

**Verification (Node.js):**
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const [tPart, vPart] = signature.split(',');
  const timestamp = tPart.split('=')[1];
  const expectedSig = vPart.split('=')[1];

  const signPayload = `${timestamp}.${payload}`;
  const computedSig = crypto
    .createHmac('sha256', secret)
    .update(signPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(computedSig)
  );
}
```

---

## SDK Support

SDKs for popular languages are planned:

- [ ] TypeScript/JavaScript
- [ ] Python
- [ ] Go

For now, use the OpenAPI specification to generate clients using tools like:
- [openapi-generator](https://openapi-generator.tech/)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
