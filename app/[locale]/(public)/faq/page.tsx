import { FAQAccordion } from '@/components/features/faq/faq-accordion';
import { FAQRepository } from '@/lib/cms';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * FAQ Page Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.faq' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

/**
 * FAQ Page
 *
 * よくある質問ページ
 * - CMSから動的にFAQを取得
 * - カテゴリ別に表示
 * - アコーディオン形式
 */
export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('public.faq');

  // CMSからFAQを取得
  const faqRepo = new FAQRepository();
  const faqsByCategory = await faqRepo.findByCategories();

  // カテゴリ名の翻訳
  const categoryLabels: Record<string, { ja: string; en: string }> = {
    features: { ja: '機能について', en: 'Features' },
    pricing: { ja: '料金について', en: 'Pricing' },
    technical: { ja: '技術的な質問', en: 'Technical' },
    general: { ja: 'その他', en: 'General' },
  };

  return (
    <div className="min-h-screen py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
            <p className="text-lg text-gray-600">{t('subtitle')}</p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {faqsByCategory.map(({ category, faqs }) => (
              <section key={category}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
                  {categoryLabels[category]?.[locale as 'ja' | 'en'] || category}
                </h2>
                <FAQAccordion faqs={faqs} locale={locale} />
              </section>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contact.title')}</h3>
            <p className="text-gray-600 mb-4">{t('contact.description')}</p>
            <a
              href={`/${locale}/contact`}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('contact.button')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
