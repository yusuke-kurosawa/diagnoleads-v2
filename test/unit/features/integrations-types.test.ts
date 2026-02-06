/**
 * Integrations Types Tests
 *
 * Unit tests for CRM integration type definitions and schemas
 */

import { describe, expect, it } from 'vitest';
import {
  CRM_PLATFORMS,
  INTEGRATION_STATUS,
  FIELD_MAPPING_TYPES,
  SYNC_DIRECTIONS,
  crmIntegrationSchema,
  updateCrmIntegrationSchema,
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

describe('CRM_PLATFORMS', () => {
  it('should have all supported platforms', () => {
    expect(CRM_PLATFORMS).toContain('salesforce');
    expect(CRM_PLATFORMS).toContain('hubspot');
    expect(CRM_PLATFORMS).toContain('zoho');
    expect(CRM_PLATFORMS).toContain('pipedrive');
    expect(CRM_PLATFORMS).toHaveLength(4);
  });
});

describe('INTEGRATION_STATUS', () => {
  it('should have all statuses', () => {
    expect(INTEGRATION_STATUS).toContain('active');
    expect(INTEGRATION_STATUS).toContain('inactive');
    expect(INTEGRATION_STATUS).toContain('error');
    expect(INTEGRATION_STATUS).toContain('pending');
    expect(INTEGRATION_STATUS).toHaveLength(4);
  });
});

describe('FIELD_MAPPING_TYPES', () => {
  it('should have all mapping types', () => {
    expect(FIELD_MAPPING_TYPES).toContain('direct');
    expect(FIELD_MAPPING_TYPES).toContain('transform');
    expect(FIELD_MAPPING_TYPES).toContain('constant');
    expect(FIELD_MAPPING_TYPES).toContain('conditional');
    expect(FIELD_MAPPING_TYPES).toHaveLength(4);
  });
});

describe('SYNC_DIRECTIONS', () => {
  it('should have all sync directions', () => {
    expect(SYNC_DIRECTIONS).toContain('push');
    expect(SYNC_DIRECTIONS).toContain('pull');
    expect(SYNC_DIRECTIONS).toContain('bidirectional');
    expect(SYNC_DIRECTIONS).toHaveLength(3);
  });
});

describe('crmIntegrationSchema', () => {
  it('should accept valid minimal input', () => {
    const input = {
      platform: 'salesforce' as const,
      name: 'My Salesforce',
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    const result = crmIntegrationSchema.parse(input);
    expect(result.platform).toBe('salesforce');
    expect(result.settings.syncDirection).toBe('push'); // default
    expect(result.settings.syncInterval).toBe(60); // default
    expect(result.settings.autoSync).toBe(true); // default
  });

  it('should accept valid full input', () => {
    const input = {
      platform: 'hubspot' as const,
      name: 'HubSpot Integration',
      description: 'Main HubSpot connection',
      credentials: {
        clientId: 'client-123',
        clientSecret: 'secret-456',
        accessToken: 'token-789',
        refreshToken: 'refresh-abc',
      },
      settings: {
        syncDirection: 'bidirectional' as const,
        syncInterval: 30,
        autoSync: true,
        createContacts: true,
        updateExisting: true,
        duplicateHandling: 'update' as const,
      },
      fieldMappings: [
        {
          sourceField: 'email',
          targetField: 'email',
          mappingType: 'direct' as const,
          required: true,
        },
      ],
    };

    const result = crmIntegrationSchema.parse(input);
    expect(result.settings.syncInterval).toBe(30);
    expect(result.fieldMappings).toHaveLength(1);
  });

  it('should reject invalid platform', () => {
    const input = {
      platform: 'invalid',
      name: 'Test',
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    expect(() => crmIntegrationSchema.parse(input)).toThrow();
  });

  it('should validate sync interval range', () => {
    const baseInput = {
      platform: 'salesforce' as const,
      name: 'Test',
      credentials: {},
      fieldMappings: [],
    };

    expect(() =>
      crmIntegrationSchema.parse({
        ...baseInput,
        settings: { syncInterval: 0 },
      })
    ).toThrow();

    expect(() =>
      crmIntegrationSchema.parse({
        ...baseInput,
        settings: { syncInterval: 1441 },
      })
    ).toThrow();

    expect(
      crmIntegrationSchema.parse({
        ...baseInput,
        settings: { syncInterval: 1 },
      }).settings.syncInterval
    ).toBe(1);

    expect(
      crmIntegrationSchema.parse({
        ...baseInput,
        settings: { syncInterval: 1440 },
      }).settings.syncInterval
    ).toBe(1440);
  });

  it('should validate name length', () => {
    const baseInput = {
      platform: 'salesforce' as const,
      credentials: {},
      settings: {},
      fieldMappings: [],
    };

    expect(() =>
      crmIntegrationSchema.parse({ ...baseInput, name: '' })
    ).toThrow();

    expect(() =>
      crmIntegrationSchema.parse({ ...baseInput, name: 'a'.repeat(101) })
    ).toThrow();
  });
});

describe('updateCrmIntegrationSchema', () => {
  it('should accept partial update', () => {
    const input = {
      name: 'Updated Name',
      isActive: false,
    };

    const result = updateCrmIntegrationSchema.parse(input);
    expect(result.name).toBe('Updated Name');
    expect(result.isActive).toBe(false);
  });

  it('should accept empty update', () => {
    const result = updateCrmIntegrationSchema.parse({});
    expect(result).toEqual({});
  });
});

describe('DEFAULT_FIELD_MAPPINGS', () => {
  it('should have mappings for all platforms', () => {
    expect(DEFAULT_FIELD_MAPPINGS.salesforce).toBeDefined();
    expect(DEFAULT_FIELD_MAPPINGS.hubspot).toBeDefined();
    expect(DEFAULT_FIELD_MAPPINGS.zoho).toBeDefined();
    expect(DEFAULT_FIELD_MAPPINGS.pipedrive).toBeDefined();
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

  it('should have valid mapping structure', () => {
    for (const platform of CRM_PLATFORMS) {
      for (const mapping of DEFAULT_FIELD_MAPPINGS[platform]) {
        expect(mapping.id).toBeDefined();
        expect(mapping.sourceField).toBeDefined();
        expect(mapping.targetField).toBeDefined();
        expect(mapping.mappingType).toBeDefined();
        expect(typeof mapping.required).toBe('boolean');
      }
    }
  });
});

describe('CRM_PLATFORM_INFO', () => {
  it('should have info for all platforms', () => {
    for (const platform of CRM_PLATFORMS) {
      const info = CRM_PLATFORM_INFO[platform];
      expect(info.name).toBeDefined();
      expect(info.icon).toBeDefined();
      expect(info.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('should have correct Salesforce info', () => {
    expect(CRM_PLATFORM_INFO.salesforce.name).toBe('Salesforce');
    expect(CRM_PLATFORM_INFO.salesforce.color).toBe('#00A1E0');
  });

  it('should have correct HubSpot info', () => {
    expect(CRM_PLATFORM_INFO.hubspot.name).toBe('HubSpot');
    expect(CRM_PLATFORM_INFO.hubspot.color).toBe('#FF7A59');
  });
});

describe('CRMIntegration interface', () => {
  it('should create valid integration', () => {
    const integration: CRMIntegration = {
      id: 'int-123',
      organizationId: 'org-123',
      platform: 'salesforce',
      name: 'My Salesforce',
      status: 'active',
      credentials: {
        accessToken: 'token',
        instanceUrl: 'https://example.salesforce.com',
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
      syncCount: 100,
      errorCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(integration.status).toBe('active');
    expect(integration.syncCount).toBe(100);
  });
});

describe('FieldMapping interface', () => {
  it('should create valid field mapping', () => {
    const mapping: FieldMapping = {
      id: 'mapping-1',
      sourceField: 'email',
      targetField: 'Email',
      mappingType: 'direct',
      required: true,
    };

    expect(mapping.mappingType).toBe('direct');
  });

  it('should support transform mapping', () => {
    const mapping: FieldMapping = {
      id: 'mapping-2',
      sourceField: 'name',
      targetField: 'FirstName',
      mappingType: 'transform',
      transformFunction: 'splitFirstName',
      required: false,
    };

    expect(mapping.transformFunction).toBe('splitFirstName');
  });
});

describe('SyncJob interface', () => {
  it('should create valid sync job', () => {
    const job: SyncJob = {
      id: 'job-123',
      integrationId: 'int-123',
      organizationId: 'org-123',
      status: 'completed',
      direction: 'push',
      recordsProcessed: 100,
      recordsCreated: 50,
      recordsUpdated: 40,
      recordsFailed: 10,
      errors: [],
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 5000,
    };

    expect(job.recordsProcessed).toBe(100);
    expect(job.status).toBe('completed');
  });
});

describe('SyncError interface', () => {
  it('should create valid sync error', () => {
    const error: SyncError = {
      recordId: 'lead-123',
      field: 'email',
      code: 'DUPLICATE_ENTRY',
      message: 'Email already exists in CRM',
      timestamp: new Date(),
    };

    expect(error.code).toBe('DUPLICATE_ENTRY');
  });
});
