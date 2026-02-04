/**
 * API Documentation Types
 *
 * Type definitions for API documentation generation
 */

import type { OpenAPIObject, PathsObject, SchemaObject } from 'openapi3-ts/oas30';

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  summary: string;
  description?: string;
  tags: string[];
  security?: boolean;
  deprecated?: boolean;
  requestBody?: {
    description?: string;
    schema: SchemaObject;
    required?: boolean;
  };
  parameters?: ApiParameter[];
  responses: Record<string, ApiResponse>;
}

/**
 * API parameter
 */
export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: SchemaObject;
}

/**
 * API response
 */
export interface ApiResponse {
  description: string;
  schema?: SchemaObject;
  headers?: Record<string, { description: string; schema: SchemaObject }>;
}

/**
 * API module definition
 */
export interface ApiModule {
  name: string;
  description: string;
  version: string;
  endpoints: ApiEndpoint[];
  schemas?: Record<string, SchemaObject>;
}

/**
 * Documentation configuration
 */
export interface DocConfig {
  title: string;
  version: string;
  description: string;
  servers: Array<{ url: string; description: string }>;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

/**
 * Default documentation config
 */
export const DEFAULT_DOC_CONFIG: DocConfig = {
  title: 'DiagnoLeads v2 API',
  version: '2.0.0',
  description: `AI-Powered B2B Diagnostic Platform API

## Overview

DiagnoLeads is an enterprise-grade SaaS platform for lead generation and scoring using AI.

## Authentication

Most endpoints require authentication via session cookie or Bearer token.

## Rate Limiting

- Standard: 100 requests/minute
- AI endpoints: 20 requests/minute
- Auth endpoints: 5 requests/minute`,
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://diagnoleads-v2.vercel.app', description: 'Production' },
  ],
  contact: {
    name: 'DiagnoLeads Support',
    email: 'support@diagnoleads.com',
  },
  license: {
    name: 'MIT',
  },
};

/**
 * Common schema definitions
 */
export const COMMON_SCHEMAS: Record<string, SchemaObject> = {
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      code: { type: 'string' },
    },
    required: ['error', 'message'],
  },
  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  },
  Timestamp: {
    type: 'object',
    properties: {
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
};

/**
 * API tags
 */
export const API_TAGS = [
  { name: 'System', description: 'System health and status endpoints' },
  { name: 'Auth', description: 'Authentication endpoints' },
  { name: 'Leads', description: 'Lead management operations' },
  { name: 'Organizations', description: 'Organization management' },
  { name: 'Members', description: 'Organization member management' },
  { name: 'Analytics', description: 'Analytics and reporting' },
  { name: 'AI', description: 'AI-powered features' },
  { name: 'Webhooks', description: 'Webhook configuration' },
  { name: 'Diagnostic', description: 'Public diagnostic endpoints' },
  { name: 'Feature Flags', description: 'Feature flag management' },
  { name: 'Audit Logs', description: 'Audit logging' },
  { name: 'Workflows', description: 'Workflow automation' },
  { name: 'Plugins', description: 'Plugin management' },
] as const;
