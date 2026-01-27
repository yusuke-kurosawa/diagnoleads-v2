'use client';

import { useListMembers } from '@/hooks/use-members';
import { useOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Metric, Text, Title } from '@/components/ui/metric';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrganizationRole } from '@/lib/db/schema';
import {
  AlertCircle,
  CheckCircle,
  Crown,
  Edit,
  Mail,
  Shield,
  Trash2,
  User as UserIcon,
  UserPlus,
  Users,
} from 'lucide-react';

type MemberToRemove = {
  id: string;
  name: string;
  email: string;
} | null;

type MemberToChangeRole = {
  id: string;
  name: string;
  email: string;
  currentRole: OrganizationRole;
} | null;

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Members Management Page
 * Modern UI enhanced member management
 */
export default function MembersPage() {
  const router = useRouter();
  const t = useTranslations('settings.members');
  const locale = useLocale();
  const { organizationId: contextOrgId, isLoading: contextLoading } = useOrganization();

  // Only use organization ID if it's a valid UUID
  const hasValidOrgId = Boolean(contextOrgId && isValidUUID(contextOrgId));
  const organizationId = hasValidOrgId && contextOrgId ? contextOrgId : '';

  const { data: currentOrg, isLoading: orgLoading } = trpc.organizations.getById.useQuery(
    { id: contextOrgId! },
    {
      enabled: hasValidOrgId,
      staleTime: 5 * 60 * 1000,
    }
  );

  const list = useListMembers({
    organizationId,
    limit: 50,
    offset: 0,
  });

  const utils = trpc.useContext();

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

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove>(null);
  const [memberToChangeRole, setMemberToChangeRole] = useState<MemberToChangeRole>(null);
  const [newRole, setNewRole] = useState<'member' | 'admin' | 'owner'>('member');

  const userRole = currentOrg?.role || 'member';
  const canManageMembers = userRole === 'admin' || userRole === 'owner';

  // Calculate stats
  const ownerCount = members.filter((m) => m.role === 'owner').length;
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const memberCount = members.filter((m) => m.role === 'member').length;

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

  const getRoleBadgeColor = (role: string): 'violet' | 'blue' | 'gray' => {
    switch (role) {
      case 'owner':
        return 'violet';
      case 'admin':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
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

  const isLoading = contextLoading || (hasValidOrgId && (list.isLoading || orgLoading));

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <Text className="mt-1">{t('description')}</Text>
        </div>

        {/* Non-manager warning */}
        {!canManageMembers && (
          <Callout title={t('viewMode')} icon={AlertCircle} color="yellow">
            {t('viewModeDescription', { role: getRoleLabel(userRole) })}
          </Callout>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card decoration="top" decorationColor="blue" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Text>Total Members</Text>
                <Metric className="mt-2">{total}</Metric>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card decoration="top" decorationColor="violet" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Text>{t('roleOwner')}</Text>
                <Metric className="mt-2">{ownerCount}</Metric>
              </div>
              <div className="p-3 bg-violet-50 rounded-xl">
                <Crown className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </Card>
          <Card decoration="top" decorationColor="blue" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Text>{t('roleAdmin')}</Text>
                <Metric className="mt-2">{adminCount}</Metric>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card decoration="top" decorationColor="emerald" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <Text>{t('roleMember')}</Text>
                <Metric className="mt-2">{memberCount}</Metric>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <UserIcon className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Members List */}
        <Card className="overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Title>{t('listTitle')}</Title>
                  <Text>{t('memberCount', { count: total })}</Text>
                </div>
              </div>

              {canManageMembers && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <UserPlus className="h-5 w-5 mr-2" />
                      {t('inviteButton')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('inviteDialogTitle')}</DialogTitle>
                      <DialogDescription>{t('inviteDialogDescription')}</DialogDescription>
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
                          <select
                            id="role"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="member">{t('roleMember')}</option>
                            <option value="admin">{t('roleAdmin')}</option>
                          </select>
                          <p className="text-xs text-gray-500">{t('roleHelp')}</p>
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-blue-400" />
                </div>
                <Title>{t('noMembers')}</Title>
                <Text className="mt-2 mb-6">{t('noMembersDescription')}</Text>
                {canManageMembers && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
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
                    {canManageMembers && (
                      <TableHead className="text-right">{t('tableHeaderActions')}</TableHead>
                    )}
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
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-violet-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {(Array.isArray(member.user)
                                  ? member.user[0]?.name
                                  : member.user?.name) || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {(Array.isArray(member.user)
                                  ? member.user[0]?.email
                                  : member.user?.email) || 'No email'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color={getRoleBadgeColor(member.role)}>
                            <span className="flex items-center gap-1.5">
                              {getRoleIcon(member.role)}
                              {getRoleLabel(member.role)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Text>
                            {new Date(member.createdAt).toLocaleDateString(
                              locale === 'ja' ? 'ja-JP' : 'en-US'
                            )}
                          </Text>
                        </TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            {canModify ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Only standard roles (member/admin/owner) can be changed via UI
                                    const standardRole = (
                                      ['member', 'admin', 'owner'].includes(member.role)
                                        ? member.role
                                        : 'member'
                                    ) as 'member' | 'admin' | 'owner';
                                    setMemberToChangeRole({
                                      id: member.id,
                                      name:
                                        (Array.isArray(member.user)
                                          ? member.user[0]?.name
                                          : member.user?.name) || 'Unknown',
                                      email:
                                        (Array.isArray(member.user)
                                          ? member.user[0]?.email
                                          : member.user?.email) || '',
                                      currentRole: member.role,
                                    });
                                    setNewRole(standardRole);
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
                                      name:
                                        (Array.isArray(member.user)
                                          ? member.user[0]?.name
                                          : member.user?.name) || 'Unknown',
                                      email:
                                        (Array.isArray(member.user)
                                          ? member.user[0]?.email
                                          : member.user?.email) || '',
                                    })
                                  }
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Text>—</Text>
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

        {/* Info Callout */}
        <Callout title={t('hintsTitle')} icon={CheckCircle} color="blue">
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>{t('hintEmailNotification')}</li>
            <li>{t('hintAdminPermissions')}</li>
            <li>{t('hintOwnerRole')}</li>
            <li>{t('hintCannotRemoveSelf')}</li>
          </ul>
        </Callout>

        {/* Remove Member Dialog */}
        <AlertDialog
          open={!!memberToRemove}
          onOpenChange={(open) => !open && setMemberToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('removeDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToRemove &&
                  t('removeDialogDescription', {
                    name: memberToRemove.name,
                    email: memberToRemove.email,
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
        <Dialog
          open={!!memberToChangeRole}
          onOpenChange={(open) => !open && setMemberToChangeRole(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('changeRoleDialogTitle')}</DialogTitle>
              <DialogDescription>
                {memberToChangeRole &&
                  t('changeRoleDialogDescription', {
                    name: memberToChangeRole.name,
                    email: memberToChangeRole.email,
                  })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">{t('newRoleLabel')}</Label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'member' | 'admin' | 'owner')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="member">{t('roleMember')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                  {userRole === 'owner' && <option value="owner">{t('roleOwner')}</option>}
                </select>
                <p className="text-xs text-gray-500">{t('roleHelp')}</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMemberToChangeRole(null)}>
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
