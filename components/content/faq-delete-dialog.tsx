'use client';

/**
 * FAQ Delete Confirmation Dialog
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { trpc } from '@/lib/trpc/client';
import type { FAQ } from '@/lib/cms/core/types';

interface FAQDeleteDialogProps {
  faq: FAQ;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FAQDeleteDialog({
  faq,
  locale,
  open,
  onOpenChange,
  onSuccess,
}: FAQDeleteDialogProps) {
  const t = useTranslations('content.faqs');
  const tCommon = useTranslations('common');
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.content.faqs.delete.useMutation({
    onSuccess: () => {
      utils.content.faqs.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: faq.id });
    } catch (error) {
      console.error('FAQ delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirmMessage')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {faq.question[locale as 'ja' | 'en'] || faq.question.ja}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? t('saving') : tCommon('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
