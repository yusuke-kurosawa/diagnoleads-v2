'use client';

/**
 * Blog Post List Component
 *
 * Phase 4.4: コンテンツ管理UI
 */

import type { BlogPost } from '@/lib/cms/core/types';
import { trpc } from '@/lib/trpc/client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BlogDeleteDialog } from './blog-delete-dialog';
import { BlogDialog } from './blog-dialog';

interface BlogListProps {
  locale: string;
}

export function BlogList({ locale }: BlogListProps) {
  const t = useTranslations('content.blog');
  const tCommon = useTranslations('common');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data, isLoading, error, refetch } = trpc.content.blog.list.useQuery({
    locale,
    status: statusFilter,
    limit: 50,
  });

  const posts = data?.posts ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">
          {tCommon('error')}: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="all">{tCommon('selectAll')}</option>
          <option value="published">{t('published')}</option>
          <option value="draft">{t('draft')}</option>
        </select>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {posts.map((post) => (
              <li key={post.id}>
                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50">
                  {/* Cover Image */}
                  <div className="flex-shrink-0 h-16 w-24 rounded overflow-hidden bg-gray-100">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage.url}
                        alt={post.coverImage.alt || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <svg
                          className="h-8 w-8"
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

                  {/* Content */}
                  <div className="min-w-0 flex-1 px-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {post.title[locale as 'ja' | 'en'] || post.title.ja}
                      </p>
                      <span
                        className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.status === 'published' ? t('published') : t('draft')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">/{post.slug}</p>
                    <div className="mt-1 flex items-center text-xs text-gray-400 space-x-4">
                      <span>{post.author.name}</span>
                      <span>{new Date(post.publishedAt).toLocaleDateString(locale)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedPost(post)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title={tCommon('edit')}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(post)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title={tCommon('delete')}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit Dialog */}
      {selectedPost && (
        <BlogDialog
          locale={locale}
          mode="edit"
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
          onSuccess={() => {
            setSelectedPost(null);
            refetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <BlogDeleteDialog
          post={deleteTarget}
          locale={locale}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
