'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Lead } from '@/lib/db/schema';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/features/leads/types';
import { useTranslations } from 'next-intl';
import { LeadForm } from './lead-form';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  organizationId: string;
  onSubmit: (
    data: Omit<CreateLeadInput | UpdateLeadInput, 'organizationId'>
  ) => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * Dialog for creating/editing leads
 * Wraps LeadForm in a Dialog component
 */
export function LeadDialog({
  open,
  onOpenChange,
  lead,
  organizationId,
  onSubmit,
  isLoading,
}: LeadDialogProps) {
  const t = useTranslations('leads');

  const handleSubmit = async (data: Omit<CreateLeadInput | UpdateLeadInput, 'organizationId'>) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? t('editLead') : t('createLeadTitle')}</DialogTitle>
          <DialogDescription>
            {lead ? t('editLeadDescription') : t('createLeadDescription')}
          </DialogDescription>
        </DialogHeader>

        <LeadForm lead={lead || undefined} onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
