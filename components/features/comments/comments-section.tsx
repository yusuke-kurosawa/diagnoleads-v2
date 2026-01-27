'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { CommentType } from '@/lib/db/schema';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { MessageSquare, StickyNote, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommentForm } from './comment-form';
import { CommentItem, type CommentWithUser } from './comment-item';

interface CommentsSectionProps {
  organizationId: string;
  leadId: string;
  currentUserId: string;
  isAdmin?: boolean;
}

type FilterType = 'all' | 'comment' | 'note' | 'activity';

export function CommentsSection({
  organizationId,
  leadId,
  currentUserId,
  isAdmin = false,
}: CommentsSectionProps) {
  const t = useTranslations('comments');
  const [filter, setFilter] = useState<FilterType>('all');

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.comments.list.useQuery(
    {
      organizationId,
      leadId,
      type: filter,
    },
    { enabled: !!organizationId && !!leadId }
  );

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success(t('createSuccess'));
      utils.comments.list.invalidate({ organizationId, leadId });
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  const updateComment = trpc.comments.update.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      utils.comments.list.invalidate({ organizationId, leadId });
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      utils.comments.list.invalidate({ organizationId, leadId });
    },
    onError: () => {
      toast.error(t('deleteError'));
    },
  });

  const togglePin = trpc.comments.togglePin.useMutation({
    onSuccess: (data) => {
      toast.success(data.isPinned ? t('pinSuccess') : t('unpinSuccess'));
      utils.comments.list.invalidate({ organizationId, leadId });
    },
    onError: () => {
      toast.error(t('pinError'));
    },
  });

  const handleSubmit = (content: string, type?: CommentType) => {
    createComment.mutate({
      organizationId,
      leadId,
      content,
      type: type || 'comment',
    });
  };

  const handleReply = (parentId: string, content: string) => {
    createComment.mutate({
      organizationId,
      leadId,
      content,
      type: 'comment',
      parentId,
    });
  };

  const handleEdit = (id: string, content: string) => {
    updateComment.mutate({
      organizationId,
      id,
      content,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteComment.mutate({
        organizationId,
        id,
      });
    }
  };

  const handleTogglePin = (id: string) => {
    togglePin.mutate({
      organizationId,
      id,
    });
  };

  const comments = data?.items ?? [];
  const filterCounts = {
    all: comments.length,
    comment: comments.filter((c) => c.type === 'comment').length,
    note: comments.filter((c) => c.type === 'note').length,
    activity: comments.filter((c) => c.type === 'activity').length,
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('title')}</h3>
          <Badge color="gray">{data?.total ?? 0}</Badge>
        </div>

        {/* Add new comment/note */}
        <CommentForm
          organizationId={organizationId}
          leadId={leadId}
          onSubmit={handleSubmit}
          isLoading={createComment.isPending}
        />

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            count={filterCounts.all}
          >
            {t('filterAll')}
          </FilterButton>
          <FilterButton
            active={filter === 'comment'}
            onClick={() => setFilter('comment')}
            count={filterCounts.comment}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            {t('filterComments')}
          </FilterButton>
          <FilterButton
            active={filter === 'note'}
            onClick={() => setFilter('note')}
            count={filterCounts.note}
            icon={<StickyNote className="h-3.5 w-3.5" />}
          >
            {t('filterNotes')}
          </FilterButton>
          <FilterButton
            active={filter === 'activity'}
            onClick={() => setFilter('activity')}
            count={filterCounts.activity}
            icon={<Zap className="h-3.5 w-3.5" />}
          >
            {t('filterActivity')}
          </FilterButton>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p>{t('noComments')}</p>
              <p className="text-sm">{t('noCommentsHint')}</p>
            </div>
          ) : (
            comments
              .filter((c) => filter === 'all' || c.type === filter)
              .map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment as CommentWithUser}
                  currentUserId={currentUserId}
                  organizationId={organizationId}
                  leadId={leadId}
                  isAdmin={isAdmin}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onReply={handleReply}
                />
              ))
          )}
        </div>
      </div>
    </Card>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, count, icon, children }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-t-md transition-colors border-b-2 -mb-[2px]',
        active
          ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-medium'
          : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
      )}
    >
      {icon}
      {children}
      {count > 0 && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            active ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
