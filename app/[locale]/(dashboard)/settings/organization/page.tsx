'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('settings.organization');
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
      toast.loading(t('updating'), { id: 'update-org' });
    },
    onSuccess: () => {
      toast.success(t('updateSuccess'), { id: 'update-org' });
      setHasChanges(false);
      // Refresh the page to get updated data
      router.refresh();
    },
    onError: (error) => {
      toast.error(t('updateError', { message: error.message }), { id: 'update-org' });
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
              {t('notFound')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('notFoundDescription')}
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              {t('backToDashboard')}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">{t('description')}</p>
        </div>

        {/* Non-owner warning */}
        {!isOwner && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">
                  {t('viewMode')}
                </h3>
                <p className="text-sm text-yellow-800">
                  {t('viewModeDescription', {
                    role: currentOrg.role === 'admin' ? t('roleAdmin') : t('roleMember')
                  })}
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
              <Label htmlFor="name">{t('nameLabel')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('namePlaceholder')}
                disabled={!isOwner || updateOrganization.isPending}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                {t('nameHelp')}
              </p>
            </div>

            {/* Organization Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">{t('slugLabel')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder={t('slugPlaceholder')}
                disabled={!isOwner || updateOrganization.isPending}
                required
                pattern="[a-z0-9-]+"
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                {t('slugHelp')}
              </p>
            </div>

            {/* Organization ID (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="id">{t('idLabel')}</Label>
              <Input
                id="id"
                value={currentOrg.id}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                {t('idHelp')}
              </p>
            </div>

            {/* Created At */}
            <div className="space-y-2">
              <Label htmlFor="created">{t('createdAtLabel')}</Label>
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
                  {t('saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || updateOrganization.isPending}
                >
                  {t('reset')}
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
              <p className="font-medium mb-1">{t('hintsTitle')}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t('hintNameChange')}</li>
                <li>{t('hintSlugChange')}</li>
                <li>{t('hintDelete')}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
