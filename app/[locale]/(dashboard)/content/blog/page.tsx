/**
 * Blog Management Page
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { getTranslations } from 'next-intl/server';
import { BlogList } from '@/components/content/blog-list';
import { BlogDialog } from '@/components/content/blog-dialog';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'content.blog' });

  return {
    title: `${t('title')} - DiagnoLeads`,
    description: t('description'),
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations('content.blog');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('description')}</p>
        </div>
        <BlogDialog locale={locale} mode="create" />
      </div>

      {/* Blog List */}
      <BlogList locale={locale} />
    </div>
  );
}
