'use client';

/**
 * FAQ List Component
 *
 * Phase 4.4: コンテンツ管理UI
 */

import type { FAQ } from '@/lib/cms/core/types';
import { trpc } from '@/lib/trpc/client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { FAQDeleteDialog } from './faq-delete-dialog';
import { FAQDialog } from './faq-dialog';

interface FAQListProps {
  locale: string;
}

export function FAQList({ locale }: FAQListProps) {
  const t = useTranslations('content.faqs');
  const tCommon = useTranslations('common');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  // tRPC経由でFAQを取得（CMS経由）
  const { data, isLoading, error, refetch } = trpc.content.faqs.list.useQuery({
    locale,
    limit: 50,
  });

  const faqs = data?.faqs ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          {tCommon('error')}: {error.message}
        </p>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noFaqs')}</h3>
        <p className="mt-2 text-sm text-gray-500">{t('noFaqsDescription')}</p>
      </div>
    );
  }

  // カテゴリ別にグループ化
  const faqsByCategory = faqs.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const category = faq.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
        <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-700">
              {t(`categories.${category}` as any)}
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {categoryFaqs
              .sort((a, b) => a.order - b.order)
              .map((faq) => (
                <li key={faq.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {faq.question[locale as 'ja' | 'en'] || faq.question.ja}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {/* RichTextコンテンツからプレーンテキストを抽出 */}
                        {extractPlainText(faq.answer[locale as 'ja' | 'en'] || faq.answer.ja)}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        <span>
                          {t('order')}: {faq.order}
                        </span>
                        <span>ID: {faq.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedFAQ(faq)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title={tCommon('edit')}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(faq)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title={tCommon('delete')}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {/* Edit Dialog */}
      {selectedFAQ && (
        <FAQDialog
          locale={locale}
          mode="edit"
          faq={selectedFAQ}
          open={!!selectedFAQ}
          onOpenChange={(open) => !open && setSelectedFAQ(null)}
          onSuccess={() => {
            setSelectedFAQ(null);
            refetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <FAQDeleteDialog
          faq={deleteTarget}
          locale={locale}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

/**
 * RichTextコンテンツからプレーンテキストを抽出
 */
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
      .join(' ');
  }
  return '';
}
