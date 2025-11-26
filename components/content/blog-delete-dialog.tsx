'use client';

/**
 * Blog Post Delete Dialog Component
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import type { BlogPost } from '@/lib/cms/core/types';

interface BlogDeleteDialogProps {
  post: BlogPost;
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BlogDeleteDialog({
  post,
  locale,
  open,
  onOpenChange,
  onSuccess,
}: BlogDeleteDialogProps) {
  const t = useTranslations('content.blog');
  const tCommon = useTranslations('common');
  const [isDeleting, setIsDeleting] = useState(false);

  const utils = trpc.useUtils();

  const deleteMutation = trpc.content.blog.delete.useMutation({
    onSuccess: () => {
      utils.content.blog.list.invalidate();
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: post.id });
    } catch (error) {
      console.error('Blog delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const postTitle = post.title[locale as 'ja' | 'en'] || post.title.ja;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deletePost')}</DialogTitle>
          <DialogDescription>
            {t('deleteConfirmation')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600">
            {t('deleteWarning')}
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{postTitle}</p>
            <p className="text-sm text-gray-500 mt-1">/{post.slug}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
