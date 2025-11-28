import { DiagnosticForm } from '@/components/features/diagnostic/diagnostic-form';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * Diagnostic Page Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.diagnostic' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

/**
 * Diagnostic Page
 *
 * 公開診断フォームページ
 * - 埋め込み可能
 * - 多言語対応
 * - レスポンシブデザイン
 */
export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('public.diagnostic');

  return (
    <div className="min-h-screen py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
            <p className="text-lg text-gray-600">{t('subtitle')}</p>
          </div>

          {/* Diagnostic Form */}
          <DiagnosticForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
