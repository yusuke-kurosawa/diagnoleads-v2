/**
 * Members Schemas Tests
 *
 * Unit tests for member management type definitions and validation schemas
 */

import { describe, expect, it } from 'vitest';
import {
  listMembersSchema,
  inviteMemberSchema,
  updateRoleSchema,
  removeMemberSchema,
  acceptInviteSchema,
  type ListMembersInput,
  type InviteMemberInput,
  type UpdateRoleInput,
  type RemoveMemberInput,
  type AcceptInviteInput,
} from '@/lib/features/members/types/schemas';

describe('listMembersSchema', () => {
  it('should accept valid input with defaults', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = listMembersSchema.parse(input);
    expect(result.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('should accept custom pagination', () => {
    const input: ListMembersInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      limit: 25,
      offset: 100,
    };

    const result = listMembersSchema.parse(input);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(100);
  });

  it('should validate limit range', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listMembersSchema.parse({ ...baseInput, limit: 0 })).toThrow();
    expect(() => listMembersSchema.parse({ ...baseInput, limit: 101 })).toThrow();
    expect(listMembersSchema.parse({ ...baseInput, limit: 1 }).limit).toBe(1);
    expect(listMembersSchema.parse({ ...baseInput, limit: 100 }).limit).toBe(100);
  });

  it('should validate offset', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
    };

    expect(() => listMembersSchema.parse({ ...baseInput, offset: -1 })).toThrow();
  });

  it('should reject invalid organizationId', () => {
    expect(() =>
      listMembersSchema.parse({ organizationId: 'invalid-uuid' })
    ).toThrow();
  });
});

describe('inviteMemberSchema', () => {
  it('should accept valid input with default role', () => {
    const input = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'newmember@example.com',
    };

    const result = inviteMemberSchema.parse(input);
    expect(result.email).toBe('newmember@example.com');
    expect(result.role).toBe('member');
  });

  it('should accept admin role', () => {
    const input: InviteMemberInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@example.com',
      role: 'admin',
    };

    const result = inviteMemberSchema.parse(input);
    expect(result.role).toBe('admin');
  });

  it('should reject invalid email', () => {
    expect(() =>
      inviteMemberSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'invalid-email',
      })
    ).toThrow();

    expect(() =>
      inviteMemberSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        email: '',
      })
    ).toThrow();
  });

  it('should reject owner role for invite', () => {
    expect(() =>
      inviteMemberSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'owner',
      })
    ).toThrow();
  });
});

describe('updateRoleSchema', () => {
  it('should accept valid input', () => {
    const input: UpdateRoleInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      membershipId: '123e4567-e89b-12d3-a456-426614174001',
      role: 'admin',
    };

    const result = updateRoleSchema.parse(input);
    expect(result.role).toBe('admin');
  });

  it('should accept all valid roles', () => {
    const baseInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      membershipId: '123e4567-e89b-12d3-a456-426614174001',
    };

    expect(updateRoleSchema.parse({ ...baseInput, role: 'member' }).role).toBe('member');
    expect(updateRoleSchema.parse({ ...baseInput, role: 'admin' }).role).toBe('admin');
    expect(updateRoleSchema.parse({ ...baseInput, role: 'owner' }).role).toBe('owner');
  });

  it('should reject invalid roles', () => {
    expect(() =>
      updateRoleSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        membershipId: '123e4567-e89b-12d3-a456-426614174001',
        role: 'super_admin',
      })
    ).toThrow();
  });

  it('should require all fields', () => {
    expect(() =>
      updateRoleSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'admin',
      })
    ).toThrow();

    expect(() =>
      updateRoleSchema.parse({
        membershipId: '123e4567-e89b-12d3-a456-426614174001',
        role: 'admin',
      })
    ).toThrow();
  });
});

describe('removeMemberSchema', () => {
  it('should accept valid input', () => {
    const input: RemoveMemberInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      membershipId: '123e4567-e89b-12d3-a456-426614174001',
    };

    const result = removeMemberSchema.parse(input);
    expect(result.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.membershipId).toBe('123e4567-e89b-12d3-a456-426614174001');
  });

  it('should reject invalid UUIDs', () => {
    expect(() =>
      removeMemberSchema.parse({
        organizationId: 'invalid',
        membershipId: '123e4567-e89b-12d3-a456-426614174001',
      })
    ).toThrow();

    expect(() =>
      removeMemberSchema.parse({
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        membershipId: 'invalid',
      })
    ).toThrow();
  });
});

describe('acceptInviteSchema', () => {
  it('should accept valid token', () => {
    const token = 'a'.repeat(32);
    const input: AcceptInviteInput = { token };

    const result = acceptInviteSchema.parse(input);
    expect(result.token).toBe(token);
  });

  it('should accept longer tokens', () => {
    const token = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
    const result = acceptInviteSchema.parse({ token });
    expect(result.token).toBe(token);
  });

  it('should reject short tokens', () => {
    expect(() =>
      acceptInviteSchema.parse({ token: 'short' })
    ).toThrow();

    expect(() =>
      acceptInviteSchema.parse({ token: 'a'.repeat(31) })
    ).toThrow();
  });

  it('should accept exactly 32 character token', () => {
    const token = 'a'.repeat(32);
    const result = acceptInviteSchema.parse({ token });
    expect(result.token).toHaveLength(32);
  });
});

describe('Type exports', () => {
  it('should export ListMembersInput type', () => {
    const input: ListMembersInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      limit: 10,
      offset: 0,
    };
    expect(input.limit).toBeDefined();
  });

  it('should export InviteMemberInput type', () => {
    const input: InviteMemberInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'member',
    };
    expect(input.email).toBeDefined();
  });

  it('should export UpdateRoleInput type', () => {
    const input: UpdateRoleInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      membershipId: '123e4567-e89b-12d3-a456-426614174001',
      role: 'admin',
    };
    expect(input.role).toBeDefined();
  });

  it('should export RemoveMemberInput type', () => {
    const input: RemoveMemberInput = {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      membershipId: '123e4567-e89b-12d3-a456-426614174001',
    };
    expect(input.membershipId).toBeDefined();
  });

  it('should export AcceptInviteInput type', () => {
    const input: AcceptInviteInput = {
      token: 'a'.repeat(32),
    };
    expect(input.token).toBeDefined();
  });
});
