/**
 * Public Blog List Page
 *
 * Phase 4.5: ブログ・お知らせ機能
 * ISR対応、SEO最適化されたブログ一覧ページ
 */

import { getCMSAdapter } from '@/lib/cms/adapters/factory';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface BlogPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; category?: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.blog' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
    },
  };
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { locale } = await params;
  const { page = '1', category } = await searchParams;
  const t = await getTranslations('public.blog');
  const tNav = await getTranslations('public.landing.nav');

  const currentPage = Number.parseInt(page, 10);
  const postsPerPage = 9;

  // Get blog posts from CMS
  const adapter = getCMSAdapter();
  const result = await adapter.find({
    collection: 'blog',
    where: {
      status: 'published',
      ...(category && { category }),
    },
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
    sort: [{ field: 'publishedAt', order: 'desc' }],
    locale,
  });

  const posts = result.data || [];
  const totalPages = Math.ceil((result.meta?.total || 0) / postsPerPage);

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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noPosts')}</h3>
              <p className="mt-2 text-sm text-gray-500">{t('noPostsDescription')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post: any) => {
                  const title = post.title?.[locale] || post.title?.ja || '';
                  const excerpt = post.excerpt?.[locale] || post.excerpt?.ja || '';

                  return (
                    <article
                      key={post.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Cover Image */}
                      <div className="aspect-video bg-gray-100">
                        {post.coverImage?.url ? (
                          <img
                            src={post.coverImage.url}
                            alt={post.coverImage.alt || title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="h-12 w-12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        {/* Category & Date */}
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          {post.category && (
                            <>
                              <span className="text-blue-600">{post.category}</span>
                              <span className="mx-2">·</span>
                            </>
                          )}
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </time>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                          <Link
                            href={`/${locale}/blog/${post.slug}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {title}
                          </Link>
                        </h2>

                        {/* Excerpt */}
                        <p className="text-gray-600 line-clamp-3 mb-4">{excerpt}</p>

                        {/* Author */}
                        {post.author && (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {post.author.avatar?.url ? (
                                <img
                                  src={post.author.avatar.url}
                                  alt={post.author.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-500">
                                  {post.author.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="ml-2 text-sm text-gray-700">{post.author.name}</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-12 flex justify-center">
                  <ul className="flex items-center space-x-2">
                    {currentPage > 1 && (
                      <li>
                        <Link
                          href={`/${locale}/blog?page=${currentPage - 1}${category ? `&category=${category}` : ''}`}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {t('previous')}
                        </Link>
                      </li>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <li key={pageNum}>
                        <Link
                          href={`/${locale}/blog?page=${pageNum}${category ? `&category=${category}` : ''}`}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pageNum === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      </li>
                    ))}

                    {currentPage < totalPages && (
                      <li>
                        <Link
                          href={`/${locale}/blog?page=${currentPage + 1}${category ? `&category=${category}` : ''}`}
                          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {t('next')}
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              )}
            </>
          )}
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
