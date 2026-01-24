/**
 * CRM Client Interface and Implementations
 * Provides unified interface for interacting with different CRM platforms
 */

import type { CRMIntegration, CRMPlatform, FieldMapping, SyncError } from './types';

/**
 * Lead data to sync to CRM
 */
export interface LeadData {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: string;
  score?: number | null;
  responses?: Record<string, unknown>;
  customFields?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * CRM record result
 */
export interface CRMRecordResult {
  success: boolean;
  crmRecordId?: string;
  action: 'created' | 'updated' | 'skipped';
  error?: SyncError;
}

/**
 * Abstract CRM client interface
 */
export interface ICRMClient {
  platform: CRMPlatform;

  /** Test connection to CRM */
  testConnection(): Promise<{ success: boolean; error?: string }>;

  /** Refresh OAuth tokens if needed */
  refreshToken?(): Promise<{ accessToken: string; refreshToken?: string }>;

  /** Create or update a lead/contact in CRM */
  upsertLead(lead: LeadData, fieldMappings: FieldMapping[]): Promise<CRMRecordResult>;

  /** Batch upsert leads */
  batchUpsertLeads(leads: LeadData[], fieldMappings: FieldMapping[]): Promise<CRMRecordResult[]>;

  /** Search for existing record by email */
  findByEmail(email: string): Promise<{ exists: boolean; recordId?: string }>;

  /** Get available fields from CRM */
  getAvailableFields(): Promise<{ name: string; type: string; required: boolean }[]>;
}

/**
 * Base CRM client with common functionality
 */
export abstract class BaseCRMClient implements ICRMClient {
  abstract platform: CRMPlatform;
  protected integration: CRMIntegration;

  constructor(integration: CRMIntegration) {
    this.integration = integration;
  }

  abstract testConnection(): Promise<{ success: boolean; error?: string }>;
  abstract upsertLead(lead: LeadData, fieldMappings: FieldMapping[]): Promise<CRMRecordResult>;
  abstract findByEmail(email: string): Promise<{ exists: boolean; recordId?: string }>;
  abstract getAvailableFields(): Promise<{ name: string; type: string; required: boolean }[]>;

  /**
   * Batch upsert with default sequential implementation
   * Override in subclass for bulk API support
   */
  async batchUpsertLeads(
    leads: LeadData[],
    fieldMappings: FieldMapping[]
  ): Promise<CRMRecordResult[]> {
    const results: CRMRecordResult[] = [];
    for (const lead of leads) {
      try {
        const result = await this.upsertLead(lead, fieldMappings);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          action: 'skipped',
          error: {
            recordId: lead.id,
            code: 'UPSERT_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          },
        });
      }
    }
    return results;
  }

  /**
   * Map lead data to CRM fields using field mappings
   */
  protected mapLeadToCRMFields(
    lead: LeadData,
    fieldMappings: FieldMapping[]
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    for (const mapping of fieldMappings) {
      const sourceValue = this.getSourceValue(lead, mapping.sourceField);

      if (sourceValue === undefined || sourceValue === null) {
        if (mapping.defaultValue !== undefined) {
          mapped[mapping.targetField] = mapping.defaultValue;
        }
        continue;
      }

      switch (mapping.mappingType) {
        case 'direct':
          mapped[mapping.targetField] = sourceValue;
          break;
        case 'transform':
          mapped[mapping.targetField] = this.applyTransform(sourceValue, mapping.transformFunction);
          break;
        case 'constant':
          mapped[mapping.targetField] = mapping.defaultValue;
          break;
        case 'conditional':
          // Implement conditional logic if needed
          mapped[mapping.targetField] = sourceValue;
          break;
      }
    }

    return mapped;
  }

