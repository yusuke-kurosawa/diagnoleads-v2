'use client';

import { useOrganizationId } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Divider, Metric, Text, Title } from '@/components/ui/metric';
import { AlertCircle, Building2, CheckCircle, Clock, Hash, RefreshCw, Save } from 'lucide-react';

/**
 * Organization Settings Page
 * Modern UI enhanced organization settings
 */
export default function OrganizationSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.organization');
  const locale = useLocale();
  const urlOrganizationId = useOrganizationId();
  const organizationId = urlOrganizationId || 'demo-organization';

  const { data: currentOrg, isLoading } = trpc.organizations.getById.useQuery(
    { id: organizationId },
    { staleTime: 5 * 60 * 1000 }
  );

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when organization data loads
  // Handle Drizzle ORM type inference where related data could be object or array
  // Cast to access organization properties since the type inference is complex due to Drizzle relations
  const currentOrgData = currentOrg as
    | { name?: string; slug?: string; id?: string; role: string; membershipId: string }
    | undefined;
  const orgName = currentOrgData?.name;
  const orgSlug = currentOrgData?.slug;

  useEffect(() => {
    if (orgName) {
      setName(orgName);
    }
    if (orgSlug) {
      setSlug(orgSlug);
    }
  }, [orgName, orgSlug]);

  const updateOrganization = trpc.organizations.update.useMutation({
    onMutate: () => {
      toast.loading(t('updating'), { id: 'update-org' });
    },
    onSuccess: () => {
      toast.success(t('updateSuccess'), { id: 'update-org' });
      setHasChanges(false);
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
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(sanitized);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (orgName && orgSlug) {
      setName(orgName);
      setSlug(orgSlug);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
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
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <Title>{t('notFound')}</Title>
            <Text className="mt-2 mb-6">{t('notFoundDescription')}</Text>
            <Button onClick={() => router.push('/dashboard')}>{t('backToDashboard')}</Button>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = currentOrgData?.role === 'owner';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <Text className="mt-1">{t('description')}</Text>
        </div>

        {/* Non-owner warning */}
        {!isOwner && (
          <Callout title={t('viewMode')} icon={AlertCircle} color="yellow">
            {t('viewModeDescription', {
              role: currentOrgData?.role === 'admin' ? t('roleAdmin') : t('roleMember'),
            })}
          </Callout>
        )}

        {/* Organization Profile Card */}
        <Card decoration="top" decorationColor="blue">
          <form onSubmit={handleSubmit} className="p-6">
            {/* Organization Header */}
            <div className="flex items-start justify-between pb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-violet-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <Title>{currentOrgData?.name || ''}</Title>
                  <div className="flex gap-2 mt-1">
                    <Badge color="blue">@{currentOrgData?.slug || ''}</Badge>
                    <Badge color={isOwner ? 'violet' : 'gray'}>
                      {isOwner
                        ? t('roleOwner')
                        : currentOrgData?.role === 'admin'
                          ? t('roleAdmin')
                          : t('roleMember')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-6 pt-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  {t('nameLabel')}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={!isOwner || updateOrganization.isPending}
                  maxLength={100}
                />
                <Text className="text-xs">{t('nameHelp')}</Text>
              </div>

              {/* Organization Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  {t('slugLabel')}
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={t('slugPlaceholder')}
                  disabled={!isOwner || updateOrganization.isPending}
                  maxLength={50}
                />
                <Text className="text-xs">{t('slugHelp')}</Text>
              </div>

              {/* Organization ID (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="id" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  {t('idLabel')}
                </Label>
                <Input
                  id="id"
                  value={currentOrgData?.id || organizationId}
                  disabled
                  className="bg-gray-50"
                />
                <Text className="text-xs">{t('idHelp')}</Text>
              </div>

              {/* Created At */}
              <div className="space-y-2">
                <Label htmlFor="created" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {t('createdAtLabel')}
                </Label>
                <Input
                  id="created"
                  value={
                    (currentOrgData as unknown as { createdAt?: string })?.createdAt
                      ? new Date(
                          (currentOrgData as unknown as { createdAt: string }).createdAt
                        ).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')
                      : ''
                  }
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Action Buttons */}
              {isOwner && (
                <>
                  <Divider />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!hasChanges || updateOrganization.isPending}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {t('saveChanges')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      disabled={!hasChanges || updateOrganization.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('reset')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        </Card>

        {/* Info Callout */}
        <Callout title={t('hintsTitle')} icon={CheckCircle} color="blue">
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>{t('hintNameChange')}</li>
            <li>{t('hintSlugChange')}</li>
            <li>{t('hintDelete')}</li>
          </ul>
        </Callout>
      </div>
    </div>
  );
}
