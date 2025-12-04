'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Tag } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus, Tag as TagIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { TagBadge } from './tag-badge';

interface TagSelectorProps {
  tags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagSelector({
  tags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  isLoading,
  placeholder,
  className,
}: TagSelectorProps) {
  const t = useTranslations('tags');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedIds = new Set(selectedTags.map((t) => t.id));

  const handleSelect = (tag: Tag) => {
    if (selectedIds.has(tag.id)) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleCreateTag = () => {
    if (search.trim() && onCreateTag) {
      onCreateTag(search.trim());
      setSearch('');
    }
  };

  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()));

  const showCreateOption =
    search.trim() &&
    onCreateTag &&
    !tags.some((tag) => tag.name.toLowerCase() === search.toLowerCase());

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">
                {selectedTags.length > 0
                  ? t('selectedCount', { count: selectedTags.length })
                  : placeholder || t('selectTags')}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('searchTags')} value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {showCreateOption ? (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Plus className="h-4 w-4" />
                    {t('createTag', { name: search })}
                  </button>
                ) : (
                  t('noTags')
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem key={tag.id} value={tag.name} onSelect={() => handleSelect(tag)}>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.has(tag.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {showCreateOption && filteredTags.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem onSelect={handleCreateTag}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('createTag', { name: search })}
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              size="sm"
              onRemove={() => handleRemove(tag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
