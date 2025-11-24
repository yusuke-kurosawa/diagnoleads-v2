'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { Organization } from '@/lib/db/schema';

/**
 * Organization Context Type
 *
 * Provides organization state management across the application
 */
export interface OrganizationContextType {
  /** Currently selected organization ID */
  organizationId: string | null;
  /** Currently selected organization data */
  organization: Organization | null;
  /** Set the current organization */
  setOrganization: (orgId: string, org?: Organization) => void;
  /** Clear the current organization */
  clearOrganization: () => void;
  /** Whether the organization is loading */
  isLoading: boolean;
}

/**
 * Organization Context
 */
const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'diagnoleads:current-organization';

/**
 * Organization Provider
 *
 * Provides organization context to the application.
 * Handles:
 * - Organization ID persistence (localStorage)
 * - Automatic restoration on page load
 * - URL-based organization detection
 * - Session synchronization
 *
 * @example
 * ```tsx
 * <OrganizationProvider>
 *   <App />
 * </OrganizationProvider>
 * ```
 */
export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organization, setOrganizationData] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  /**
   * Restore organization from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOrganizationId(parsed.id);
        setOrganizationData(parsed.organization || null);
      }
    } catch (error) {
      console.error('Failed to restore organization:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Detect organization from URL params
   * Pattern: /dashboard/[organizationId]/...
   */
  useEffect(() => {
    const match = pathname?.match(/\/dashboard\/([a-f0-9-]{36})\//);
    if (match && match[1] && match[1] !== organizationId) {
      setOrganizationId(match[1]);
    }
  }, [pathname, organizationId]);

  /**
   * Persist organization to localStorage
   */
  useEffect(() => {
    if (organizationId) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            id: organizationId,
            organization,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error('Failed to persist organization:', error);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [organizationId, organization]);

  /**
   * Set organization
   */
  const setOrganization = useCallback((orgId: string, org?: Organization) => {
    setOrganizationId(orgId);
    if (org) {
      setOrganizationData(org);
    }
  }, []);

  /**
   * Clear organization
   */
  const clearOrganization = useCallback(() => {
    setOrganizationId(null);
    setOrganizationData(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: OrganizationContextType = {
    organizationId,
    organization,
    setOrganization,
    clearOrganization,
    isLoading,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Use Organization Context
 *
 * Access organization state from anywhere in the component tree
 *
 * @throws Error if used outside OrganizationProvider
 * @example
 * ```tsx
 * const { organizationId, setOrganization } = useOrganizationContext();
 * ```
 */
export function useOrganizationContext(): OrganizationContextType {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      'useOrganizationContext must be used within OrganizationProvider'
    );
  }

  return context;
}
