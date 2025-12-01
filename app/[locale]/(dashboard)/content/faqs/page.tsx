/**
 * FAQ Management Page
 *
 * Phase 4.4: コンテンツ管理UI
 * Phase 8.3: TailAdmin Style Update
 */

import { FAQDialog } from '@/components/content/faq-dialog';
import { FAQList } from '@/components/content/faq-list';
import { HelpCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface FAQsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FAQsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'content.faqs' });

  return {
    title: `${t('title')} - DiagnoLeads`,
    description: t('description'),
  };
}

export default async function FAQsPage({ params }: FAQsPageProps) {
  const { locale } = await params;
  const t = await getTranslations('content.faqs');

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl flex items-center justify-center">
            <HelpCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{t('description')}</p>
          </div>
        </div>
        <FAQDialog locale={locale} mode="create" />
      </div>

      {/* FAQ List */}
      <FAQList locale={locale} />
    </div>
  );
}
