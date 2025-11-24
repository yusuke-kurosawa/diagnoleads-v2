/**
 * Multi-tenant module
 *
 * This module provides functionality for multi-tenant SaaS architecture:
 * - Organization membership verification
 * - Organization context middleware for tRPC
 * - Shared types for organization context
 */

export * from './types';
export * from './middleware/organization';
export * from './helpers/membership';
