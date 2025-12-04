'use client';

import { ImportDialog } from '@/components/features/leads/import-dialog';
import { LeadDetails } from '@/components/features/leads/lead-details';
import { LeadDialog } from '@/components/features/leads/lead-dialog';
import { useCreateLead, useDeleteLead, useListLeads, useUpdateLead } from '@/hooks/use-leads';
import { useOrganization } from '@/hooks/use-organization';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Metric, Text, Title } from '@/components/ui/metric';
import { ProgressBar } from '@/components/ui/progress-bar';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Lead } from '@/lib/db/schema';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/features/leads/types';
import { Plus, Target, TrendingUp, Upload, UserCheck, Users } from 'lucide-react';

// Dynamic import for heavy table component (TanStack Table)
const LeadTable = dynamic(
  () =>
    import('@/components/features/leads/lead-table').then((mod) => ({ default: mod.LeadTable })),
  {
    loading: () => (
      <Card className="animate-pulse p-4">
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </Card>
    ),
    ssr: false,
  }
);

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * リード管理ページ
 * Tailwind v4互換のモダンなリード一覧表示
 */

export default function LeadsPage() {
  const t = useTranslations('leads');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { organizationId: contextOrgId, isLoading: contextLoading } = useOrganization();

  // Only use organization ID if it's a valid UUID
  const hasValidOrgId = Boolean(contextOrgId && isValidUUID(contextOrgId));
  const organizationId = hasValidOrgId && contextOrgId ? contextOrgId : '';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch leads list
  const {
    data: leadsData,
    isLoading,
    refetch,
  } = useListLeads({
    organizationId,
    limit: 100,
    offset: 0,
  });

  // Mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const leads = leadsData?.items || [];

  // Calculate stats
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contactedLeads = leads.filter((l) => l.status === 'contacted').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified').length;
  const convertedLeads = leads.filter((l) => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
  const averageScore =
    leads.length > 0 ? leads.reduce((acc, l) => acc + (l.score || 0), 0) / leads.length : 0;

  const handleCreateLead = async (
    data: Omit<CreateLeadInput | UpdateLeadInput, 'organizationId'>
  ) => {
    // Cast to CreateLeadInput for create operation (status is required)
    const createData = data as Omit<CreateLeadInput, 'organizationId'>;
    await createLead.mutateAsync({
      ...createData,
      organizationId,
    });
    setCreateDialogOpen(false);
  };

  const handleUpdateLead = async (
    data: Omit<CreateLeadInput | UpdateLeadInput, 'organizationId'>
  ) => {
    if (!selectedLead) return;

    // Cast to UpdateLeadInput for update operation
    const updateData = data as Omit<UpdateLeadInput, 'organizationId' | 'id'>;
    await updateLead.mutateAsync({
      ...updateData,
      id: selectedLead.id,
      organizationId,
    });
    setEditDialogOpen(false);
    setDetailsSheetOpen(false);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    await deleteLead.mutateAsync({
      id: selectedLead.id,
      organizationId,
    });
    setDetailsSheetOpen(false);
    setSelectedLead(null);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailsSheetOpen(true);
  };

  const handleEditClick = () => {
    setDetailsSheetOpen(false);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
            <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <Text className="mt-1">{t('description')}</Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-5 w-5 mr-2" />
            {tCommon('import')}
          </Button>
          <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-5 w-5 mr-2" />
            {t('createLead')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <Card className="p-6" decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('totalLeads')}</Text>
              <Metric className="mt-2">
                {totalLeads.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
              </Metric>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Badge color="blue">{tStatus('new')}</Badge>
            <Text>{newLeads}</Text>
          </div>
        </Card>

        {/* Active Leads */}
        <Card className="p-6" decoration="top" decorationColor="yellow">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('activeLeads') || 'Active Leads'}</Text>
              <Metric className="mt-2">
                {(contactedLeads + qualifiedLeads).toLocaleString(
                  locale === 'ja' ? 'ja-JP' : 'en-US'
                )}
              </Metric>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge color="yellow">{tStatus('contacted')}</Badge>
              <Text>{contactedLeads}</Text>
            </div>
            <div className="flex items-center justify-between">
              <Badge color="emerald">{tStatus('qualified')}</Badge>
              <Text>{qualifiedLeads}</Text>
            </div>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6" decoration="top" decorationColor="violet">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('conversionRate') || 'Conversion Rate'}</Text>
              <Metric className="mt-2">{conversionRate.toFixed(1)}%</Metric>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <UserCheck className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={conversionRate} color="violet" />
            <div className="mt-2 flex items-center justify-between">
              <Badge color="violet">{tStatus('converted')}</Badge>
              <Text>{convertedLeads}</Text>
            </div>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-6" decoration="top" decorationColor="emerald">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('averageScore') || 'Average Score'}</Text>
              <Metric className="mt-2">
                {averageScore.toFixed(0)}
                <span className="text-lg font-normal text-gray-500">/100</span>
              </Metric>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={averageScore} color="emerald" />
          </div>
        </Card>
      </div>

      {/* Lead Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        organizationId={organizationId}
        onLeadClick={handleLeadClick}
        onRefresh={() => refetch()}
      />

      {/* Create Lead Dialog */}
      <LeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={organizationId}
        onSubmit={handleCreateLead}
        isLoading={createLead.isPending}
      />

      {/* Edit Lead Dialog */}
      <LeadDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        lead={selectedLead}
        organizationId={organizationId}
        onSubmit={handleUpdateLead}
        isLoading={updateLead.isPending}
      />

      {/* Lead Details Sheet */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('leadDetails')}</SheetTitle>
            <SheetDescription>{t('leadDetailsDescription')}</SheetDescription>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-6">
              <LeadDetails
                lead={selectedLead}
                onEdit={handleEditClick}
                onDelete={handleDeleteLead}
                isDeleting={deleteLead.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        organizationId={organizationId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
