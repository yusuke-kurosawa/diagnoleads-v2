'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Tag } from '@/lib/db/schema';
import { trpc } from '@/lib/trpc/client';
import { Pencil, Plus, Settings, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { TagBadge } from './tag-badge';

// Predefined color palette
const TAG_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

interface TagManagerProps {
  organizationId: string;
  trigger?: React.ReactNode;
}

export function TagManager({ organizationId, trigger }: TagManagerProps) {
  const t = useTranslations('tags');
  const tCommon = useTranslations('common');

  const [open, setOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [newTagDescription, setNewTagDescription] = useState('');

  const utils = trpc.useUtils();

  const { data: tags = [], isLoading } = trpc.tags.list.useQuery(
    { organizationId },
    { enabled: open && !!organizationId }
  );

  const createTag = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success(t('createSuccess'));
      utils.tags.list.invalidate({ organizationId });
      resetForm();
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  const updateTag = trpc.tags.update.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      utils.tags.list.invalidate({ organizationId });
      resetForm();
    },
    onError: () => {
      toast.error(t('updateError'));
    },
  });

  const deleteTag = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success(t('deleteSuccess'));
      utils.tags.list.invalidate({ organizationId });
    },
    onError: () => {
      toast.error(t('deleteError'));
    },
  });

  const resetForm = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
    setNewTagDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName.trim()) return;

    if (editingTag) {
      updateTag.mutate({
        organizationId,
        id: editingTag.id,
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim() || null,
      });
    } else {
      createTag.mutate({
        organizationId,
        name: newTagName.trim(),
        color: newTagColor,
        description: newTagDescription.trim() || undefined,
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setNewTagDescription(tag.description || '');
  };

  const handleDelete = (tagId: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteTag.mutate({ organizationId, id: tagId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('manageTags')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('manageTitle')}</DialogTitle>
          <DialogDescription>{t('manageDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">{t('tagName')}</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t('tagNamePlaceholder')}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('tagColor')}</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newTagColor === color
                        ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagDescription">{t('tagDescription')}</Label>
              <Input
                id="tagDescription"
                value={newTagDescription}
                onChange={(e) => setNewTagDescription(e.target.value)}
                placeholder={t('tagDescriptionPlaceholder')}
                maxLength={200}
              />
            </div>

            {/* Preview */}
            {newTagName && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Label className="text-xs text-gray-500 mb-2 block">{t('preview')}</Label>
                <TagBadge name={newTagName} color={newTagColor} />
              </div>
            )}

            <div className="flex gap-2">
              {editingTag && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  {tCommon('cancel')}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!newTagName.trim() || createTag.isPending || updateTag.isPending}
              >
                {editingTag ? (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    {tCommon('update')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createTag', { name: '' }).replace('"', '').replace('"', '').trim()}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Existing Tags */}
          <div className="space-y-2">
            <Label>{t('existingTags')}</Label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded"
                  />
                ))}
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">{t('noTagsYet')}</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <TagBadge name={tag.name} color={tag.color} size="sm" />
                      {tag.description && (
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {tag.description}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tCommon('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
