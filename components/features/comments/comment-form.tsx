'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CommentType } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, StickyNote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface CommentFormProps {
  organizationId: string;
  leadId: string;
  onSubmit: (content: string, type?: CommentType) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  isLoading?: boolean;
}

export function CommentForm({
  organizationId,
  leadId,
  onSubmit,
  onCancel,
  placeholder,
  isReply = false,
  isLoading = false,
}: CommentFormProps) {
  const t = useTranslations('comments');
  const [content, setContent] = useState('');
  const [type, setType] = useState<CommentType>('comment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), type);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Type selector (only for non-reply) */}
      {!isReply && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('comment')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
              type === 'comment'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t('typeComment')}
          </button>
          <button
            type="button"
            onClick={() => setType('note')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
              type === 'note'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            )}
          >
            <StickyNote className="h-3.5 w-3.5" />
            {t('typeNote')}
          </button>
        </div>
      )}

      {/* Text area */}
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            placeholder || (type === 'note' ? t('notePlaceholder') : t('commentPlaceholder'))
          }
          className="min-h-[80px] resize-none pr-12"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          className="absolute bottom-2 right-2"
          disabled={!content.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Cancel button for replies */}
      {isReply && onCancel && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      )}
    </form>
  );
}
