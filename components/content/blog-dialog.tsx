'use client';

/**
 * Blog Post Create/Edit Dialog Component
 *
 * Phase 4.4: コンテンツ管理UI
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import type { BlogPost } from '@/lib/cms/core/types';

interface BlogDialogProps {
  locale: string;
  mode: 'create' | 'edit';
  post?: BlogPost;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BlogDialog({
  locale,
  mode,
  post,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: BlogDialogProps) {
  const t = useTranslations('content.blog');
  const tCommon = useTranslations('common');
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ja' | 'en'>('ja');

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Form state
  const [titleJa, setTitleJa] = useState(post?.title.ja ?? '');
  const [titleEn, setTitleEn] = useState(post?.title.en ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [contentJa, setContentJa] = useState(extractPlainText(post?.content.ja) ?? '');
  const [contentEn, setContentEn] = useState(extractPlainText(post?.content.en) ?? '');
  const [excerptJa, setExcerptJa] = useState(post?.excerpt?.ja ?? '');
  const [excerptEn, setExcerptEn] = useState(post?.excerpt?.en ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft');

  // Reset form when post changes
  useEffect(() => {
    if (post) {
      setTitleJa(post.title.ja);
      setTitleEn(post.title.en);
      setSlug(post.slug);
      setContentJa(extractPlainText(post.content.ja));
      setContentEn(extractPlainText(post.content.en));
      setExcerptJa(post.excerpt?.ja ?? '');
      setExcerptEn(post.excerpt?.en ?? '');
      setStatus(post.status);
    }
  }, [post]);

  const utils = trpc.useUtils();

  const createMutation = trpc.content.blog.create.useMutation({
    onSuccess: () => {
      utils.content.blog.list.invalidate();
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
  });

  const updateMutation = trpc.content.blog.update.useMutation({
    onSuccess: () => {
      utils.content.blog.list.invalidate();
      setOpen(false);
      onSuccess?.();
    },
  });

  const resetForm = () => {
    setTitleJa('');
    setTitleEn('');
    setSlug('');
    setContentJa('');
    setContentEn('');
    setExcerptJa('');
    setExcerptEn('');
    setStatus('draft');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (lang: 'ja' | 'en', value: string) => {
    if (lang === 'ja') {
      setTitleJa(value);
    } else {
      setTitleEn(value);
      // 英語タイトルからスラッグを自動生成（新規作成時のみ）
      if (mode === 'create' && !slug) {
        setSlug(generateSlug(value));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        title: { ja: titleJa, en: titleEn },
        slug,
        content: {
          ja: { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: contentJa }] }] },
          en: { type: 'doc' as const, content: [{ type: 'paragraph' as const, content: [{ type: 'text' as const, text: contentEn }] }] },
        },
        excerpt: { ja: excerptJa, en: excerptEn },
        status,
      };

      if (mode === 'edit' && post) {
        await updateMutation.mutateAsync({ id: post.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Blog save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === 'create' && (
        <DialogTrigger asChild>
          <Button>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createNew')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('createNew') : t('editPost')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['ja', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveTab(lang)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === lang
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {lang === 'ja' ? '日本語' : 'English'}
                </button>
              ))}
            </nav>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('postTitle')}
            </label>
            {activeTab === 'ja' ? (
              <input
                type="text"
                value={titleJa}
                onChange={(e) => handleTitleChange('ja', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('titlePlaceholder')}
                required
              />
            ) : (
              <input
                type="text"
                value={titleEn}
                onChange={(e) => handleTitleChange('en', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('titlePlaceholder')}
                required
              />
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('slug')}
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('slugPlaceholder')}
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{t('slugHelp')}</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('content')}
            </label>
            {activeTab === 'ja' ? (
              <textarea
                value={contentJa}
                onChange={(e) => setContentJa(e.target.value)}
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('contentPlaceholder')}
                required
              />
            ) : (
              <textarea
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('contentPlaceholder')}
                required
              />
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('excerpt')}
            </label>
            {activeTab === 'ja' ? (
              <textarea
                value={excerptJa}
                onChange={(e) => setExcerptJa(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('excerptPlaceholder')}
              />
            ) : (
              <textarea
                value={excerptEn}
                onChange={(e) => setExcerptEn(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={t('excerptPlaceholder')}
              />
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="draft">{t('draft')}</option>
              <option value="published">{t('published')}</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function extractPlainText(content: any): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (content.type === 'doc' && Array.isArray(content.content)) {
    return content.content
      .map((node: any) => {
        if (node.type === 'paragraph' && Array.isArray(node.content)) {
          return node.content.map((child: any) => child.text || '').join('');
        }
        return '';
      })
      .join('\n');
  }
  return '';
}
