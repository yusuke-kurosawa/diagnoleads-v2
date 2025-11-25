'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, Loader2 } from 'lucide-react';
import type { SemanticSearchResult } from '@/lib/features/ai';

interface SimilarLeadsCardProps {
  similarLeads?: SemanticSearchResult[];
  isLoading?: boolean;
  organizationId: string;
}

/**
 * Similar Leads Card Component
 * Displays leads similar to the current lead based on vector similarity
 */
export function SimilarLeadsCard({
  similarLeads,
  isLoading,
  organizationId,
}: SimilarLeadsCardProps) {
  const t = useTranslations('ai');

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          {t('similarLeads')}
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (!similarLeads || similarLeads.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          {t('similarLeads')}
        </h3>
        <p className="text-sm text-gray-500">{t('noSimilarLeadsFound')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        {t('similarLeads')}
      </h3>

      <div className="space-y-3">
        {similarLeads.map((lead) => (
          <Link
            key={lead.id}
            href={`/${organizationId}/leads/${lead.id}`}
            className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {lead.name || lead.email}
                </div>
                {lead.company && (
                  <div className="text-sm text-gray-500 truncate mt-1">
                    {lead.company}
                  </div>
                )}
                {lead.industry && (
                  <Badge variant="secondary" className="mt-2">
                    {lead.industry}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Similarity score */}
                <div className="text-right">
                  <div className="text-sm font-medium text-blue-600">
                    {Math.round(lead.similarity * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('similarity')}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
