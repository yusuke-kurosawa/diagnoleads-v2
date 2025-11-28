'use client';

import type { Lead } from '@/lib/db/schema';
import { LeadCard } from './lead-card';

interface LeadListProps {
  leads: Lead[];
  isLoading?: boolean;
  onLeadClick?: (lead: Lead) => void;
}

/**
 * Lead list component
 * Displays a list of leads using LeadCard components
 */
export function LeadList({ leads, isLoading, onLeadClick }: LeadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">リードがまだありません</p>
        <p className="text-gray-400 text-sm mt-2">
          新しいリードを作成するか、診断フォームを公開してください
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
      ))}
    </div>
  );
}