  /**
   * Get value from lead by field path
   */
  private getSourceValue(lead: LeadData, fieldPath: string): unknown {
    const parts = fieldPath.split('.');
    let value: unknown = lead;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  /**
   * Apply transformation function
   */
  private applyTransform(value: unknown, transformFunction?: string): unknown {
    if (!transformFunction) return value;

    switch (transformFunction) {
      case 'splitFirstName':
        return typeof value === 'string' ? value.split(' ')[0] : value;
      case 'splitLastName':
        return typeof value === 'string' ? value.split(' ').slice(1).join(' ') : value;
      case 'mapStatus':
        return this.mapLeadStatus(value as string);
      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      default:
        return value;
    }
  }

  /**
   * Map internal lead status to CRM status
   */
  protected mapLeadStatus(status: string): string {
    const statusMap: Record<string, string> = {
      new: 'Open - Not Contacted',
      contacted: 'Working - Contacted',
      qualified: 'Qualified',
      converted: 'Converted',
      lost: 'Closed - Not Converted',
    };
    return statusMap[status] || status;
  }
}

/**
 * Salesforce CRM Client (placeholder implementation)
 */
export class SalesforceCRMClient extends BaseCRMClient {
  platform: CRMPlatform = 'salesforce';

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement actual Salesforce connection test
    const { instanceUrl, accessToken } = this.integration.credentials;
    if (!instanceUrl || !accessToken) {
      return { success: false, error: 'Missing Salesforce credentials' };
    }
    return { success: true };
  }

  async upsertLead(lead: LeadData, fieldMappings: FieldMapping[]): Promise<CRMRecordResult> {
    // TODO: Implement actual Salesforce API call
    const mappedData = this.mapLeadToCRMFields(lead, fieldMappings);
    console.log('Salesforce upsert:', mappedData);
    return { success: true, crmRecordId: `sf_${lead.id}`, action: 'created' };
  }

  async findByEmail(email: string): Promise<{ exists: boolean; recordId?: string }> {
    // TODO: Implement Salesforce SOQL query
    return { exists: false };
  }

  async getAvailableFields(): Promise<{ name: string; type: string; required: boolean }[]> {
    // TODO: Implement Salesforce describe call
    return [
      { name: 'Email', type: 'email', required: true },
      { name: 'Name', type: 'string', required: true },
      { name: 'Company', type: 'string', required: false },
      { name: 'Phone', type: 'phone', required: false },
      { name: 'LeadSource', type: 'picklist', required: false },
      { name: 'Status', type: 'picklist', required: false },
    ];
  }
}

/**
 * HubSpot CRM Client (placeholder implementation)
 */
export class HubSpotCRMClient extends BaseCRMClient {
  platform: CRMPlatform = 'hubspot';

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const { accessToken } = this.integration.credentials;
    if (!accessToken) {
      return { success: false, error: 'Missing HubSpot access token' };
    }
    return { success: true };
  }

  async upsertLead(lead: LeadData, fieldMappings: FieldMapping[]): Promise<CRMRecordResult> {
    const mappedData = this.mapLeadToCRMFields(lead, fieldMappings);
    console.log('HubSpot upsert:', mappedData);
    return { success: true, crmRecordId: `hs_${lead.id}`, action: 'created' };
  }

  async findByEmail(email: string): Promise<{ exists: boolean; recordId?: string }> {
    return { exists: false };
  }

  async getAvailableFields(): Promise<{ name: string; type: string; required: boolean }[]> {
    return [
      { name: 'email', type: 'string', required: true },
      { name: 'firstname', type: 'string', required: false },
      { name: 'lastname', type: 'string', required: false },
      { name: 'company', type: 'string', required: false },
      { name: 'phone', type: 'string', required: false },
    ];
  }
}

/**
 * Factory function to create CRM client
 */
export function createCRMClient(integration: CRMIntegration): ICRMClient {
  switch (integration.platform) {
    case 'salesforce':
      return new SalesforceCRMClient(integration);
    case 'hubspot':
      return new HubSpotCRMClient(integration);
    case 'zoho':
    case 'pipedrive':
      // TODO: Implement other clients
      throw new Error(`CRM platform ${integration.platform} not yet implemented`);
    default:
      throw new Error(`Unknown CRM platform: ${integration.platform}`);
  }
}
