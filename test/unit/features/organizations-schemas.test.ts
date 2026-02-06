/**
 * Organizations Schemas Tests
 *
 * Unit tests for organization type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  getOrganizationSchema,
  listOrganizationsSchema,
  updateOrganizationSchema,
  createOrganizationSchema,
  type GetOrganizationInput,
  type ListOrganizationsInput,
  type UpdateOrganizationInput,
  type CreateOrganizationInput,
} from '@/lib/features/organizations/types/schemas';

describe('getOrganizationSchema', () => {
  it('should accept valid UUID', () => {
    const input: GetOrganizationInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = getOrganizationSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
  });

  it('should reject invalid UUID', () => {
    expect(() =>
      getOrganizationSchema.parse({ id: 'not-a-uuid' })
    ).toThrow();

    expect(() =>
      getOrganizationSchema.parse({ id: '' })
    ).toThrow();
  });
});

describe('listOrganizationsSchema', () => {
  it('should accept empty input with defaults', () => {
    const result = listOrganizationsSchema.parse({});
    expect(result.limit).toBeUndefined(); // Optional with default in schema
    expect(result.offset).toBeUndefined();
  });

  it('should accept pagination options', () => {
    const input: ListOrganizationsInput = {
      limit: 25,
      offset: 50,
    };

    const result = listOrganizationsSchema.parse(input);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(50);
  });

  it('should validate limit range', () => {
    expect(() =>
      listOrganizationsSchema.parse({ limit: 0 })
    ).toThrow();

    expect(() =>
      listOrganizationsSchema.parse({ limit: 101 })
    ).toThrow();

    expect(listOrganizationsSchema.parse({ limit: 1 }).limit).toBe(1);
    expect(listOrganizationsSchema.parse({ limit: 100 }).limit).toBe(100);
  });

  it('should validate offset', () => {
    expect(() =>
      listOrganizationsSchema.parse({ offset: -1 })
    ).toThrow();

    expect(listOrganizationsSchema.parse({ offset: 0 }).offset).toBe(0);
  });
});

describe('updateOrganizationSchema', () => {
  it('should accept minimal update (id only)', () => {
    const input: UpdateOrganizationInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = updateOrganizationSchema.parse(input);
    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.name).toBeUndefined();
  });

  it('should accept name update', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated Organization Name',
    };

    const result = updateOrganizationSchema.parse(input);
    expect(result.name).toBe('Updated Organization Name');
  });

  it('should accept slug update', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      slug: 'new-org-slug',
    };

    const result = updateOrganizationSchema.parse(input);
    expect(result.slug).toBe('new-org-slug');
  });

  it('should accept settings update', () => {
    const input = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      settings: {
        theme: 'dark',
        notifications: true,
      },
    };

    const result = updateOrganizationSchema.parse(input);
    expect(result.settings).toEqual({
      theme: 'dark',
      notifications: true,
    });
  });

  it('should validate slug format', () => {
    const baseInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    // Valid slugs
    expect(
      updateOrganizationSchema.parse({ ...baseInput, slug: 'valid-slug' }).slug
    ).toBe('valid-slug');
    expect(
      updateOrganizationSchema.parse({ ...baseInput, slug: 'org123' }).slug
    ).toBe('org123');
    expect(
      updateOrganizationSchema.parse({ ...baseInput, slug: 'my-org-name' }).slug
    ).toBe('my-org-name');

    // Invalid slugs
    expect(() =>
      updateOrganizationSchema.parse({ ...baseInput, slug: 'Invalid Slug' })
    ).toThrow();

    expect(() =>
      updateOrganizationSchema.parse({ ...baseInput, slug: 'slug_with_underscore' })
    ).toThrow();

    expect(() =>
      updateOrganizationSchema.parse({ ...baseInput, slug: 'UPPERCASE' })
    ).toThrow();
  });

  it('should validate name length', () => {
    const baseInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() =>
      updateOrganizationSchema.parse({ ...baseInput, name: '' })
    ).toThrow();

    expect(() =>
      updateOrganizationSchema.parse({ ...baseInput, name: 'a'.repeat(256) })
    ).toThrow();

    expect(
      updateOrganizationSchema.parse({ ...baseInput, name: 'a'.repeat(255) }).name
    ).toHaveLength(255);
  });
});

describe('createOrganizationSchema', () => {
  it('should accept valid minimal input', () => {
    const input: CreateOrganizationInput = {
      name: 'My Organization',
      slug: 'my-organization',
    };

    const result = createOrganizationSchema.parse(input);
    expect(result.name).toBe('My Organization');
    expect(result.slug).toBe('my-organization');
  });

  it('should accept full input with settings', () => {
    const input = {
      name: 'Enterprise Corp',
      slug: 'enterprise-corp',
      settings: {
        plan: 'enterprise',
        maxUsers: 100,
        features: ['sso', 'audit-logs'],
      },
    };

    const result = createOrganizationSchema.parse(input);
    expect(result.settings).toEqual({
      plan: 'enterprise',
      maxUsers: 100,
      features: ['sso', 'audit-logs'],
    });
  });

  it('should require name', () => {
    expect(() =>
      createOrganizationSchema.parse({ slug: 'my-org' })
    ).toThrow();
  });

  it('should require slug', () => {
    expect(() =>
      createOrganizationSchema.parse({ name: 'My Org' })
    ).toThrow();
  });

  it('should validate name constraints', () => {
    // Empty name
    expect(() =>
      createOrganizationSchema.parse({ name: '', slug: 'valid' })
    ).toThrow();

    // Name too long
    expect(() =>
      createOrganizationSchema.parse({ name: 'a'.repeat(256), slug: 'valid' })
    ).toThrow();
  });

  it('should validate slug constraints', () => {
    // Empty slug
    expect(() =>
      createOrganizationSchema.parse({ name: 'Valid', slug: '' })
    ).toThrow();

    // Slug too long
    expect(() =>
      createOrganizationSchema.parse({ name: 'Valid', slug: 'a'.repeat(256) })
    ).toThrow();

    // Invalid characters
    expect(() =>
      createOrganizationSchema.parse({ name: 'Valid', slug: 'has spaces' })
    ).toThrow();

    expect(() =>
      createOrganizationSchema.parse({ name: 'Valid', slug: 'has.dots' })
    ).toThrow();
  });

  it('should accept valid slug formats', () => {
    const validSlugs = [
      'org',
      'my-org',
      'my-org-123',
      '123-org',
      'a',
      'org-with-many-dashes',
    ];

    for (const slug of validSlugs) {
      const result = createOrganizationSchema.parse({ name: 'Test', slug });
      expect(result.slug).toBe(slug);
    }
  });
});

describe('Type exports', () => {
  it('should export GetOrganizationInput type', () => {
    const input: GetOrganizationInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
    };
    expect(input.id).toBeDefined();
  });

  it('should export ListOrganizationsInput type', () => {
    const input: ListOrganizationsInput = {
      limit: 10,
      offset: 0,
    };
    expect(input.limit).toBeDefined();
  });

  it('should export UpdateOrganizationInput type', () => {
    const input: UpdateOrganizationInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Updated',
    };
    expect(input.name).toBeDefined();
  });

  it('should export CreateOrganizationInput type', () => {
    const input: CreateOrganizationInput = {
      name: 'New Org',
      slug: 'new-org',
    };
    expect(input.name).toBeDefined();
  });
});
