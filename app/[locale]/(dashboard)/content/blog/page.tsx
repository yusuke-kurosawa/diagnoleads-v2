/**
 * Blog Management Page
 *
 * Phase 4.4: コンテンツ管理UI
 * Phase 8.3: TailAdmin Style Update
 */

import { BlogDialog } from '@/components/content/blog-dialog';
import { BlogList } from '@/components/content/blog-list';
import { FileText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

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
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
            <FileText className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{t('description')}</p>
          </div>
        </div>
        <BlogDialog locale={locale} mode="create" />
      </div>

      {/* Blog List */}
      <BlogList locale={locale} />
    </div>
  );
}
