'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CommentType, LeadComment, User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Reply,
  StickyNote,
  Trash2,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { CommentForm } from './comment-form';

// Extended comment type with user info and replies
export type CommentWithUser = LeadComment & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
  replies?: CommentWithUser[];
};

interface CommentItemProps {
  comment: CommentWithUser;
  currentUserId: string;
  organizationId: string;
  leadId: string;
  isAdmin?: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onReply?: (parentId: string, content: string) => void;
  isNested?: boolean;
}

const typeIcons: Record<CommentType, React.ReactNode> = {
  comment: <MessageSquare className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  activity: <Zap className="h-4 w-4" />,
};

const typeColors: Record<CommentType, string> = {
  comment: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  note: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  activity: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700',
};

export function CommentItem({
  comment,
  currentUserId,
  organizationId,
  leadId,
  isAdmin,
  onEdit,
  onDelete,
  onTogglePin,
  onReply,
  isNested = false,
}: CommentItemProps) {
  const t = useTranslations('comments');
  const locale = useLocale();
  const dateLocale = locale === 'ja' ? ja : enUS;

  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = comment.userId === currentUserId;
  const canModify = isOwner || isAdmin;

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleReply = (content: string) => {
    if (onReply) {
      onReply(comment.id, content);
      setIsReplying(false);
    }
  };

  const userInitial =
    comment.user.name?.charAt(0).toUpperCase() || comment.user.email.charAt(0).toUpperCase();

  return (
    <div className={cn('space-y-2', isNested && 'ml-8 mt-2')}>
      <div
        className={cn(
          'rounded-lg border p-4',
          typeColors[comment.type],
          comment.isPinned && 'ring-2 ring-amber-400 dark:ring-amber-600'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {comment.user.image ? (
              <img
                src={comment.user.image}
                alt={comment.user.name || ''}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium">
                {userInitial}
              </div>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {comment.user.name || comment.user.email}
                </span>
                <span className="text-gray-400">{typeIcons[comment.type]}</span>
                {comment.isPinned && <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistance(new Date(comment.createdAt), new Date(), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
                {comment.updatedAt > comment.createdAt && ` (${t('edited')})`}
              </span>
            </div>
          </div>

          {/* Actions */}
          {canModify && comment.type !== 'activity' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onTogglePin && (
                  <DropdownMenuItem onClick={() => onTogglePin(comment.id)}>
                    {comment.isPinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" />
                        {t('unpin')}
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        {t('pin')}
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('edit')}
                  </DropdownMenuItem>
                )}
                {canModify && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Content */}
        <div className="mt-3">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  {t('save')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}
        </div>

        {/* Reply button */}
        {!isNested && comment.type === 'comment' && onReply && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(!isReplying)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Reply className="mr-1 h-4 w-4" />
              {t('reply')}
            </Button>
          </div>
        )}
      </div>

      {/* Reply form */}
      {isReplying && (
        <div className="ml-8">
          <CommentForm
            organizationId={organizationId}
            leadId={leadId}
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            placeholder={t('replyPlaceholder')}
            isReply
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              organizationId={organizationId}
              leadId={leadId}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
              isNested
            />
          ))}
        </div>
      )}
    </div>
  );
}
