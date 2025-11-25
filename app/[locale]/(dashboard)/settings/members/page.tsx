'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import { useListMembers } from '@/hooks/use-members';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Crown, Shield, User as UserIcon, MoreVertical, Trash2, Edit, AlertCircle } from 'lucide-react';

type MemberToRemove = {
  id: string;
  name: string;
  email: string;
} | null;

type MemberToChangeRole = {
  id: string;
  name: string;
  email: string;
  currentRole: 'owner' | 'admin' | 'member';
} | null;

/**
 * Members Management Page
 * Allows admin/owner to manage organization members
 *
 * Features:
 * - Member list with user info and roles
 * - Invite new members (admin/owner only)
 * - Change member roles (admin/owner only)
 * - Remove members (admin/owner only)
 * - Permission-based UI controls
 */
export default function MembersPage() {
  const router = useRouter();
  const t = useTranslations('settings.members');
  const organizationId = useRequiredOrganizationId();

  // Fetch organization data to check permissions
  const { data: currentOrg, isLoading: orgLoading } = trpc.organizations.getById.useQuery(
    { id: organizationId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch members list
  const list = useListMembers({
    organizationId,
    limit: 50,
    offset: 0,
  });

  const utils = trpc.useContext();

  // Member operations with i18n toast notifications
  const invite = trpc.members.invite.useMutation({
    onMutate: () => {
      toast.loading(t('inviting'), { id: 'invite-member' });
    },
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success(t('inviteSuccess'), { id: 'invite-member' });
    },
    onError: (error) => {
      toast.error(t('inviteError', { message: error.message }), { id: 'invite-member' });
    },
  });

  const updateRole = trpc.members.updateRole.useMutation({
    onMutate: () => {
      toast.loading(t('updatingRole'), { id: 'update-role' });
    },
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success(t('roleUpdateSuccess'), { id: 'update-role' });
    },
    onError: (error) => {
      toast.error(t('roleUpdateError', { message: error.message }), { id: 'update-role' });
    },
  });

  const remove = trpc.members.remove.useMutation({
    onMutate: () => {
      toast.loading(t('removing'), { id: 'remove-member' });
    },
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success(t('removeSuccess'), { id: 'remove-member' });
    },
    onError: (error) => {
      toast.error(t('removeError', { message: error.message }), { id: 'remove-member' });
    },
  });

  const members = list.data?.members || [];
  const total = list.data?.total || 0;
  const isLoading = list.isLoading;

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');

  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<MemberToChangeRole>(null);
  const [newRole, setNewRole] = useState<'member' | 'admin' | 'owner'>('member');

  // Permission checks
  const userRole = currentOrg?.role || 'member';
  const canManageMembers = userRole === 'admin' || userRole === 'owner';

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.trim()) return;

    await invite.mutateAsync({
      organizationId,
      email: inviteEmail.trim(),
      role: inviteRole,
    });

    setInviteEmail('');
    setInviteRole('member');
    setInviteDialogOpen(false);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    await remove.mutateAsync({
      organizationId,
      membershipId: memberToRemove.id,
    });

    setMemberToRemove(null);
  };

  const handleChangeRole = async () => {
    if (!memberToChangeRole) return;

    await updateRole.mutateAsync({
      organizationId,
      membershipId: memberToChangeRole.id,
      role: newRole,
    });

    setMemberToChangeRole(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'member':
        return <UserIcon className="h-3 w-3" />;
      default:
        return <UserIcon className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return t('roleOwner');
      case 'admin':
        return t('roleAdmin');
      case 'member':
        return t('roleMember');
      default:
        return role;
    }
  };

  if (list.isLoading || orgLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mb-8" />
          <Card className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        {/* Non-manager warning */}
        {!canManageMembers && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">{t('viewMode')}</h3>
                <p className="text-sm text-yellow-800">
                  {t('viewModeDescription', { role: getRoleLabel(userRole) })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Members List */}
        <Card>
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{t('listTitle')}</h2>
                  <p className="text-sm text-gray-600">{t('memberCount', { count: total })}</p>
                </div>
              </div>

              {canManageMembers && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('inviteButton')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('inviteDialogTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('inviteDialogDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('emailLabel')}</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t('emailPlaceholder')}
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">{t('roleLabel')}</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}
                          >
                            <SelectTrigger id="role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">{t('roleMember')}</SelectItem>
                              <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            {t('roleHelp')}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setInviteDialogOpen(false)}
                        >
                          {t('cancel')}
                        </Button>
                        <Button type="submit" disabled={invite.isPending}>
                          <Mail className="mr-2 h-4 w-4" />
                          {t('sendInvite')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {members.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('noMembers')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('noMembersDescription')}
                </p>
                {canManageMembers && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('inviteFirstMember')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('tableHeaderMember')}</TableHead>
                    <TableHead>{t('tableHeaderRole')}</TableHead>
                    <TableHead>{t('tableHeaderJoinedAt')}</TableHead>
                    {canManageMembers && <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const isOwner = member.role === 'owner';
                    const canModify = canManageMembers && !isOwner;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {member.user?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {member.user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            <span className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              {getRoleLabel(member.role)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString('ja-JP')}
                        </TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            {canModify ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setMemberToChangeRole({
                                      id: member.id,
                                      name: member.user?.name || 'Unknown',
                                      email: member.user?.email || '',
                                      currentRole: member.role,
                                    });
                                    setNewRole(member.role);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setMemberToRemove({
                                      id: member.id,
                                      name: member.user?.name || 'Unknown',
                                      email: member.user?.email || '',
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">{t('hintsTitle')}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t('hintEmailNotification')}</li>
                <li>{t('hintAdminPermissions')}</li>
                <li>{t('hintOwnerRole')}</li>
                <li>{t('hintCannotRemoveSelf')}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Remove Member Dialog */}
        <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToRemove && t('removeDialogDescription', {
                  name: memberToRemove.name,
                  email: memberToRemove.email
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('removeButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Role Dialog */}
        <Dialog open={!!memberToChangeRole} onOpenChange={(open) => !open && setMemberToChangeRole(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('changeRoleDialogTitle')}</DialogTitle>
              <DialogDescription>
                {memberToChangeRole && t('changeRoleDialogDescription', {
                  name: memberToChangeRole.name,
                  email: memberToChangeRole.email
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">{t('newRoleLabel')}</Label>
                <Select
                  value={newRole}
                  onValueChange={(value: 'member' | 'admin' | 'owner') => setNewRole(value)}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">{t('roleMember')}</SelectItem>
                    <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                    {userRole === 'owner' && (
                      <SelectItem value="owner">{t('roleOwner')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {t('roleHelp')}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMemberToChangeRole(null)}
              >
                {t('cancel')}
              </Button>
              <Button onClick={handleChangeRole} disabled={updateRole.isPending}>
                {t('saveChanges')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
