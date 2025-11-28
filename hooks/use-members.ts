import type {
  InviteMemberInput,
  ListMembersInput,
  RemoveMemberInput,
  UpdateRoleInput,
} from '@/lib/features/members/types/schemas';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Hook to list organization members
 * Automatically disabled for invalid organization IDs (demo mode)
 */
export function useListMembers(input: ListMembersInput) {
  const isValidOrg = isValidUUID(input.organizationId);

  return trpc.members.list.useQuery(input, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isValidOrg,
  });
}

/**
 * Hook to invite a new member
 */
export function useInviteMember() {
  const utils = trpc.useContext();

  return trpc.members.invite.useMutation({
    onMutate: () => {
      toast.loading('招待を送信中...', { id: 'invite-member' });
    },
    onSuccess: (data) => {
      utils.members.list.invalidate();
      toast.success(data.message || '招待を送信しました', { id: 'invite-member' });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'invite-member' });
    },
  });
}

/**
 * Hook to update member role
 */
export function useUpdateRole() {
  const utils = trpc.useContext();

  return trpc.members.updateRole.useMutation({
    onMutate: () => {
      toast.loading('ロールを変更中...', { id: 'update-role' });
    },
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success('ロールを変更しました', { id: 'update-role' });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'update-role' });
    },
  });
}

/**
 * Hook to remove a member
 */
export function useRemoveMember() {
  const utils = trpc.useContext();

  return trpc.members.remove.useMutation({
    onMutate: () => {
      toast.loading('メンバーを削除中...', { id: 'remove-member' });
    },
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success('メンバーを削除しました', { id: 'remove-member' });
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'remove-member' });
    },
  });
}

/**
 * Composite hook for all member operations
 */
export function useMembers(organizationId: string) {
  const list = useListMembers({
    organizationId,
    limit: 50,
    offset: 0,
  });

  const invite = useInviteMember();
  const updateRole = useUpdateRole();
  const remove = useRemoveMember();

  return {
    members: list.data?.members || [],
    total: list.data?.total || 0,
    isLoading: list.isLoading,
    invite,
    updateRole,
    remove,
  };
}
