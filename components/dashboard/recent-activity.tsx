'use client';

import { Card } from '@/components/ui/card';
import type { Lead } from '@/lib/db/schema';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Mail, Phone, Building2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface RecentActivityProps {
  leads: Lead[];
  isLoading?: boolean;
  maxItems?: number;
}

/**
 * RecentActivity component
 * Displays a list of recent leads with their key information
 */
export function RecentActivity({
  leads,
  isLoading = false,
  maxItems = 5,
}: RecentActivityProps) {
  const statusLabels = {
    new: '新規',
    contacted: '連絡済',
    qualified: '見込',
    converted: '成約',
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    converted: 'bg-purple-100 text-purple-800',
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          最近のリード
        </h3>
        <div className="space-y-4">
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
              <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-48 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const recentLeads = leads.slice(0, maxItems);

  if (recentLeads.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          最近のリード
        </h3>
        <div className="py-8 text-center">
          <p className="text-gray-500 text-sm">最近のアクティビティはありません</p>
          <p className="text-gray-400 text-xs mt-1">
            新しいリードが追加されるとここに表示されます
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">最近のリード</h3>
        <Link
          href="/leads"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          すべて表示
        </Link>
      </div>

      <div className="space-y-4">
        {recentLeads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads?leadId=${lead.id}`}
            className="flex items-start gap-3 pb-4 border-b last:border-b-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
          >
            {/* Avatar with initial */}
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">
                {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>

            {/* Lead info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {lead.name || '名前未設定'}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    statusColors[lead.status as keyof typeof statusColors]
                  }`}
                >
                  {statusLabels[lead.status as keyof typeof statusLabels]}
                </span>
              </div>

              <div className="space-y-0.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{lead.email}</span>
                </div>

                {lead.company && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{lead.company}</span>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="truncate">{lead.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2">
                {lead.score !== null && lead.score !== undefined && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">
                      {lead.score}点
                    </span>
                  </div>
                )}

                <span className="text-xs text-gray-500">
                  {formatDistance(new Date(lead.createdAt), new Date(), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
