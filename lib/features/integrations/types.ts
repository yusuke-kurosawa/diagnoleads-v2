import { z } from 'zod';

/**
 * Supported CRM platforms
 */
export const CRM_PLATFORMS = ['salesforce', 'hubspot', 'zoho', 'pipedrive'] as const;
export type CRMPlatform = (typeof CRM_PLATFORMS)[number];

/**
 * Integration status
 */
export const INTEGRATION_STATUS = ['active', 'inactive', 'error', 'pending'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUS)[number];

/**
 * Field mapping types
 */
export const FIELD_MAPPING_TYPES = ['direct', 'transform', 'constant', 'conditional'] as const;
export type FieldMappingType = (typeof FIELD_MAPPING_TYPES)[number];

/**
 * Sync direction
 */
export const SYNC_DIRECTIONS = ['push', 'pull', 'bidirectional'] as const;
export type SyncDirection = (typeof SYNC_DIRECTIONS)[number];

/**
 * CRM Integration Configuration Schema
 */
export const crmIntegrationSchema = z.object({
  platform: z.enum(CRM_PLATFORMS),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  credentials: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    instanceUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
  }),
  settings: z.object({
    syncDirection: z.enum(SYNC_DIRECTIONS).default('push'),
    syncInterval: z.number().int().min(1).max(1440).default(60), // minutes
    autoSync: z.boolean().default(true),
    createContacts: z.boolean().default(true),
    updateExisting: z.boolean().default(true),
    duplicateHandling: z.enum(['skip', 'update', 'create_new']).default('update'),
  }),
  fieldMappings: z.array(
    z.object({
      sourceField: z.string(),
      targetField: z.string(),
      mappingType: z.enum(FIELD_MAPPING_TYPES).default('direct'),
      transformFunction: z.string().optional(),
      defaultValue: z.unknown().optional(),
      required: z.boolean().default(false),
    })
  ),
});

export type CRMIntegrationInput = z.infer<typeof crmIntegrationSchema>;

/**
 * Update integration schema (partial)
 */
export const updateCrmIntegrationSchema = crmIntegrationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateCRMIntegrationInput = z.infer<typeof updateCrmIntegrationSchema>;

/**
 * CRM Integration record
 */
export interface CRMIntegration {
  id: string;
  organizationId: string;
  platform: CRMPlatform;
  name: string;
  description?: string;
  status: IntegrationStatus;
  credentials: {
    clientId?: string;
    clientSecret?: string; // encrypted
    accessToken?: string; // encrypted
    refreshToken?: string; // encrypted
    instanceUrl?: string;
    apiKey?: string; // encrypted
  };
  settings: {
    syncDirection: SyncDirection;
    syncInterval: number;
    autoSync: boolean;
    createContacts: boolean;
    updateExisting: boolean;
    duplicateHandling: 'skip' | 'update' | 'create_new';
  };
  fieldMappings: FieldMapping[];
  lastSyncAt?: Date;
  lastSyncStatus?: 'success' | 'partial' | 'failed';
  lastSyncError?: string;
  syncCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Field mapping configuration
 */
export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  mappingType: FieldMappingType;
  transformFunction?: string;
  defaultValue?: unknown;
  required: boolean;
}

/**
 * Sync job record
 */
export interface SyncJob {
  id: string;
  integrationId: string;
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  direction: SyncDirection;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

/**
 * Sync error detail
 */
export interface SyncError {
  recordId?: string;
  field?: string;
  code: string;
  message: string;
  timestamp: Date;
}

/**
 * Default field mappings for each CRM platform
 */
export const DEFAULT_FIELD_MAPPINGS: Record<CRMPlatform, FieldMapping[]> = {
  salesforce: [
    { id: '1', sourceField: 'email', targetField: 'Email', mappingType: 'direct', required: true },
    { id: '2', sourceField: 'name', targetField: 'Name', mappingType: 'direct', required: false },
    {
      id: '3',
      sourceField: 'company',
      targetField: 'Company',
      mappingType: 'direct',
      required: false,
    },
    { id: '4', sourceField: 'phone', targetField: 'Phone', mappingType: 'direct', required: false },
    {
      id: '5',
      sourceField: 'source',
      targetField: 'LeadSource',
      mappingType: 'direct',
      required: false,
    },
    {
      id: '6',
      sourceField: 'status',
      targetField: 'Status',
      mappingType: 'transform',
      transformFunction: 'mapStatus',
      required: false,
    },
  ],
  hubspot: [
    { id: '1', sourceField: 'email', targetField: 'email', mappingType: 'direct', required: true },
    {
      id: '2',
      sourceField: 'name',
      targetField: 'firstname',
      mappingType: 'transform',
      transformFunction: 'splitFirstName',
      required: false,
    },
    {
      id: '3',
      sourceField: 'name',
      targetField: 'lastname',
      mappingType: 'transform',
      transformFunction: 'splitLastName',
      required: false,
    },
    {
      id: '4',
      sourceField: 'company',
      targetField: 'company',
      mappingType: 'direct',
      required: false,
    },
    { id: '5', sourceField: 'phone', targetField: 'phone', mappingType: 'direct', required: false },
    {
      id: '6',
      sourceField: 'source',
      targetField: 'hs_lead_status',
      mappingType: 'direct',
      required: false,
    },
  ],
  zoho: [
    { id: '1', sourceField: 'email', targetField: 'Email', mappingType: 'direct', required: true },
    {
      id: '2',
      sourceField: 'name',
      targetField: 'Full_Name',
      mappingType: 'direct',
      required: false,
    },
    {
      id: '3',
      sourceField: 'company',
      targetField: 'Company',
      mappingType: 'direct',
      required: false,
    },
    { id: '4', sourceField: 'phone', targetField: 'Phone', mappingType: 'direct', required: false },
    {
      id: '5',
      sourceField: 'source',
      targetField: 'Lead_Source',
      mappingType: 'direct',
      required: false,
    },
  ],
  pipedrive: [
    { id: '1', sourceField: 'email', targetField: 'email', mappingType: 'direct', required: true },
    { id: '2', sourceField: 'name', targetField: 'name', mappingType: 'direct', required: false },
    {
      id: '3',
      sourceField: 'company',
      targetField: 'org_name',
      mappingType: 'direct',
      required: false,
    },
    { id: '4', sourceField: 'phone', targetField: 'phone', mappingType: 'direct', required: false },
  ],
};

/**
 * CRM platform display info
 */
export const CRM_PLATFORM_INFO: Record<CRMPlatform, { name: string; icon: string; color: string }> =
  {
    salesforce: { name: 'Salesforce', icon: 'salesforce', color: '#00A1E0' },
    hubspot: { name: 'HubSpot', icon: 'hubspot', color: '#FF7A59' },
    zoho: { name: 'Zoho CRM', icon: 'zoho', color: '#C8202B' },
    pipedrive: { name: 'Pipedrive', icon: 'pipedrive', color: '#017737' },
  };
