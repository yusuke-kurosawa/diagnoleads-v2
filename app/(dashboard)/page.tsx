'use client';

import { useState } from 'react';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import { useOverview, useLeadTrend } from '@/hooks/use-analytics';
import { useListLeads } from '@/hooks/use-leads';
import { StatsCard } from '@/components/dashboard/stats-card';
import { LeadChart } from '@/components/dashboard/lead-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import {
  Users,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';
import type { DateRange } from '@/lib/features/analytics/types/schemas';

/**
 * ダッシュボードメインページ
 * 組織のリード統計とアクティビティを表示
 */
export default function DashboardPage() {
  const organizationId = useRequiredOrganizationId();
  const [dateRange] = useState<DateRange>('30d');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useOverview(
    organizationId,
    dateRange
  );
  const { data: leadTrend, isLoading: trendLoading } = useLeadTrend(
    organizationId,
    dateRange,
    'daily'
  );

  // Fetch recent leads for activity feed
  const { data: leadsData, isLoading: leadsLoading } = useListLeads({
    organizationId,
    limit: 10,
    offset: 0,
  });

  const recentLeads = leadsData?.items || [];

  // Calculate change percentages (mock data for now - would need historical data)
  const totalLeadsChange = 15.3; // Mock: +15.3% from previous period
  const conversionChange = 8.2; // Mock: +8.2% from previous period
  const scoreChange = 5.1; // Mock: +5.1% from previous period

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">
          組織のリード獲得状況とパフォーマンスを確認
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="総リード数"
          value={overview?.totalLeads || 0}
          change={totalLeadsChange}
          icon={Users}
          iconClassName="text-blue-600"
          iconBgClassName="bg-blue-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title="今月の新規リード"
          value={overview?.newLeadsThisMonth || 0}
          icon={TrendingUp}
          iconClassName="text-green-600"
          iconBgClassName="bg-green-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title="コンバージョン率"
          value={overview?.conversionRate || 0}
          change={conversionChange}
          format="percentage"
          icon={Target}
          iconClassName="text-purple-600"
          iconBgClassName="bg-purple-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title="平均スコア"
          value={overview?.averageScore || 0}
          change={scoreChange}
          format="number"
          icon={Award}
          iconClassName="text-orange-600"
          iconBgClassName="bg-orange-50"
          isLoading={overviewLoading}
        />
      </div>

      {/* Lead Status Breakdown */}
      {overview && !overviewLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-900">新規</span>
              <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                {overview.leadsByStatus.new}件
              </span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{
                  width: `${
                    overview.totalLeads > 0
                      ? (overview.leadsByStatus.new / overview.totalLeads) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-yellow-900">連絡済</span>
              <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                {overview.leadsByStatus.contacted}件
              </span>
            </div>
            <div className="h-2 bg-yellow-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-600"
                style={{
                  width: `${
                    overview.totalLeads > 0
                      ? (overview.leadsByStatus.contacted / overview.totalLeads) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-green-900">見込</span>
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                {overview.leadsByStatus.qualified}件
              </span>
            </div>
            <div className="h-2 bg-green-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600"
                style={{
                  width: `${
                    overview.totalLeads > 0
                      ? (overview.leadsByStatus.qualified / overview.totalLeads) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-purple-900">成約</span>
              <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">
                {overview.leadsByStatus.converted}件
              </span>
            </div>
            <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600"
                style={{
                  width: `${
                    overview.totalLeads > 0
                      ? (overview.leadsByStatus.converted / overview.totalLeads) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Lead Trend Chart */}
        <div className="lg:col-span-2">
          <LeadChart
            data={leadTrend || []}
            isLoading={trendLoading}
            granularity="daily"
          />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity
            leads={recentLeads}
            isLoading={leadsLoading}
            maxItems={5}
          />
        </div>
      </div>
    </div>
  );
}
