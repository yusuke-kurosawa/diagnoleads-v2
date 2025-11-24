import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import type {
  ListMembersInput,
  InviteMemberInput,
  UpdateRoleInput,
  RemoveMemberInput,
} from '@/lib/features/members/types/schemas';

/**
 * Hook to list organization members
 */
export function useListMembers(input: ListMembersInput) {
  return trpc.members.list.useQuery(input, {
    staleTime: 2 * 60 * 1000, // 2 minutes
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
      toast.success(data.message ||'招待を送信しました', { id: 'invite-member' });
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
