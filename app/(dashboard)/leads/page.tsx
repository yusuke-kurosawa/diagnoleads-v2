'use client';

import { useState } from 'react';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import { useListLeads, useCreateLead, useUpdateLead, useDeleteLead } from '@/hooks/use-leads';
import { LeadTable } from '@/components/features/leads/lead-table';
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

/**
 * リード管理ページ
 * TanStack Table による高度なリード一覧表示機能を提供
 */
export default function LeadsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">リード管理</h1>
          <p className="text-gray-600 mt-1">
            診断フォームから取得したリードを管理します
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          新規リード追加
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
            <SheetTitle>リード詳細</SheetTitle>
            <SheetDescription>
              リードの詳細情報を確認し、編集や削除ができます
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
