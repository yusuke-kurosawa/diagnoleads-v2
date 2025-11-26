'use client';

/**
 * FAQ Create/Edit Dialog Component
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import type { FAQ } from '@/lib/cms/core/types';

const FAQ_CATEGORIES = [
  'general',
  'diagnostic',
  'pricing',
  'account',
  'security',
  'technical',
] as const;

interface FAQDialogProps {
  locale: string;
  mode: 'create' | 'edit';
  faq?: FAQ;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FAQDialog({
  locale,
  mode,
  faq,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: FAQDialogProps) {
  const t = useTranslations('content.faqs');
  const tCommon = useTranslations('common');
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Form state
  const [questionJa, setQuestionJa] = useState(faq?.question.ja ?? '');
  const [questionEn, setQuestionEn] = useState(faq?.question.en ?? '');
  const [answerJa, setAnswerJa] = useState(extractPlainText(faq?.answer.ja) ?? '');
  const [answerEn, setAnswerEn] = useState(extractPlainText(faq?.answer.en) ?? '');
  const [category, setCategory] = useState(faq?.category ?? 'general');
  const [order, setOrder] = useState(faq?.order ?? 0);

  const utils = trpc.useUtils();

  const createMutation = trpc.content.faqs.create.useMutation({
    onSuccess: () => {
      utils.content.faqs.list.invalidate();
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
  });

  const updateMutation = trpc.content.faqs.update.useMutation({
    onSuccess: () => {
      utils.content.faqs.list.invalidate();
      setOpen(false);
      onSuccess?.();
    },
  });

  const resetForm = () => {
    setQuestionJa('');
    setQuestionEn('');
    setAnswerJa('');
    setAnswerEn('');
    setCategory('general');
    setOrder(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        question: { ja: questionJa, en: questionEn },
        answer: {
          ja: { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: answerJa }] }] },
          en: { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: answerEn }] }] },
        },
        category,
        order,
      };

      if (mode === 'edit' && faq) {
        await updateMutation.mutateAsync({ id: faq.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('FAQ save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createNew')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createNew') : t('editFaq')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question - Japanese */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('question')} (日本語)
            </label>
            <input
              type="text"
              value={questionJa}
              onChange={(e) => setQuestionJa(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={t('questionPlaceholder')}
              required
            />
          </div>

          {/* Question - English */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('question')} (English)
            </label>
            <input
              type="text"
              value={questionEn}
              onChange={(e) => setQuestionEn(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={t('questionPlaceholder')}
              required
            />
          </div>

          {/* Answer - Japanese */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('answer')} (日本語)
            </label>
            <textarea
              value={answerJa}
              onChange={(e) => setAnswerJa(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={t('answerPlaceholder')}
              required
            />
          </div>

          {/* Answer - English */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('answer')} (English)
            </label>
            <textarea
              value={answerEn}
              onChange={(e) => setAnswerEn(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={t('answerPlaceholder')}
              required
            />
          </div>

          {/* Category & Order */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('order')}
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min={0}
              />
              <p className="mt-1 text-xs text-gray-500">{t('orderHelp')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function extractPlainText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return content.content
      .map((node: any) => {
        if (node.type === 'paragraph' && Array.isArray(node.content)) {
          return node.content.map((child: any) => child.text || '').join('');
        }
        return '';
      })
      .join('\n');
  }
  return '';
}
