'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import { useMembers } from '@/hooks/use-members';
import { trpc } from '@/lib/trpc/client';
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
  const organizationId = useRequiredOrganizationId();

  // Fetch organization data to check permissions
  const { data: currentOrg, isLoading: orgLoading } = trpc.organizations.getById.useQuery(
    { id: organizationId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Member operations
  const { members, total, isLoading, invite, updateRole, remove } = useMembers(organizationId);

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
        return 'オーナー';
      case 'admin':
        return '管理者';
      case 'member':
        return 'メンバー';
      default:
        return role;
    }
  };

  if (isLoading || orgLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">メンバー管理</h1>
          <p className="text-gray-600">組織メンバーの招待と管理を行います</p>
        </div>

        {/* Non-manager warning */}
        {!canManageMembers && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">閲覧モード</h3>
                <p className="text-sm text-yellow-800">
                  メンバーの招待・変更・削除は管理者またはオーナーのみ可能です。
                  あなたの現在のロールは「{getRoleLabel(userRole)}」です。
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
                  <h2 className="text-xl font-semibold text-gray-900">メンバー一覧</h2>
                  <p className="text-sm text-gray-600">{total}人のメンバー</p>
                </div>
              </div>

              {canManageMembers && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      メンバーを招待
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>メンバーを招待</DialogTitle>
                      <DialogDescription>
                        招待メールを送信します。メンバーはメールのリンクから参加できます。
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">メールアドレス</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@company.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">ロール</Label>
                          <Select
                            value={inviteRole}
                            onValueChange={(value: 'member' | 'admin') => setInviteRole(value)}
                          >
                            <SelectTrigger id="role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">メンバー</SelectItem>
                              <SelectItem value="admin">管理者</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500">
                            管理者はメンバーの招待と管理ができます
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setInviteDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button type="submit" disabled={invite.isPending}>
                          <Mail className="mr-2 h-4 w-4" />
                          招待を送信
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
                  メンバーがいません
                </h3>
                <p className="text-gray-600 mb-4">
                  まだメンバーが招待されていません。
                </p>
                {canManageMembers && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    最初のメンバーを招待
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メンバー</TableHead>
                    <TableHead>ロール</TableHead>
                    <TableHead>参加日</TableHead>
                    {canManageMembers && <TableHead className="text-right">アクション</TableHead>}
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
              <p className="font-medium mb-1">ヒント</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>招待されたメンバーにはメールで通知が送信されます</li>
                <li>管理者はメンバーの招待と管理ができます</li>
                <li>オーナーのロールは変更できません</li>
                <li>自分自身を削除することはできません</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Remove Member Dialog */}
        <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToRemove && (
                  <>
                    <strong>{memberToRemove.name}</strong> ({memberToRemove.email})
                    を組織から削除します。この操作は取り消せません。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-red-600 hover:bg-red-700"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Role Dialog */}
        <Dialog open={!!memberToChangeRole} onOpenChange={(open) => !open && setMemberToChangeRole(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ロールを変更</DialogTitle>
              <DialogDescription>
                {memberToChangeRole && (
                  <>
                    <strong>{memberToChangeRole.name}</strong> のロールを変更します
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-role">新しいロール</Label>
                <Select
                  value={newRole}
                  onValueChange={(value: 'member' | 'admin' | 'owner') => setNewRole(value)}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">メンバー</SelectItem>
                    <SelectItem value="admin">管理者</SelectItem>
                    {userRole === 'owner' && (
                      <SelectItem value="owner">オーナー</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  管理者はメンバーの招待と管理ができます
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMemberToChangeRole(null)}
              >
                キャンセル
              </Button>
              <Button onClick={handleChangeRole} disabled={updateRole.isPending}>
                変更を保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
