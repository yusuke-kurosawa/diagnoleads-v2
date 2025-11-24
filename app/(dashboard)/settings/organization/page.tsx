'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequiredOrganizationId, useCurrentOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Save, AlertCircle } from 'lucide-react';

/**
 * Organization Settings Page
 * Allows organization owners to update organization details
 *
 * Features:
 * - Organization name editing
 * - Organization slug editing
 * - Owner-only access control
 * - Optimistic updates with toast notifications
 */
export default function OrganizationSettingsPage() {
  const router = useRouter();
  const organizationId = useRequiredOrganizationId();

  // Fetch organization data with role information
  const { data: currentOrg, isLoading } = trpc.organizations.getById.useQuery(
    { id: organizationId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when organization data loads
  useState(() => {
    if (currentOrg) {
      setName(currentOrg.name);
      setSlug(currentOrg.slug);
    }
  });

  const updateOrganization = trpc.organizations.update.useMutation({
    onMutate: () => {
      toast.loading('組織情報を更新中...', { id: 'update-org' });
    },
    onSuccess: () => {
      toast.success('組織情報を更新しました', { id: 'update-org' });
      setHasChanges(false);
      // Refresh the page to get updated data
      router.refresh();
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`, { id: 'update-org' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrg) return;

    await updateOrganization.mutateAsync({
      id: organizationId,
      name: name.trim(),
      slug: slug.trim(),
    });
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleSlugChange = (value: string) => {
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (currentOrg) {
      setName(currentOrg.name);
      setSlug(currentOrg.slug);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mb-8" />
          <Card className="p-6">
            <div className="space-y-6">
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              組織が見つかりません
            </h2>
            <p className="text-gray-600 mb-4">
              組織情報を取得できませんでした
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              ダッシュボードに戻る
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user is owner
  const isOwner = currentOrg.role === 'owner';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">組織設定</h1>
          <p className="text-gray-600">組織の基本情報を管理します</p>
        </div>

        {/* Non-owner warning */}
        {!isOwner && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">
                  閲覧モード
                </h3>
                <p className="text-sm text-yellow-800">
                  組織情報の変更はオーナーのみ可能です。あなたの現在のロールは「
                  {currentOrg.role === 'admin' ? '管理者' : 'メンバー'}」です。
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Settings Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Icon */}
            <div className="flex items-center gap-4 pb-6 border-b">
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentOrg.name}
                </h2>
                <p className="text-sm text-gray-600">@{currentOrg.slug}</p>
              </div>
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">組織名</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="例: 株式会社サンプル"
                disabled={!isOwner || updateOrganization.isPending}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                組織の表示名です。いつでも変更できます。
              </p>
            </div>

            {/* Organization Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">組織スラッグ</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="例: sample-corp"
                disabled={!isOwner || updateOrganization.isPending}
                required
                pattern="[a-z0-9-]+"
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                URLに使用される一意の識別子です。小文字英数字とハイフンのみ使用できます。
              </p>
            </div>

            {/* Organization ID (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="id">組織ID</Label>
              <Input
                id="id"
                value={currentOrg.id}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                システム内部で使用される一意のIDです。変更できません。
              </p>
            </div>

            {/* Created At */}
            <div className="space-y-2">
              <Label htmlFor="created">作成日時</Label>
              <Input
                id="created"
                value={new Date(currentOrg.createdAt).toLocaleString('ja-JP')}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={!hasChanges || updateOrganization.isPending}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  変更を保存
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || updateOrganization.isPending}
                >
                  リセット
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Additional Info */}
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">ヒント</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>組織名はいつでも変更できます</li>
                <li>組織スラッグの変更は慎重に行ってください（URLが変わります）</li>
                <li>組織の削除については管理者にお問い合わせください</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
