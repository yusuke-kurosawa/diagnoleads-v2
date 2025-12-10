import { DiagnosticForm } from '@/components/features/diagnostic/diagnostic-form';
import { DynamicDiagnosticForm } from '@/components/features/diagnostic/dynamic-diagnostic-form';
import { DiagnosticFormRepository, type DiagnosticForm as DiagnosticFormType } from '@/lib/cms';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

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
 * - CMSに診断フォームがある場合は最初のフォームを表示
 * - ない場合はデフォルトのハードコードされたフォームを表示
 * - 複数のフォームがある場合は一覧も表示
 */
export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('public.diagnostic');

  const repository = new DiagnosticFormRepository();
  let forms: DiagnosticFormType[] = [];
  let primaryForm: DiagnosticFormType | null = null;

  try {
    // キャッシュ付きメソッドを使用（5分間キャッシュ）
    const result = await repository.findAllCached({ status: 'published', limit: 10 });
    forms = result.forms;
    primaryForm = forms[0] || null;
  } catch (error) {
    console.error('Error fetching diagnostic forms:', error);
  }

  // If we have a CMS form, use the dynamic renderer
  if (primaryForm) {
    const title = primaryForm.title[locale as 'ja' | 'en'] || primaryForm.title.ja;
    const description =
      primaryForm.description?.[locale as 'ja' | 'en'] || primaryForm.description?.ja;

    return (
      <div className="min-h-screen py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
              {description && <p className="text-lg text-gray-600">{description}</p>}
            </div>

            {/* Dynamic Diagnostic Form from CMS */}
            <DynamicDiagnosticForm form={primaryForm} locale={locale as 'ja' | 'en'} />

            {/* Other Available Diagnostics */}
            {forms.length > 1 && (
              <div className="mt-16">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {locale === 'ja' ? 'その他の診断' : 'Other Diagnostics'}
                </h2>
                <div className="grid gap-4">
                  {forms.slice(1).map((form) => (
                    <Link
                      key={form.id}
                      href={`/${locale}/diagnostic/${form.slug}`}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {form.title[locale as 'ja' | 'en'] || form.title.ja}
                          </h3>
                          {form.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {form.description[locale as 'ja' | 'en'] || form.description.ja}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback to the hardcoded form if no CMS forms available
  return (
    <div className="min-h-screen py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
            <p className="text-lg text-gray-600">{t('subtitle')}</p>
          </div>

          {/* Default Hardcoded Diagnostic Form */}
          <DiagnosticForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
