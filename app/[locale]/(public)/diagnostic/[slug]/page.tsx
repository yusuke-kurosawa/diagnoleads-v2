import { DynamicDiagnosticForm } from '@/components/features/diagnostic/dynamic-diagnostic-form';
import { DiagnosticFormRepository, type DiagnosticForm } from '@/lib/cms';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface DiagnosticPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Generate metadata for the diagnostic page
 */
export async function generateMetadata({ params }: DiagnosticPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const repository = new DiagnosticFormRepository();

  try {
    const form = await repository.findBySlug(slug);

    if (!form || form.status !== 'published') {
      return {
        title: 'Diagnostic Not Found',
      };
    }

    const title =
      form.seo.metaTitle?.[locale as 'ja' | 'en'] ||
      form.title[locale as 'ja' | 'en'] ||
      form.title.ja;
    const description =
      form.seo.metaDescription?.[locale as 'ja' | 'en'] ||
      form.description?.[locale as 'ja' | 'en'] ||
      '';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: form.seo.ogImage?.url ? [form.seo.ogImage.url] : undefined,
      },
    };
  } catch {
    return {
      title: 'Diagnostic Not Found',
    };
  }
}

/**
 * Generate static params for all published diagnostic forms
 */
export async function generateStaticParams() {
  const repository = new DiagnosticFormRepository();

  try {
    const { forms } = await repository.findAll({ status: 'published' });
    return forms.map((form) => ({ slug: form.slug }));
  } catch {
    return [];
  }
}

/**
 * Dynamic Diagnostic Page
 *
 * Renders a diagnostic form based on CMS content
 */
export default async function DiagnosticSlugPage({ params }: DiagnosticPageProps) {
  const { locale, slug } = await params;
  const repository = new DiagnosticFormRepository();

  let form: DiagnosticForm | null = null;

  try {
    // キャッシュ付きメソッドを使用（5分間キャッシュ）
    form = await repository.findBySlugCached(slug);
  } catch (error) {
    console.error('Error fetching diagnostic form:', error);
  }

  if (!form || form.status !== 'published') {
    notFound();
  }

  const title = form.title[locale as 'ja' | 'en'] || form.title.ja;
  const description = form.description?.[locale as 'ja' | 'en'] || form.description?.ja;

  return (
    <div className="min-h-screen py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>
            {description && <p className="text-lg text-gray-600">{description}</p>}
          </div>

          {/* Dynamic Diagnostic Form */}
          <DynamicDiagnosticForm form={form} locale={locale as 'ja' | 'en'} />
        </div>
      </div>
    </div>
  );
}
