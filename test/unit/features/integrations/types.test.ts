/**
 * Integration Types Tests
 *
 * Tests for CRM integration Zod schemas and type definitions
 */

import { describe, expect, it } from 'vitest';
import {
  crmIntegrationSchema,
  updateCrmIntegrationSchema,
  CRM_PLATFORMS,
  INTEGRATION_STATUS,
  FIELD_MAPPING_TYPES,
  SYNC_DIRECTIONS,
  DEFAULT_FIELD_MAPPINGS,
  CRM_PLATFORM_INFO,
  type CRMPlatform,
  type IntegrationStatus,
  type FieldMappingType,
  type SyncDirection,
  type CRMIntegration,
  type FieldMapping,
  type SyncJob,
  type SyncError,
} from '@/lib/features/integrations/types';

describe('CRM Platform constants', () => {
  it('should have correct platforms', () => {
    expect(CRM_PLATFORMS).toEqual(['salesforce', 'hubspot', 'zoho', 'pipedrive']);
  });

  it('should have correct integration statuses', () => {
    expect(INTEGRATION_STATUS).toEqual(['active', 'inactive', 'error', 'pending']);
  });

  it('should have correct field mapping types', () => {
    expect(FIELD_MAPPING_TYPES).toEqual(['direct', 'transform', 'constant', 'conditional']);
  });

  it('should have correct sync directions', () => {
    expect(SYNC_DIRECTIONS).toEqual(['push', 'pull', 'bidirectional']);
  });
});

