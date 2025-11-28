/**
 * Zapier/Make Integration Service
 *
 * Phase 5.4: Zapier/Make統合
 * Provides webhook endpoints and payload formatting for automation platforms
 */

import crypto from 'node:crypto';

/**
 * Automation platform types
 */
export type AutomationPlatform = 'zapier' | 'make' | 'n8n' | 'generic';

/**
 * Webhook event payload
 */
export interface AutomationWebhookPayload {
  /** Unique event ID */
  id: string;
  /** Event type */
  event: string;
  /** Event timestamp */
  timestamp: string;
  /** Source platform */
  source: 'diagnoleads';
  /** API version */
  version: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Organization context */
  organization: {
    id: string;
    name: string;
  };
}

/**
 * Lead data formatted for automation platforms
 */
export interface AutomationLeadData {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  position: string | null;
  source: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format lead data for automation platforms
 */
export function formatLeadForAutomation(lead: {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  position?: string | null;
  source?: string | null;
  status: string;
  score?: number | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}): AutomationLeadData {
  return {
    id: lead.id,
    email: lead.email,
    name: lead.name || null,
    company: lead.company || null,
    phone: lead.phone || null,
    position: lead.position || null,
    source: lead.source || null,
    status: lead.status,
    score: lead.score || null,
    notes: lead.notes || null,
    metadata: lead.metadata || {},
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

/**
 * Create a webhook payload for automation platforms
 */
export function createAutomationPayload(
  event: string,
  data: Record<string, unknown>,
  organization: { id: string; name: string }
): AutomationWebhookPayload {
  return {
    id: crypto.randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    source: 'diagnoleads',
    version: '1.0',
    data,
    organization,
  };
}

/**
 * Send webhook to automation platform
 */
export async function sendAutomationWebhook(
  webhookUrl: string,
  payload: AutomationWebhookPayload,
  options?: {
    platform?: AutomationPlatform;
    secret?: string;
    timeout?: number;
  }
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const { platform = 'generic', secret, timeout = 30000 } = options || {};

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DiagnoLeads-Automation/1.0',
      'X-DiagnoLeads-Event': payload.event,
      'X-DiagnoLeads-Delivery': payload.id,
    };

    // Add HMAC signature if secret provided
    if (secret) {
      const payloadString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
      headers['X-DiagnoLeads-Signature'] = `sha256=${signature}`;
    }

    // Platform-specific headers
    if (platform === 'zapier') {
      headers['X-Zapier-Event'] = payload.event;
    } else if (platform === 'make') {
      headers['X-Make-Event'] = payload.event;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Zapier-specific subscription management
 */
export interface ZapierSubscription {
  id: string;
  organizationId: string;
  hookUrl: string;
  events: string[];
  createdAt: Date;
  isActive: boolean;
}

/**
 * Generate Zapier authentication test response
 */
export function generateZapierAuthTestResponse(organization: { id: string; name: string }) {
  return {
    id: organization.id,
    name: organization.name,
    authenticated: true,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate sample data for Zapier trigger testing
 */
export function generateZapierSampleData(triggerType: string): Record<string, unknown> {
  const samples: Record<string, Record<string, unknown>> = {
    'lead.created': {
      id: 'sample-lead-id',
      email: 'sample@example.com',
      name: 'John Doe',
      company: 'Sample Corp',
      phone: '+1-555-123-4567',
      position: 'CEO',
      source: 'diagnostic_form',
      status: 'new',
      score: 85,
      notes: 'High-value lead from diagnostic form',
      metadata: {
        industry: 'technology',
        employeeCount: '51-200',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    'lead.updated': {
      id: 'sample-lead-id',
      email: 'sample@example.com',
      name: 'John Doe',
      company: 'Sample Corp',
      previousStatus: 'new',
      newStatus: 'contacted',
      updatedAt: new Date().toISOString(),
    },
    'lead.status_changed': {
      id: 'sample-lead-id',
      email: 'sample@example.com',
      previousStatus: 'new',
      newStatus: 'qualified',
      changedAt: new Date().toISOString(),
    },
    'diagnostic.submitted': {
      id: 'sample-diagnostic-id',
      email: 'sample@example.com',
      companyName: 'Sample Corp',
      industry: 'technology',
      employeeCount: '51-200',
      score: 85,
      submittedAt: new Date().toISOString(),
    },
  };

  return (
    samples[triggerType] || {
      message: `Sample data for ${triggerType}`,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Validate Zapier webhook request
 */
export function validateZapierRequest(
  headers: Record<string, string>,
  expectedApiKey: string
): boolean {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) return false;

  // Check Bearer token format
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return token === expectedApiKey;
  }

  return false;
}

/**
 * REST Hook subscription endpoints for Zapier
 */
export const zapierRestHookEndpoints = {
  /**
   * Subscribe endpoint - Zapier calls this to register a webhook
   */
  subscribe: '/api/integrations/zapier/subscribe',

  /**
   * Unsubscribe endpoint - Zapier calls this to remove a webhook
   */
  unsubscribe: '/api/integrations/zapier/unsubscribe',

  /**
   * Perform list endpoint - Returns sample data for Zapier
   */
  performList: '/api/integrations/zapier/perform-list',
};

/**
 * Generate Zapier CLI app definition (for reference)
 */
export const zapierAppDefinition = {
  version: '1.0.0',
  platformVersion: '14.0.0',
  authentication: {
    type: 'custom',
    test: {
      url: '{{bundle.authData.base_url}}/api/integrations/zapier/auth/test',
      method: 'GET',
      headers: {
        Authorization: 'Bearer {{bundle.authData.api_key}}',
      },
    },
    fields: [
      {
        key: 'api_key',
        label: 'API Key',
        required: true,
        type: 'password',
      },
      {
        key: 'base_url',
        label: 'Base URL',
        required: true,
        default: 'https://app.diagnoleads.com',
      },
    ],
  },
  triggers: {
    new_lead: {
      key: 'new_lead',
      noun: 'Lead',
      display: {
        label: 'New Lead',
        description: 'Triggers when a new lead is created.',
      },
      operation: {
        type: 'hook',
        performSubscribe: {
          url: '{{bundle.authData.base_url}}/api/integrations/zapier/subscribe',
          method: 'POST',
          body: {
            hookUrl: '{{bundle.targetUrl}}',
            event: 'lead.created',
          },
        },
        performUnsubscribe: {
          url: '{{bundle.authData.base_url}}/api/integrations/zapier/unsubscribe',
          method: 'DELETE',
          body: {
            hookId: '{{bundle.subscribeData.id}}',
          },
        },
        perform: {
          url: '{{bundle.authData.base_url}}/api/integrations/zapier/perform-list',
          method: 'GET',
          params: {
            event: 'lead.created',
          },
        },
        performList: {
          url: '{{bundle.authData.base_url}}/api/integrations/zapier/perform-list',
          method: 'GET',
          params: {
            event: 'lead.created',
          },
        },
        sample: {
          id: 'sample-id',
          email: 'sample@example.com',
          name: 'John Doe',
          company: 'Sample Corp',
        },
      },
    },
  },
  creates: {
    create_lead: {
      key: 'create_lead',
      noun: 'Lead',
      display: {
        label: 'Create Lead',
        description: 'Creates a new lead in DiagnoLeads.',
      },
      operation: {
        inputFields: [
          { key: 'email', label: 'Email', type: 'string', required: true },
          { key: 'name', label: 'Name', type: 'string' },
          { key: 'company', label: 'Company', type: 'string' },
          { key: 'phone', label: 'Phone', type: 'string' },
        ],
        perform: {
          url: '{{bundle.authData.base_url}}/api/integrations/zapier/leads',
          method: 'POST',
          body: {
            email: '{{bundle.inputData.email}}',
            name: '{{bundle.inputData.name}}',
            company: '{{bundle.inputData.company}}',
            phone: '{{bundle.inputData.phone}}',
          },
        },
      },
    },
  },
};
