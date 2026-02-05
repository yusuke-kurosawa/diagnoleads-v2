/**
 * Hierarchy Router Tests
 *
 * Unit tests for organization hierarchy (Holdings/Group) API
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Schema definitions matching the router
const organizationIdSchema = z.object({
  organizationId: z.string().uuid(),
});

const setParentSchema = z.object({
  organizationId: z.string().uuid(),
  parentOrganizationId: z.string().uuid().nullable(),
});

const updateDataSharingPolicySchema = z.object({
  organizationId: z.string().uuid(),
  policy: z.object({
    allowParentAccess: z.boolean(),
    allowChildAccess: z.boolean(),
    allowSiblingAccess: z.boolean(),
    sharedFields: z.array(z.string()).optional(),
  }),
});

const updateOrganizationTypeSchema = z.object({
  organizationId: z.string().uuid(),
  organizationType: z.enum(['holding', 'subsidiary', 'independent']),
});

// Organization types
const ORGANIZATION_TYPES = ['holding', 'subsidiary', 'independent'] as const;

// Sample UUIDs
const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';
const SAMPLE_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';

describe('Hierarchy Router', () => {
  describe('Organization ID Schema', () => {
    it('should accept valid UUID', () => {
      const result = organizationIdSchema.parse({
        organizationId: SAMPLE_UUID,
      });

      expect(result.organizationId).toBe(SAMPLE_UUID);
    });

    it('should reject invalid UUID', () => {
      expect(() =>
        organizationIdSchema.parse({ organizationId: 'invalid' })
      ).toThrow();
    });

    it('should require organizationId', () => {
      expect(() => organizationIdSchema.parse({})).toThrow();
    });
  });

  describe('Set Parent Schema', () => {
    it('should accept valid parent relationship', () => {
      const result = setParentSchema.parse({
        organizationId: SAMPLE_UUID,
        parentOrganizationId: SAMPLE_UUID_2,
      });

      expect(result.organizationId).toBe(SAMPLE_UUID);
      expect(result.parentOrganizationId).toBe(SAMPLE_UUID_2);
    });

    it('should accept null parent (make independent)', () => {
      const result = setParentSchema.parse({
        organizationId: SAMPLE_UUID,
        parentOrganizationId: null,
      });

      expect(result.parentOrganizationId).toBeNull();
    });

    it('should reject invalid UUIDs', () => {
      expect(() =>
        setParentSchema.parse({
          organizationId: 'invalid',
          parentOrganizationId: SAMPLE_UUID,
        })
      ).toThrow();
    });
  });

  describe('Data Sharing Policy Schema', () => {
    it('should accept valid policy', () => {
      const result = updateDataSharingPolicySchema.parse({
        organizationId: SAMPLE_UUID,
        policy: {
          allowParentAccess: true,
          allowChildAccess: true,
          allowSiblingAccess: false,
          sharedFields: ['name', 'email', 'company'],
        },
      });

      expect(result.policy.allowParentAccess).toBe(true);
      expect(result.policy.allowChildAccess).toBe(true);
      expect(result.policy.allowSiblingAccess).toBe(false);
      expect(result.policy.sharedFields).toEqual(['name', 'email', 'company']);
    });

    it('should accept policy without sharedFields', () => {
      const result = updateDataSharingPolicySchema.parse({
        organizationId: SAMPLE_UUID,
        policy: {
          allowParentAccess: false,
          allowChildAccess: false,
          allowSiblingAccess: false,
        },
      });

      expect(result.policy.sharedFields).toBeUndefined();
    });

    it('should require all boolean fields', () => {
      expect(() =>
        updateDataSharingPolicySchema.parse({
          organizationId: SAMPLE_UUID,
          policy: {
            allowParentAccess: true,
            // Missing other fields
          },
        })
      ).toThrow();
    });
  });

  describe('Organization Type Schema', () => {
    it('should accept all valid types', () => {
      for (const type of ORGANIZATION_TYPES) {
        const result = updateOrganizationTypeSchema.parse({
          organizationId: SAMPLE_UUID,
          organizationType: type,
        });
        expect(result.organizationType).toBe(type);
      }
    });

    it('should reject invalid type', () => {
      expect(() =>
        updateOrganizationTypeSchema.parse({
          organizationId: SAMPLE_UUID,
          organizationType: 'invalid',
        })
      ).toThrow();
    });
  });
});

describe('Hierarchy Tree Structure', () => {
  interface HierarchyNode {
    id: string;
    name: string;
    organizationType: string;
    hierarchyLevel: number;
    parentOrganizationId: string | null;
    childCount: number;
    children?: HierarchyNode[];
  }

  // Sample hierarchy
  const sampleHierarchy: HierarchyNode = {
    id: 'holding-1',
    name: 'Holdings Corp',
    organizationType: 'holding',
    hierarchyLevel: 0,
    parentOrganizationId: null,
    childCount: 2,
    children: [
      {
        id: 'sub-1',
        name: 'Subsidiary A',
        organizationType: 'subsidiary',
        hierarchyLevel: 1,
        parentOrganizationId: 'holding-1',
        childCount: 1,
        children: [
          {
            id: 'sub-1-1',
            name: 'Sub-subsidiary',
            organizationType: 'subsidiary',
            hierarchyLevel: 2,
            parentOrganizationId: 'sub-1',
            childCount: 0,
          },
        ],
      },
      {
        id: 'sub-2',
        name: 'Subsidiary B',
        organizationType: 'subsidiary',
        hierarchyLevel: 1,
        parentOrganizationId: 'holding-1',
        childCount: 0,
      },
    ],
  };

  it('should have correct root node', () => {
    expect(sampleHierarchy.parentOrganizationId).toBeNull();
    expect(sampleHierarchy.hierarchyLevel).toBe(0);
    expect(sampleHierarchy.organizationType).toBe('holding');
  });

  it('should have correct child count', () => {
    expect(sampleHierarchy.childCount).toBe(2);
    expect(sampleHierarchy.children?.length).toBe(2);
  });

  it('should have correct hierarchy levels', () => {
    expect(sampleHierarchy.hierarchyLevel).toBe(0);
    expect(sampleHierarchy.children?.[0].hierarchyLevel).toBe(1);
    expect(sampleHierarchy.children?.[0].children?.[0].hierarchyLevel).toBe(2);
  });

  it('should link children to parent', () => {
    const child = sampleHierarchy.children?.[0];
    expect(child?.parentOrganizationId).toBe(sampleHierarchy.id);
  });
});

describe('Hierarchy Traversal', () => {
  // Helper functions for hierarchy traversal
  function getDescendants(
    node: { id: string; children?: Array<{ id: string; children?: any[] }> },
    result: string[] = []
  ): string[] {
    if (node.children) {
      for (const child of node.children) {
        result.push(child.id);
        getDescendants(child, result);
      }
    }
    return result;
  }

  function getAncestors(
    nodeId: string,
    nodes: Map<string, string | null>
  ): string[] {
    const ancestors: string[] = [];
    let currentParent = nodes.get(nodeId);
    
    while (currentParent) {
      ancestors.push(currentParent);
      currentParent = nodes.get(currentParent);
    }
    
    return ancestors;
  }

  const hierarchy = {
    id: 'root',
    children: [
      {
        id: 'child-1',
        children: [
          { id: 'grandchild-1' },
          { id: 'grandchild-2' },
        ],
      },
      { id: 'child-2' },
    ],
  };

  const parentMap = new Map<string, string | null>([
    ['root', null],
    ['child-1', 'root'],
    ['child-2', 'root'],
    ['grandchild-1', 'child-1'],
    ['grandchild-2', 'child-1'],
  ]);

  it('should get all descendants', () => {
    const descendants = getDescendants(hierarchy);

    expect(descendants).toContain('child-1');
    expect(descendants).toContain('child-2');
    expect(descendants).toContain('grandchild-1');
    expect(descendants).toContain('grandchild-2');
    expect(descendants.length).toBe(4);
  });

  it('should get ancestors', () => {
    const ancestors = getAncestors('grandchild-1', parentMap);

    expect(ancestors).toEqual(['child-1', 'root']);
  });

  it('should return empty for root ancestors', () => {
    const ancestors = getAncestors('root', parentMap);

    expect(ancestors).toEqual([]);
  });
});

describe('Data Sharing Policy', () => {
  interface DataSharingPolicy {
    allowParentAccess: boolean;
    allowChildAccess: boolean;
    allowSiblingAccess: boolean;
    sharedFields?: string[];
  }

  function canAccessData(
    requestorType: 'parent' | 'child' | 'sibling',
    policy: DataSharingPolicy
  ): boolean {
    switch (requestorType) {
      case 'parent':
        return policy.allowParentAccess;
      case 'child':
        return policy.allowChildAccess;
      case 'sibling':
        return policy.allowSiblingAccess;
      default:
        return false;
    }
  }

  const restrictivePolicy: DataSharingPolicy = {
    allowParentAccess: false,
    allowChildAccess: false,
    allowSiblingAccess: false,
  };

  const openPolicy: DataSharingPolicy = {
    allowParentAccess: true,
    allowChildAccess: true,
    allowSiblingAccess: true,
    sharedFields: ['name', 'email', 'company', 'score'],
  };

  it('should deny all access with restrictive policy', () => {
    expect(canAccessData('parent', restrictivePolicy)).toBe(false);
    expect(canAccessData('child', restrictivePolicy)).toBe(false);
    expect(canAccessData('sibling', restrictivePolicy)).toBe(false);
  });

  it('should allow all access with open policy', () => {
    expect(canAccessData('parent', openPolicy)).toBe(true);
    expect(canAccessData('child', openPolicy)).toBe(true);
    expect(canAccessData('sibling', openPolicy)).toBe(true);
  });

  it('should support selective sharing', () => {
    const selectivePolicy: DataSharingPolicy = {
      allowParentAccess: true,
      allowChildAccess: false,
      allowSiblingAccess: false,
    };

    expect(canAccessData('parent', selectivePolicy)).toBe(true);
    expect(canAccessData('child', selectivePolicy)).toBe(false);
  });

  it('should filter shared fields', () => {
    const allFields = ['name', 'email', 'company', 'score', 'phone', 'notes'];
    const sharedFields = openPolicy.sharedFields || [];

    const visibleFields = allFields.filter((f) => sharedFields.includes(f));

    expect(visibleFields).toEqual(['name', 'email', 'company', 'score']);
    expect(visibleFields).not.toContain('phone');
    expect(visibleFields).not.toContain('notes');
  });
});

describe('Group Statistics', () => {
  interface OrgStats {
    id: string;
    leadCount: number;
    convertedCount: number;
    avgScore: number;
  }

  function aggregateGroupStats(stats: OrgStats[]): {
    totalLeads: number;
    totalConverted: number;
    overallAvgScore: number;
    conversionRate: number;
  } {
    const totalLeads = stats.reduce((sum, s) => sum + s.leadCount, 0);
    const totalConverted = stats.reduce((sum, s) => sum + s.convertedCount, 0);
    const weightedScore = stats.reduce((sum, s) => sum + s.avgScore * s.leadCount, 0);

    return {
      totalLeads,
      totalConverted,
      overallAvgScore: totalLeads > 0 ? weightedScore / totalLeads : 0,
      conversionRate: totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0,
    };
  }

  const subsidiaryStats: OrgStats[] = [
    { id: 'sub-1', leadCount: 100, convertedCount: 25, avgScore: 72 },
    { id: 'sub-2', leadCount: 50, convertedCount: 15, avgScore: 68 },
    { id: 'sub-3', leadCount: 150, convertedCount: 45, avgScore: 75 },
  ];

  it('should aggregate total leads', () => {
    const aggregate = aggregateGroupStats(subsidiaryStats);

    expect(aggregate.totalLeads).toBe(300);
  });

  it('should aggregate total converted', () => {
    const aggregate = aggregateGroupStats(subsidiaryStats);

    expect(aggregate.totalConverted).toBe(85);
  });

  it('should calculate overall conversion rate', () => {
    const aggregate = aggregateGroupStats(subsidiaryStats);

    expect(aggregate.conversionRate).toBeCloseTo(28.33, 1);
  });

  it('should calculate weighted average score', () => {
    const aggregate = aggregateGroupStats(subsidiaryStats);

    // Weighted: (72*100 + 68*50 + 75*150) / 300 = 73
    expect(aggregate.overallAvgScore).toBeCloseTo(73, 0);
  });

  it('should handle empty stats', () => {
    const aggregate = aggregateGroupStats([]);

    expect(aggregate.totalLeads).toBe(0);
    expect(aggregate.conversionRate).toBe(0);
    expect(aggregate.overallAvgScore).toBe(0);
  });
});

describe('Access Control', () => {
  it('should determine accessible organizations', () => {
    const userMemberships = ['org-1', 'org-2'];
    const orgHierarchy = new Map([
      ['org-1', ['org-1-1', 'org-1-2']],
      ['org-2', []],
    ]);

    const accessibleOrgs = new Set<string>();

    for (const membership of userMemberships) {
      accessibleOrgs.add(membership);
      const descendants = orgHierarchy.get(membership) || [];
      for (const desc of descendants) {
        accessibleOrgs.add(desc);
      }
    }

    expect(accessibleOrgs.has('org-1')).toBe(true);
    expect(accessibleOrgs.has('org-1-1')).toBe(true);
    expect(accessibleOrgs.has('org-1-2')).toBe(true);
    expect(accessibleOrgs.has('org-2')).toBe(true);
    expect(accessibleOrgs.size).toBe(4);
  });
});
