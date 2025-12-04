'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TagBadge({ name, color, onRemove, size = 'md', className }: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface TagBadgeListProps {
  tags: Array<{ id: string; name: string; color: string }>;
  onRemove?: (tagId: string) => void;
  size?: 'sm' | 'md';
  maxVisible?: number;
  className?: string;
}

export function TagBadgeList({
  tags,
  onRemove,
  size = 'sm',
  maxVisible = 3,
  className,
}: TagBadgeListProps) {
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size={size}
          onRemove={onRemove ? () => onRemove(tag.id) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400">+{remainingCount}</span>
      )}
    </div>
  );
}
