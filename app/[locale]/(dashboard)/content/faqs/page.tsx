/**
 * FAQ Management Page
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { FAQDialog } from '@/components/content/faq-dialog';
import { FAQList } from '@/components/content/faq-list';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>
        <FAQDialog locale={locale} mode="create" />
      </div>

      {/* FAQ List */}
      <FAQList locale={locale} />
    </div>
  );
}
