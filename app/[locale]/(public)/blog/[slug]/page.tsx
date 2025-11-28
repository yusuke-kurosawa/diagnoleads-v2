/**
 * Public Blog Post Detail Page
 *
 * Phase 4.5: ブログ・お知らせ機能
 * ISR対応、SEO最適化されたブログ詳細ページ
 */

import { getCMSAdapter } from '@/lib/cms/adapters/factory';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const adapter = getCMSAdapter();

  try {
    const result = await adapter.findBySlug({ collection: 'blog', slug, locale });
    const post = result?.data;

    if (!post) {
      return {
        title: 'Post Not Found',
      };
    }

    const postData = post as any;
    const title = postData.title?.[locale] || postData.title?.ja || '';
    const description = postData.excerpt?.[locale] || postData.excerpt?.ja || '';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: postData.publishedAt,
        authors: postData.author?.name ? [postData.author.name] : undefined,
        images: postData.coverImage?.url
          ? [
              {
                url: postData.coverImage.url,
                alt: postData.coverImage.alt || title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: postData.coverImage?.url ? [postData.coverImage.url] : undefined,
      },
    };
  } catch (error) {
    return {
      title: 'Post Not Found',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations('public.blog');
  const tNav = await getTranslations('public.landing.nav');

  const adapter = getCMSAdapter();

  let post;
  try {
    const result = await adapter.findBySlug({ collection: 'blog', slug, locale });
    post = result?.data;
  } catch (error) {
    notFound();
  }

  if (!post || (post as any).status !== 'published') {
    notFound();
  }

  const postData = post as any;
  const title = postData.title?.[locale] || postData.title?.ja || '';
  const content = postData.content?.[locale] || postData.content?.ja || '';

  // Convert rich text content to HTML (simplified)
  const renderContent = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content || !content.content) return '';

    return content.content
      .map((node: any) => {
        if (node.type === 'paragraph') {
          const text = node.content?.map((child: any) => child.text || '').join('') || '';
          return `<p>${text}</p>`;
        }
        if (node.type === 'heading') {
          const level = node.attrs?.level || 2;
          const text = node.content?.map((child: any) => child.text || '').join('') || '';
          return `<h${level}>${text}</h${level}>`;
        }
        return '';
      })
      .join('\n');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href={`/${locale}`} className="text-2xl font-bold text-gray-900">
              DiagnoLeads
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href={`/${locale}/landing`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {tNav('features')}
              </Link>
              <Link href={`/${locale}/blog`} className="text-blue-600 font-medium">
                {t('title')}
              </Link>
              <Link
                href={`/${locale}/faq`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href={`/${locale}/diagnostic`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {tNav('diagnostic')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href={`/${locale}`} className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="hover:text-gray-900">
                  {t('title')}
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 truncate max-w-[200px]">{title}</li>
            </ol>
          </nav>

          {/* Cover Image */}
          {postData.coverImage?.url && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img
                src={postData.coverImage.url}
                alt={postData.coverImage.alt || title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            {/* Category */}
            {postData.category && (
              <span className="inline-block text-blue-600 text-sm font-medium mb-4">
                {postData.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h1>

            {/* Meta */}
            <div className="flex items-center text-gray-500">
              {postData.author && (
                <div className="flex items-center mr-6">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {postData.author.avatar?.url ? (
                      <img
                        src={postData.author.avatar.url}
                        alt={postData.author.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        {postData.author.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{postData.author.name}</p>
                    {postData.author.title && (
                      <p className="text-xs text-gray-500">{postData.author.title}</p>
                    )}
                  </div>
                </div>
              )}

              <time dateTime={postData.publishedAt} className="text-sm">
                {new Date(postData.publishedAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </header>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: renderContent(content) }}
          />

          {/* Tags */}
          {postData.tags && postData.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {postData.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('backToList')}
            </Link>
          </div>
        </div>
      </article>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
          <p className="text-blue-100 mb-8">{t('cta.description')}</p>
          <Link
            href={`/${locale}/diagnostic`}
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© {new Date().getFullYear()} DiagnoLeads. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ISR: Revalidate every 60 seconds
export const revalidate = 60;