describe('crmIntegrationSchema', () => {
  it('should validate minimal input', () => {
    const input = {
      platform: 'salesforce',
      name: 'My Salesforce',
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    const result = crmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe('salesforce');
      expect(result.data.settings.syncDirection).toBe('push');
      expect(result.data.settings.syncInterval).toBe(60);
      expect(result.data.settings.autoSync).toBe(true);
    }
  });

  it('should validate full input', () => {
    const input = {
      platform: 'hubspot',
      name: 'HubSpot Integration',
      description: 'Main HubSpot connection',
      credentials: {
        clientId: 'client-123',
        clientSecret: 'secret-456',
        accessToken: 'token-789',
        refreshToken: 'refresh-abc',
        instanceUrl: 'https://api.hubspot.com',
        apiKey: 'api-key-xyz',
      },
      settings: {
        syncDirection: 'bidirectional',
        syncInterval: 30,
        autoSync: false,
        createContacts: false,
        updateExisting: true,
        duplicateHandling: 'skip',
      },
      fieldMappings: [
        {
          sourceField: 'email',
          targetField: 'email',
          mappingType: 'direct',
          required: true,
        },
        {
          sourceField: 'name',
          targetField: 'fullname',
          mappingType: 'transform',
          transformFunction: 'capitalize',
          defaultValue: 'Unknown',
          required: false,
        },
      ],
    };

    const result = crmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject invalid platform', () => {
    const input = {
      platform: 'invalid_crm',
      name: 'Test',
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    const result = crmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const input = {
      platform: 'salesforce',
      name: '',
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    const result = crmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should enforce name max length', () => {
    const input = {
      platform: 'salesforce',
      name: 'a'.repeat(101),
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    const result = crmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should validate sync interval bounds', () => {
    const validMin = crmIntegrationSchema.safeParse({
      platform: 'salesforce',
      name: 'Test',
      credentials: {},
      settings: { syncInterval: 1 },
      fieldMappings: [],
    });
    expect(validMin.success).toBe(true);

    const validMax = crmIntegrationSchema.safeParse({
      platform: 'salesforce',
      name: 'Test',
      credentials: {},
      settings: { syncInterval: 1440 },
      fieldMappings: [],
    });
    expect(validMax.success).toBe(true);

    const invalidMin = crmIntegrationSchema.safeParse({
      platform: 'salesforce',
      name: 'Test',
      credentials: {},
      settings: { syncInterval: 0 },
      fieldMappings: [],
    });
    expect(invalidMin.success).toBe(false);

    const invalidMax = crmIntegrationSchema.safeParse({
      platform: 'salesforce',
      name: 'Test',
      credentials: {},
      settings: { syncInterval: 1441 },
      fieldMappings: [],
    });
    expect(invalidMax.success).toBe(false);
  });

  it('should validate all platforms', () => {
    for (const platform of CRM_PLATFORMS) {
      const result = crmIntegrationSchema.safeParse({
        platform,
        name: `${platform} Integration`,
        credentials: {},
        settings: {},
        fieldMappings: [],
      });
      expect(result.success).toBe(true);
    }
  });

  it('should validate all sync directions', () => {
    for (const syncDirection of SYNC_DIRECTIONS) {
      const result = crmIntegrationSchema.safeParse({
        platform: 'salesforce',
        name: 'Test',
        credentials: {},
        settings: { syncDirection },
        fieldMappings: [],
      });
      expect(result.success).toBe(true);
    }
  });

  it('should validate all duplicate handling options', () => {
    for (const handling of ['skip', 'update', 'create_new']) {
      const result = crmIntegrationSchema.safeParse({
        platform: 'salesforce',
        name: 'Test',
        credentials: {},
        settings: { duplicateHandling: handling },
        fieldMappings: [],
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateCrmIntegrationSchema', () => {
  it('should allow partial updates', () => {
    const input = {
      name: 'Updated Name',
    };

    const result = updateCrmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should allow isActive field', () => {
    const input = {
      isActive: false,
    };

    const result = updateCrmIntegrationSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
    }
  });

  it('should validate empty update', () => {
    const result = updateCrmIntegrationSchema.safeParse({});

    expect(result.success).toBe(true);
  });
});

describe('DEFAULT_FIELD_MAPPINGS', () => {
  it('should have mappings for all platforms', () => {
    for (const platform of CRM_PLATFORMS) {
      expect(DEFAULT_FIELD_MAPPINGS[platform]).toBeDefined();
      expect(Array.isArray(DEFAULT_FIELD_MAPPINGS[platform])).toBe(true);
    }
  });

  it('should have email as required field for all platforms', () => {
    for (const platform of CRM_PLATFORMS) {
      const emailMapping = DEFAULT_FIELD_MAPPINGS[platform].find(
        (m) => m.sourceField === 'email'
      );
      expect(emailMapping).toBeDefined();
      expect(emailMapping?.required).toBe(true);
    }
  });

  it('should have valid mapping types', () => {
    for (const platform of CRM_PLATFORMS) {
      for (const mapping of DEFAULT_FIELD_MAPPINGS[platform]) {
        expect(FIELD_MAPPING_TYPES).toContain(mapping.mappingType);
      }
    }
  });

  it('should have unique IDs per platform', () => {
    for (const platform of CRM_PLATFORMS) {
      const ids = DEFAULT_FIELD_MAPPINGS[platform].map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });
});

describe('CRM_PLATFORM_INFO', () => {
  it('should have info for all platforms', () => {
    for (const platform of CRM_PLATFORMS) {
      expect(CRM_PLATFORM_INFO[platform]).toBeDefined();
      expect(CRM_PLATFORM_INFO[platform].name).toBeDefined();
      expect(CRM_PLATFORM_INFO[platform].icon).toBeDefined();
      expect(CRM_PLATFORM_INFO[platform].color).toBeDefined();
    }
  });

  it('should have valid color formats', () => {
    for (const platform of CRM_PLATFORMS) {
      const color = CRM_PLATFORM_INFO[platform].color;
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('Type definitions', () => {
  it('should have correct CRMIntegration structure', () => {
    const integration: CRMIntegration = {
      id: 'int-123',
      organizationId: 'org-456',
      platform: 'salesforce',
      name: 'My Integration',
      description: 'Test',
      status: 'active',
      credentials: {
        clientId: 'client',
        accessToken: 'token',
      },
      settings: {
        syncDirection: 'push',
        syncInterval: 60,
        autoSync: true,
        createContacts: true,
        updateExisting: true,
        duplicateHandling: 'update',
      },
      fieldMappings: [],
      lastSyncAt: new Date(),
      lastSyncStatus: 'success',
      syncCount: 100,
      errorCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(integration.status).toBe('active');
    expect(integration.platform).toBe('salesforce');
  });

  it('should have correct SyncJob structure', () => {
    const job: SyncJob = {
      id: 'job-123',
      integrationId: 'int-456',
      organizationId: 'org-789',
      status: 'completed',
      direction: 'push',
      recordsProcessed: 100,
      recordsCreated: 80,
      recordsUpdated: 15,
      recordsFailed: 5,
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 5000,
    };

    expect(job.status).toBe('completed');
    expect(job.recordsProcessed).toBe(100);
  });

  it('should have correct SyncError structure', () => {
    const error: SyncError = {
      recordId: 'rec-123',
      field: 'email',
      code: 'INVALID_FORMAT',
      message: 'Invalid email format',
      timestamp: new Date(),
    };

    expect(error.code).toBe('INVALID_FORMAT');
  });

  it('should have correct FieldMapping structure', () => {
    const mapping: FieldMapping = {
      id: 'map-1',
      sourceField: 'name',
      targetField: 'Name',
      mappingType: 'transform',
      transformFunction: 'uppercase',
      defaultValue: 'N/A',
      required: true,
    };

    expect(mapping.mappingType).toBe('transform');
    expect(mapping.required).toBe(true);
  });
});
