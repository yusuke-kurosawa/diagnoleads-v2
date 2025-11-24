'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import { useListLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/use-leads';
import { LeadDialog } from '@/components/features/leads/lead-dialog';
import { LeadDetails } from '@/components/features/leads/lead-details';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus } from 'lucide-react';
import type { Lead } from '@/lib/db/schema';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/features/leads/types';

// Dynamic import for heavy table component (TanStack Table)
// This reduces initial bundle size and improves page load performance
const LeadTable = dynamic(
  () => import('@/components/features/leads/lead-table').then((mod) => ({ default: mod.LeadTable })),
  {
    loading: () => (
      <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    ),
    ssr: false, // Don't render on server (client-only component)
  }
);

/**
 * リード管理ページ
 * TanStack Table による高度なリード一覧表示機能を提供
 */
export default function LeadsPage() {
  const t = useTranslations('leads');
  const organizationId = useRequiredOrganizationId();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Fetch leads list
  const { data: leadsData, isLoading } = useListLeads({
    organizationId,
    limit: 50,
    offset: 0,
  });

  // Mutations
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const handleCreateLead = async (data: Omit<CreateLeadInput, 'organizationId'>) => {
    await createLead.mutateAsync({
      ...data,
      organizationId,
    });
    setCreateDialogOpen(false);
  };

  const handleUpdateLead = async (data: Omit<UpdateLeadInput, 'organizationId' | 'id'>) => {
    if (!selectedLead) return;

    await updateLead.mutateAsync({
      ...data,
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

  const leads = leadsData?.items || [];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('createLead')}
        </Button>
      </div>

      {/* Lead Table */}
      <LeadTable
        leads={leads}
        isLoading={isLoading}
        onLeadClick={handleLeadClick}
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
            <SheetDescription>
              {t('leadDetailsDescription')}
            </SheetDescription>
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
    </div>
  );
}
