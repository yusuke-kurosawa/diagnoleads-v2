'use client';

import { useLeadTrend, useOverview, useStatusBreakdown } from '@/hooks/use-analytics';
import { useListLeads } from '@/hooks/use-leads';
import { useOrganization } from '@/hooks/use-organization';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { AreaChart, ChartLegend, DonutChart, SparkAreaChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { BadgeDelta } from '@/components/ui/badge-delta';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

import { RecentActivity } from '@/components/dashboard/recent-activity';
import type { DateRange } from '@/lib/features/analytics/types/schemas';
import { ArrowUpRight, Award, ChevronRight, Target, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * ダッシュボードメインページ
 * Tailwind v4互換のモダンなUI
 */
export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tStatus = useTranslations('status');
  const locale = useLocale();

  const { organizationId: contextOrgId, isLoading: contextLoading } = useOrganization();

  // Only use organization ID if it's a valid UUID
  const hasValidOrgId = Boolean(contextOrgId && isValidUUID(contextOrgId));
  const organizationId = hasValidOrgId && contextOrgId ? contextOrgId : '';
  const [dateRange] = useState<DateRange>('30d');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useOverview(organizationId, dateRange);
  const { data: leadTrend, isLoading: trendLoading } = useLeadTrend(
    organizationId,
    dateRange,
    'daily'
  );
  const { data: statusBreakdown, isLoading: statusLoading } = useStatusBreakdown(
    organizationId,
    dateRange
  );

  // Fetch recent leads for activity feed
  const { data: leadsData, isLoading: leadsLoading } = useListLeads({
    organizationId,
    limit: 10,
    offset: 0,
  });

  const recentLeads = leadsData?.items || [];

  // Mock change data
  const totalLeadsChange = 15.3;
  const conversionChange = 8.2;
  const scoreChange = 5.1;
  const newLeadsChange = 23.1;

  // Value formatter for charts
  const valueFormatter = (value: number) => {
    if (locale === 'ja') {
      return `${value.toLocaleString('ja-JP')}件`;
    }
    return value.toLocaleString('en-US');
  };

  // Transform lead trend data for chart
  const chartData = (leadTrend || [])
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
      [t('totalLeads')]: item.count,
      [t('convertedLeads')]: item.converted,
    }))
    .reverse();

  // Transform status data for donut chart
  const statusData = (statusBreakdown || []).map((item) => ({
    name: tStatus(item.status),
    value: item.count,
  }));

  const statusColors: ('blue' | 'yellow' | 'emerald' | 'violet')[] = [
    'blue',
    'yellow',
    'emerald',
    'violet',
  ];

  // Spark chart data (last 7 items from trend)
  const sparkData = chartData.slice(-7).map((item) => ({
    value: item[t('totalLeads')] as number,
  }));

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('description')}</p>
        </div>
        <Link
          href={`/${locale}/analytics`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          {t('viewAll')}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads Card */}
        <Card className="p-6" decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('totalLeads')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewLoading ? (
                  <span className="inline-block h-9 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  (overview?.totalLeads || 0).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <BadgeDelta deltaType={totalLeadsChange >= 0 ? 'increase' : 'decrease'} size="sm">
              {totalLeadsChange >= 0 ? '+' : ''}
              {totalLeadsChange}%
            </BadgeDelta>
            <SparkAreaChart
              data={sparkData}
              categories={['value']}
              colors={['blue']}
              className="h-10 w-24"
              curveType="smooth"
            />
          </div>
        </Card>

        {/* New Leads This Month */}
        <Card className="p-6" decoration="top" decorationColor="emerald">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('newLeadsThisMonth')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewLoading ? (
                  <span className="inline-block h-9 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  (overview?.newLeadsThisMonth || 0).toLocaleString(
                    locale === 'ja' ? 'ja-JP' : 'en-US'
                  )
                )}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <BadgeDelta deltaType={newLeadsChange >= 0 ? 'increase' : 'decrease'} size="sm">
              {newLeadsChange >= 0 ? '+' : ''}
              {newLeadsChange}%
            </BadgeDelta>
            <span className="text-xs text-gray-500">{t('vsLastPeriod')}</span>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6" decoration="top" decorationColor="violet">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('conversionRate')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewLoading ? (
                  <span className="inline-block h-9 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  `${(overview?.conversionRate || 0).toFixed(1)}%`
                )}
              </p>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <Target className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <BadgeDelta deltaType={conversionChange >= 0 ? 'increase' : 'decrease'} size="sm">
                {conversionChange >= 0 ? '+' : ''}
                {conversionChange}%
              </BadgeDelta>
              <span className="text-xs text-gray-500">{t('vsLastPeriod')}</span>
            </div>
            <ProgressBar value={overview?.conversionRate || 0} color="violet" className="mt-2" />
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-6" decoration="top" decorationColor="amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('averageScore')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewLoading ? (
                  <span className="inline-block h-9 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ) : (
                  <>
                    {overview?.averageScore || 0}
                    <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                      /100
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <BadgeDelta deltaType={scoreChange >= 0 ? 'increase' : 'decrease'} size="sm">
                {scoreChange >= 0 ? '+' : ''}
                {scoreChange}%
              </BadgeDelta>
              <span className="text-xs text-gray-500">{t('vsLastPeriod')}</span>
            </div>
            <ProgressBar value={overview?.averageScore || 0} color="amber" className="mt-2" />
          </div>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      {overview && !overviewLoading && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {t('leadStatusBreakdown')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { key: 'new', color: 'blue' as const, value: overview.leadsByStatus.new },
              {
                key: 'contacted',
                color: 'yellow' as const,
                value: overview.leadsByStatus.contacted,
              },
              {
                key: 'qualified',
                color: 'emerald' as const,
                value: overview.leadsByStatus.qualified,
              },
              {
                key: 'converted',
                color: 'violet' as const,
                value: overview.leadsByStatus.converted,
              },
            ].map((status) => {
              const percentage =
                overview.totalLeads > 0 ? (status.value / overview.totalLeads) * 100 : 0;
              return (
                <div key={status.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            status.color === 'blue'
                              ? '#3b82f6'
                              : status.color === 'yellow'
                                ? '#eab308'
                                : status.color === 'emerald'
                                  ? '#10b981'
                                  : '#8b5cf6',
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tStatus(status.key)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {status.value}
                      {locale === 'ja' ? '件' : ''}
                    </span>
                  </div>
                  <ProgressBar value={percentage} color={status.color} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('leadTrend')}
              </h3>
              <p className="text-sm text-gray-500">{t('description')}</p>
            </div>
            <Link
              href={`/${locale}/analytics`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {t('viewAll')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {trendLoading ? (
            <div className="h-80 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <AreaChart
              className="h-80"
              data={chartData}
              index="date"
              categories={[t('totalLeads'), t('convertedLeads')]}
              colors={['blue', 'violet']}
              valueFormatter={valueFormatter}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              curveType="smooth"
            />
          )}
        </Card>

        {/* Status Donut Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {t('leadStatusBreakdown')}
          </h3>
          {statusLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-full mx-auto w-48" />
          ) : (
            <>
              <DonutChart
                className="h-48"
                data={statusData}
                colors={statusColors}
                valueFormatter={valueFormatter}
                showLabel={true}
                showAnimation={true}
              />
              <ChartLegend
                className="mt-6"
                categories={statusData.map((d) => d.name)}
                colors={statusColors}
              />
            </>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('recentActivity')}
          </h3>
          <Link
            href={`/${locale}/leads`}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {t('viewAll')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <RecentActivity leads={recentLeads} isLoading={leadsLoading} maxItems={5} />
      </Card>
    </div>
  );
}
