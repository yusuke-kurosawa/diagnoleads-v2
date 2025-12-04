'use client';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead } from '@/lib/db/schema';
import type { LeadStatus } from '@/lib/features/leads/types/schemas';
import { trpc } from '@/lib/trpc/client';
import {
  CheckCircle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedLeads: Lead[];
  organizationId: string;
  onClearSelection: () => void;
  onActionComplete: () => void;
  onExportCSV: (leads: Lead[]) => void;
  onExportJSON: (leads: Lead[]) => void;
  onExportPDF: (leads: Lead[]) => void;
}

const statusOptions: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted'];

export function BulkActions({
  selectedLeads,
  organizationId,
  onClearSelection,
  onActionComplete,
  onExportCSV,
  onExportJSON,
  onExportPDF,
}: BulkActionsProps) {
  const t = useTranslations('leads.bulk');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('new');

  const bulkUpdateStatus = trpc.leads.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(t('updateSuccess', { count: data.updatedCount }));
      onClearSelection();
      onActionComplete();
      setShowStatusDialog(false);
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  const bulkDelete = trpc.leads.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(t('deleteSuccess', { count: data.deletedCount }));
      onClearSelection();
      onActionComplete();
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error(t('deleteError'));
    },
  });

  const handleUpdateStatus = () => {
    bulkUpdateStatus.mutate({
      organizationId,
      ids: selectedLeads.map((lead) => lead.id),
      status: selectedStatus,
    });
  };

  const handleDelete = () => {
    bulkDelete.mutate({
      organizationId,
      ids: selectedLeads.map((lead) => lead.id),
    });
  };

  if (selectedLeads.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {t('selected', { count: selectedLeads.length })}
        </span>

        <div className="flex-1" />

        {/* Update Status */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowStatusDialog(true)}
          className="h-8"
        >
          {t('updateStatus')}
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Download className="h-4 w-4 mr-1" />
              {t('exportSelected')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExportCSV(selectedLeads)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportJSON(selectedLeads)}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportPDF(selectedLeads)}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="h-8"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('deleteSelected')}
        </Button>

        {/* Clear Selection */}
        <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('updateStatusTitle')}</DialogTitle>
            <DialogDescription>
              {t('updateStatusDescription', { count: selectedLeads.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as LeadStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {tStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdateStatus} disabled={bulkUpdateStatus.isPending}>
              {bulkUpdateStatus.isPending ? t('updating') : tCommon('update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deleteConfirmTitle', { count: selectedLeads.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={bulkDelete.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDelete.isPending ? t('deleting') : tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
