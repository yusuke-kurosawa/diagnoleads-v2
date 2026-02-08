import { describe, expect, it, vi } from 'vitest';
import {
  type CRMRecordResult,
  HubSpotCRMClient,
  type LeadData,
  SalesforceCRMClient,
  createCRMClient,
} from '@/lib/features/integrations/crm-client';
import type { CRMIntegration, FieldMapping } from '@/lib/features/integrations/types';

describe('crm-client', () => {
  const mockSalesforceIntegration: CRMIntegration = {
    id: 'int-1',
    organizationId: 'org-1',
    platform: 'salesforce',
    name: 'Salesforce Integration',
    credentials: {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHubSpotIntegration: CRMIntegration = {
    id: 'int-2',
    organizationId: 'org-1',
    platform: 'hubspot',
    name: 'HubSpot Integration',
    credentials: {
      accessToken: 'hs-token',
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLead: LeadData = {
    id: 'lead-1',
    email: 'test@example.com',
    name: 'John Doe',
    company: 'Acme Inc',
    phone: '+1234567890',
    source: 'website',
    status: 'new',
    score: 85,
    responses: { q1: 'answer1' },
    customFields: { field1: 'value1' },
    createdAt: new Date(),
  };

  const mockFieldMappings: FieldMapping[] = [
    {
      sourceField: 'email',
      targetField: 'Email',
      mappingType: 'direct',
      isRequired: true,
    },
    {
      sourceField: 'name',
      targetField: 'Name',
      mappingType: 'direct',
      isRequired: true,
    },
    {
      sourceField: 'company',
      targetField: 'Company',
      mappingType: 'direct',
      isRequired: false,
    },
    {
      sourceField: 'name',
      targetField: 'FirstName',
      mappingType: 'transform',
      transformFunction: 'splitFirstName',
      isRequired: false,
    },
    {
      sourceField: 'name',
      targetField: 'LastName',
      mappingType: 'transform',
      transformFunction: 'splitLastName',
      isRequired: false,
    },
    {
      sourceField: 'status',
      targetField: 'Status',
      mappingType: 'transform',
      transformFunction: 'mapStatus',
      isRequired: false,
    },
    {
      sourceField: 'source',
      targetField: 'LeadSource',
      mappingType: 'constant',
      defaultValue: 'Web',
      isRequired: false,
    },
  ];

  describe('SalesforceCRMClient', () => {
    it('should create a Salesforce client', () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      expect(client.platform).toBe('salesforce');
    });

    it('should test connection successfully', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const result = await client.testConnection();
      expect(result.success).toBe(true);
    });

    it('should fail connection test without credentials', async () => {
      const integration: CRMIntegration = {
        ...mockSalesforceIntegration,
        credentials: {},
      };
      const client = new SalesforceCRMClient(integration);
      const result = await client.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing Salesforce credentials');
    });

    it('should upsert lead successfully', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const result = await client.upsertLead(mockLead, mockFieldMappings);
      expect(result.success).toBe(true);
      expect(result.crmRecordId).toBe('sf_lead-1');
      expect(result.action).toBe('created');
    });

    it('should find by email', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const result = await client.findByEmail('test@example.com');
      expect(result.exists).toBe(false);
    });

    it('should get available fields', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const fields = await client.getAvailableFields();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some((f) => f.name === 'Email')).toBe(true);
    });
  });

  describe('HubSpotCRMClient', () => {
    it('should create a HubSpot client', () => {
      const client = new HubSpotCRMClient(mockHubSpotIntegration);
      expect(client.platform).toBe('hubspot');
    });

    it('should test connection successfully', async () => {
      const client = new HubSpotCRMClient(mockHubSpotIntegration);
      const result = await client.testConnection();
      expect(result.success).toBe(true);
    });

    it('should fail connection test without token', async () => {
      const integration: CRMIntegration = {
        ...mockHubSpotIntegration,
        credentials: {},
      };
      const client = new HubSpotCRMClient(integration);
      const result = await client.testConnection();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing HubSpot access token');
    });

    it('should upsert lead successfully', async () => {
      const client = new HubSpotCRMClient(mockHubSpotIntegration);
      const result = await client.upsertLead(mockLead, mockFieldMappings);
      expect(result.success).toBe(true);
      expect(result.crmRecordId).toBe('hs_lead-1');
    });

    it('should find by email', async () => {
      const client = new HubSpotCRMClient(mockHubSpotIntegration);
      const result = await client.findByEmail('test@example.com');
      expect(result.exists).toBe(false);
    });

    it('should get available fields', async () => {
      const client = new HubSpotCRMClient(mockHubSpotIntegration);
      const fields = await client.getAvailableFields();
      expect(fields.length).toBeGreaterThan(0);
      expect(fields.some((f) => f.name === 'email')).toBe(true);
    });
  });

  describe('createCRMClient factory', () => {
    it('should create Salesforce client', () => {
      const client = createCRMClient(mockSalesforceIntegration);
      expect(client.platform).toBe('salesforce');
    });

    it('should create HubSpot client', () => {
      const client = createCRMClient(mockHubSpotIntegration);
      expect(client.platform).toBe('hubspot');
    });

    it('should throw for unimplemented platform', () => {
      const integration: CRMIntegration = {
        ...mockSalesforceIntegration,
        platform: 'zoho',
      };
      expect(() => createCRMClient(integration)).toThrow('not yet implemented');
    });

    it('should throw for unknown platform', () => {
      const integration: CRMIntegration = {
        ...mockSalesforceIntegration,
        platform: 'unknown' as any,
      };
      expect(() => createCRMClient(integration)).toThrow('Unknown CRM platform');
    });
  });

  describe('batchUpsertLeads', () => {
    it('should batch upsert multiple leads', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const leads: LeadData[] = [
        { ...mockLead, id: 'lead-1', email: 'lead1@example.com' },
        { ...mockLead, id: 'lead-2', email: 'lead2@example.com' },
        { ...mockLead, id: 'lead-3', email: 'lead3@example.com' },
      ];

      const results = await client.batchUpsertLeads(leads, mockFieldMappings);

      expect(results.length).toBe(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle errors in batch upsert', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);

      // Override upsertLead to throw on specific lead
      const originalUpsert = client.upsertLead.bind(client);
      client.upsertLead = async (lead, mappings) => {
        if (lead.id === 'lead-error') {
          throw new Error('API Error');
        }
        return originalUpsert(lead, mappings);
      };

      const leads: LeadData[] = [
        { ...mockLead, id: 'lead-1', email: 'lead1@example.com' },
        { ...mockLead, id: 'lead-error', email: 'error@example.com' },
        { ...mockLead, id: 'lead-3', email: 'lead3@example.com' },
      ];

      const results = await client.batchUpsertLeads(leads, mockFieldMappings);

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe('API Error');
      expect(results[2].success).toBe(true);
    });
  });

  describe('field mapping', () => {
    it('should map lead fields correctly with direct mapping', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const directMappings: FieldMapping[] = [
        { sourceField: 'email', targetField: 'Email', mappingType: 'direct', isRequired: true },
        { sourceField: 'company', targetField: 'Company', mappingType: 'direct', isRequired: false },
      ];

      const result = await client.upsertLead(mockLead, directMappings);
      expect(result.success).toBe(true);
    });

    it('should apply transform functions', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const transformMappings: FieldMapping[] = [
        {
          sourceField: 'name',
          targetField: 'FirstName',
          mappingType: 'transform',
          transformFunction: 'splitFirstName',
          isRequired: false,
        },
        {
          sourceField: 'name',
          targetField: 'LastName',
          mappingType: 'transform',
          transformFunction: 'splitLastName',
          isRequired: false,
        },
        {
          sourceField: 'email',
          targetField: 'EmailLower',
          mappingType: 'transform',
          transformFunction: 'toLowerCase',
          isRequired: false,
        },
        {
          sourceField: 'company',
          targetField: 'CompanyUpper',
          mappingType: 'transform',
          transformFunction: 'toUpperCase',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(mockLead, transformMappings);
      expect(result.success).toBe(true);
    });

    it('should use default value for missing fields', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const leadWithoutCompany: LeadData = {
        ...mockLead,
        company: null,
      };

      const mappingsWithDefault: FieldMapping[] = [
        {
          sourceField: 'company',
          targetField: 'Company',
          mappingType: 'direct',
          defaultValue: 'Unknown Company',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(leadWithoutCompany, mappingsWithDefault);
      expect(result.success).toBe(true);
    });

    it('should handle nested field paths', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const nestedMappings: FieldMapping[] = [
        {
          sourceField: 'responses.q1',
          targetField: 'CustomField1',
          mappingType: 'direct',
          isRequired: false,
        },
        {
          sourceField: 'customFields.field1',
          targetField: 'CustomField2',
          mappingType: 'direct',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(mockLead, nestedMappings);
      expect(result.success).toBe(true);
    });

    it('should map lead status correctly', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      
      const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost', 'unknown'];
      
      for (const status of statuses) {
        const lead: LeadData = { ...mockLead, status };
        const statusMapping: FieldMapping[] = [
          {
            sourceField: 'status',
            targetField: 'Status',
            mappingType: 'transform',
            transformFunction: 'mapStatus',
            isRequired: false,
          },
        ];

        const result = await client.upsertLead(lead, statusMapping);
        expect(result.success).toBe(true);
      }
    });

    it('should handle constant mapping type', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const constantMappings: FieldMapping[] = [
        {
          sourceField: 'source',
          targetField: 'LeadSource',
          mappingType: 'constant',
          defaultValue: 'WebForm',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(mockLead, constantMappings);
      expect(result.success).toBe(true);
    });

    it('should handle conditional mapping type', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const conditionalMappings: FieldMapping[] = [
        {
          sourceField: 'score',
          targetField: 'Priority',
          mappingType: 'conditional',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(mockLead, conditionalMappings);
      expect(result.success).toBe(true);
    });

    it('should handle unknown transform function', async () => {
      const client = new SalesforceCRMClient(mockSalesforceIntegration);
      const unknownTransformMapping: FieldMapping[] = [
        {
          sourceField: 'name',
          targetField: 'CustomName',
          mappingType: 'transform',
          transformFunction: 'unknownTransform',
          isRequired: false,
        },
      ];

      const result = await client.upsertLead(mockLead, unknownTransformMapping);
      expect(result.success).toBe(true);
    });
  });
});
