'use client';

import { useLeadTrend, useOverview, useStatusBreakdown } from '@/hooks/use-analytics';
import { useListLeads } from '@/hooks/use-leads';
import { useOrganization } from '@/hooks/use-organization';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { ChartLegend, DonutChart, InteractiveAreaChart, RadialChart } from '@/components/charts';
import { KPICard, KPICardGroup } from '@/components/dashboard/kpi-card';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import {
  DashboardWidget,
  type WidgetDefinition,
  WidgetSettings,
  useWidgetConfig,
} from '@/components/dashboard/widget-settings';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

import type { DateRange } from '@/lib/features/analytics/types/schemas';
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  ChevronRight,
  Gauge,
  PieChart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
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
// Widget definitions
const WIDGET_IDS = [
  'kpiCards',
  'statusBreakdown',
  'leadTrend',
  'statusDonut',
  'conversionRadial',
  'recentActivity',
] as const;

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tStatus = useTranslations('status');
  const locale = useLocale();

  const { organizationId: contextOrgId, isLoading: contextLoading } = useOrganization();

  // Only use organization ID if it's a valid UUID
  const hasValidOrgId = Boolean(contextOrgId && isValidUUID(contextOrgId));
  const organizationId = hasValidOrgId && contextOrgId ? contextOrgId : '';
  const [dateRange] = useState<DateRange>('30d');

  // Widget configuration
  const [widgetConfig, setWidgetConfig] = useWidgetConfig([...WIDGET_IDS]);

  const widgetDefinitions: WidgetDefinition[] = [
    {
      id: 'kpiCards',
      titleKey: 'kpiCards',
      descriptionKey: 'kpiCardsDesc',
      icon: <BarChart3 className="h-4 w-4 text-blue-600" />,
    },
    {
      id: 'statusBreakdown',
      titleKey: 'statusBreakdown',
      descriptionKey: 'statusBreakdownDesc',
      icon: <Gauge className="h-4 w-4 text-emerald-600" />,
    },
    {
      id: 'leadTrend',
      titleKey: 'leadTrend',
      descriptionKey: 'leadTrendDesc',
      icon: <TrendingUp className="h-4 w-4 text-violet-600" />,
    },
    {
      id: 'statusDonut',
      titleKey: 'statusDonut',
      descriptionKey: 'statusDonutDesc',
      icon: <PieChart className="h-4 w-4 text-amber-600" />,
    },
    {
      id: 'conversionRadial',
      titleKey: 'conversionRadial',
      descriptionKey: 'conversionRadialDesc',
      icon: <Target className="h-4 w-4 text-rose-600" />,
    },
    {
      id: 'recentActivity',
      titleKey: 'recentActivity',
      descriptionKey: 'recentActivityDesc',
      icon: <Activity className="h-4 w-4 text-cyan-600" />,
    },
  ];

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
        <div className="flex items-center gap-3">
          <WidgetSettings
            widgets={widgetDefinitions}
            config={widgetConfig}
            onConfigChange={setWidgetConfig}
          />
          <Link
            href={`/${locale}/analytics`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {t('viewAll')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - Enhanced with animations */}
      <DashboardWidget id="kpiCards" config={widgetConfig}>
        <KPICardGroup>
          <KPICard
            title={t('totalLeads')}
            value={overview?.totalLeads || 0}
            icon={Users}
            valueType="number"
            locale={locale === 'ja' ? 'ja-JP' : 'en-US'}
            change={totalLeadsChange}
            changeLabel={t('vsLastPeriod')}
            sparkData={sparkData}
            sparkColor="blue"
            color="blue"
            variant="elevated"
            isLoading={overviewLoading}
          />

          <KPICard
            title={t('newLeadsThisMonth')}
            value={overview?.newLeadsThisMonth || 0}
            icon={TrendingUp}
            valueType="number"
            locale={locale === 'ja' ? 'ja-JP' : 'en-US'}
            change={newLeadsChange}
            changeLabel={t('vsLastPeriod')}
            color="emerald"
            variant="elevated"
            isLoading={overviewLoading}
          />

          <KPICard
            title={t('conversionRate')}
            value={overview?.conversionRate || 0}
            icon={Target}
            valueType="percentage"
            decimals={1}
            change={conversionChange}
            changeLabel={t('vsLastPeriod')}
            color="violet"
            variant="elevated"
            isLoading={overviewLoading}
          >
            <ProgressBar value={overview?.conversionRate || 0} color="violet" className="mt-3" />
          </KPICard>

          <KPICard
            title={t('averageScore')}
            value={overview?.averageScore || 0}
            icon={Award}
            valueType="score"
            maxValue={100}
            change={scoreChange}
            changeLabel={t('vsLastPeriod')}
            color="amber"
            variant="elevated"
            isLoading={overviewLoading}
          >
            <ProgressBar value={overview?.averageScore || 0} color="amber" className="mt-3" />
          </KPICard>
        </KPICardGroup>
      </DashboardWidget>

      {/* Lead Status Breakdown */}
      <DashboardWidget id="statusBreakdown" config={widgetConfig}>
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
      </DashboardWidget>

      {/* Charts and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend Chart - Interactive with zoom/download */}
        <DashboardWidget id="leadTrend" config={widgetConfig}>
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
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
              <div className="h-80 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
            ) : (
              <InteractiveAreaChart
                data={chartData}
                index="date"
                categories={[t('totalLeads'), t('convertedLeads')]}
                colors={['blue', 'violet']}
                valueFormatter={valueFormatter}
                showLegend={true}
                showGridLines={true}
                showAnimation={true}
                showToolbar={true}
                enableZoom={true}
                enableDownload={true}
                curveType="smooth"
                height={320}
              />
            )}
          </Card>
        </DashboardWidget>

        {/* Status Donut Chart with Radial Progress */}
        <DashboardWidget id="statusDonut" config={widgetConfig}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('leadStatusBreakdown')}
            </h3>
            {statusLoading ? (
              <div className="h-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-full mx-auto w-48" />
            ) : (
              <div className="space-y-4">
                <DonutChart
                  className="mx-auto"
                  data={statusData}
                  colors={statusColors}
                  valueFormatter={valueFormatter}
                  showLabel={true}
                  showAnimation={true}
                  height={220}
                />
                <ChartLegend
                  className="mt-4"
                  categories={statusData.map((d) => d.name)}
                  colors={statusColors}
                />
              </div>
            )}
          </Card>
        </DashboardWidget>
      </div>

      {/* Conversion & Score Radial Charts */}
      <DashboardWidget id="conversionRadial" config={widgetConfig}>
        {overview && !overviewLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('conversionRate')}
              </h3>
              <div className="flex items-center justify-center">
                <RadialChart
                  value={overview.conversionRate}
                  maxValue={100}
                  label={t('converted')}
                  color="violet"
                  size="md"
                  valueFormatter={(v) => `${v.toFixed(1)}%`}
                />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('averageScore')}
              </h3>
              <div className="flex items-center justify-center">
                <RadialChart
                  value={overview.averageScore}
                  maxValue={100}
                  label={locale === 'ja' ? 'スコア' : 'Score'}
                  color="amber"
                  size="md"
                  valueFormatter={(v) => `${Math.round(v)}`}
                />
              </div>
            </Card>
          </div>
        )}
      </DashboardWidget>

      {/* Recent Activity */}
      <DashboardWidget id="recentActivity" config={widgetConfig}>
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
      </DashboardWidget>
    </div>
  );
}
