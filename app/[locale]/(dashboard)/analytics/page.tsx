'use client';

import {
  useConversionFunnel,
  useLeadTrend,
  useOverview,
  useResponseTime,
  useScoreDistribution,
  useSourceBreakdown,
  useStatusBreakdown,
} from '@/hooks/use-analytics';
import { useExport } from '@/hooks/use-export';
import { useOrganization } from '@/hooks/use-organization';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useState } from 'react';

import { AreaChart, ChartLegend, DonutChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { BadgeDelta } from '@/components/ui/badge-delta';
import { BarList } from '@/components/ui/bar-list';
import { Card } from '@/components/ui/card';
import { Divider, Metric, Text, Title } from '@/components/ui/metric';
import { CategoryBar, DeltaBar, ProgressBar } from '@/components/ui/progress-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { DateRange, TrendGranularity } from '@/lib/features/analytics/types/schemas';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// Dynamic imports for heavy chart components
const ConversionFunnel = dynamic(
  () =>
    import('@/components/analytics/conversion-funnel').then((mod) => ({
      default: mod.ConversionFunnel,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const ScoreDistributionChart = dynamic(
  () =>
    import('@/components/analytics/score-distribution-chart').then((mod) => ({
      default: mod.ScoreDistributionChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const ResponseTimeChart = dynamic(
  () =>
    import('@/components/analytics/response-time-chart').then((mod) => ({
      default: mod.ResponseTimeChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

function ChartSkeleton() {
  return (
    <Card className="animate-pulse p-6">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </Card>
  );
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Analytics Dashboard Page
 * Tailwind v4 compatible UI
 */
export default function AnalyticsPage() {
  const t = useTranslations('settings.analytics');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { organizationId: contextOrgId, isLoading: contextLoading } = useOrganization();

  // Only use organization ID if it's a valid UUID
  const hasValidOrgId = Boolean(contextOrgId && isValidUUID(contextOrgId));
  const organizationId = hasValidOrgId && contextOrgId ? contextOrgId : '';
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');

  // Fetch analytics data
  const { data: overview, isLoading: overviewLoading } = useOverview(organizationId, dateRange);
  const { data: leadTrend, isLoading: trendLoading } = useLeadTrend(
    organizationId,
    dateRange,
    granularity
  );
  const { data: sourceBreakdown, isLoading: sourceLoading } = useSourceBreakdown(
    organizationId,
    dateRange
  );
  const { data: statusBreakdown, isLoading: statusLoading } = useStatusBreakdown(
    organizationId,
    dateRange
  );
  const { data: funnelData, isLoading: funnelLoading } = useConversionFunnel(
    organizationId,
    dateRange
  );
  const { data: scoreDistribution, isLoading: scoreDistLoading } = useScoreDistribution(
    organizationId,
    dateRange
  );
  const { data: responseTime, isLoading: responseTimeLoading } = useResponseTime(
    organizationId,
    dateRange
  );

  // Export functionality
  const { exportAnalyticsReport, exportAnalyticsJSON, exportAnalyticsPDF, isExporting } = useExport(
    {
      organizationName: 'Organization',
      locale: locale as 'en' | 'ja',
    }
  );

  const handleExportCSV = () => {
    if (overview && leadTrend && sourceBreakdown && statusBreakdown && funnelData) {
      exportAnalyticsReport({
        overview,
        trend: leadTrend,
        sourceBreakdown,
        statusBreakdown,
        funnel: funnelData,
        dateRange,
      });
    }
  };

  const handleExportJSON = () => {
    if (overview && leadTrend && sourceBreakdown && statusBreakdown && funnelData) {
      exportAnalyticsJSON({
        overview,
        trend: leadTrend,
        sourceBreakdown,
        statusBreakdown,
        funnel: funnelData,
        dateRange,
      });
    }
  };

  const handleExportPDF = () => {
    if (overview) {
      exportAnalyticsPDF({
        overview,
        trend: leadTrend,
        sourceBreakdown,
        statusBreakdown,
        funnel: funnelData,
        dateRange,
      });
    }
  };

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: t('dateRange.7d') },
    { value: '30d', label: t('dateRange.30d') },
    { value: '90d', label: t('dateRange.90d') },
    { value: 'all', label: t('dateRange.all') },
  ];

  const granularityOptions: { value: TrendGranularity; label: string }[] = [
    { value: 'daily', label: t('granularity.daily') },
    { value: 'monthly', label: t('granularity.monthly') },
  ];

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
      [t('charts.totalLeads') || 'Total']: item.count,
      [t('charts.convertedLeads') || 'Converted']: item.converted,
    }))
    .reverse();

  // Transform status data for donut chart
  const statusData = (statusBreakdown || []).map((item) => ({
    name: tStatus(item.status),
    value: item.count,
  }));

  // Transform source data for bar list
  const sourceBarData = (sourceBreakdown || []).map((item) => ({
    name: item.source,
    value: item.count,
  }));

  const statusColors: ('blue' | 'yellow' | 'emerald' | 'violet')[] = [
    'blue',
    'yellow',
    'emerald',
    'violet',
  ];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 rounded-xl flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('description')}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={granularity} onValueChange={(v) => setGranularity(v as TrendGranularity)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {granularityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting || !overview}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? '...' : t('export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <Card className="p-6" decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('stats.totalLeads')}</Text>
              {overviewLoading ? (
                <div className="h-9 w-24 bg-gray-200 animate-pulse rounded mt-2" />
              ) : (
                <Metric className="mt-2">
                  {(overview?.totalLeads || 0).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                </Metric>
              )}
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
            <Text>{t('stats.vsLastPeriod')}</Text>
          </div>
        </Card>

        {/* New Leads */}
        <Card className="p-6" decoration="top" decorationColor="emerald">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('stats.newLeadsThisMonth')}</Text>
              {overviewLoading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mt-2" />
              ) : (
                <Metric className="mt-2">
                  {(overview?.newLeadsThisMonth || 0).toLocaleString(
                    locale === 'ja' ? 'ja-JP' : 'en-US'
                  )}
                </Metric>
              )}
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
            <Text>{t('stats.vsLastPeriod')}</Text>
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6" decoration="top" decorationColor="violet">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('stats.conversionRate')}</Text>
              {overviewLoading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded mt-2" />
              ) : (
                <Metric className="mt-2">{(overview?.conversionRate || 0).toFixed(1)}%</Metric>
              )}
            </div>
            <div className="p-3 bg-violet-50 rounded-xl">
              <Target className="h-6 w-6 text-violet-600" />
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={overview?.conversionRate || 0} color="violet" />
            <div className="mt-2 flex items-center justify-between">
              <BadgeDelta deltaType={conversionChange >= 0 ? 'increase' : 'decrease'} size="sm">
                {conversionChange >= 0 ? '+' : ''}
                {conversionChange}%
              </BadgeDelta>
              <Text>{t('stats.vsLastPeriod')}</Text>
            </div>
          </div>
        </Card>

        {/* Average Score */}
        <Card className="p-6" decoration="top" decorationColor="amber">
          <div className="flex items-start justify-between">
            <div>
              <Text>{t('stats.averageScore')}</Text>
              {overviewLoading ? (
                <div className="h-9 w-16 bg-gray-200 animate-pulse rounded mt-2" />
              ) : (
                <Metric className="mt-2">
                  {overview?.averageScore || 0}
                  <span className="text-lg font-normal text-gray-500">/100</span>
                </Metric>
              )}
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={overview?.averageScore || 0} color="amber" />
            <div className="mt-2 flex items-center justify-between">
              <BadgeDelta deltaType={scoreChange >= 0 ? 'increase' : 'decrease'} size="sm">
                {scoreChange >= 0 ? '+' : ''}
                {scoreChange}%
              </BadgeDelta>
              <Text>{t('stats.vsLastPeriod')}</Text>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            {t('tabs.sources')}
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('tabs.funnel')}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('tabs.performance')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Lead Trend Area Chart */}
            <Card className="lg:col-span-2 p-6">
              <Title>{t('charts.leadTrend')}</Title>
              <Text>{t('description')}</Text>
              {trendLoading ? (
                <div className="h-80 bg-gray-100 animate-pulse rounded-lg mt-4" />
              ) : (
                <AreaChart
                  className="h-80 mt-4"
                  data={chartData}
                  index="date"
                  categories={[
                    t('charts.totalLeads') || 'Total',
                    t('charts.convertedLeads') || 'Converted',
                  ]}
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
              <Title>{t('charts.statusBreakdown')}</Title>
              {statusLoading ? (
                <div className="h-48 w-48 mx-auto bg-gray-100 animate-pulse rounded-full mt-4" />
              ) : (
                <>
                  <DonutChart
                    className="h-48 mt-4"
                    data={statusData}
                    colors={statusColors}
                    valueFormatter={valueFormatter}
                    showLabel={true}
                    showAnimation={true}
                  />
                  <ChartLegend
                    className="mt-4"
                    categories={statusData.map((d) => d.name)}
                    colors={statusColors}
                  />
                </>
              )}
            </Card>
          </div>

          {/* Status Progress Cards */}
          {overview && !overviewLoading && (
            <Card className="mt-6 p-6">
              <Title>{t('charts.statusBreakdown')}</Title>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
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
                        <Badge color={status.color} size="lg">
                          {tStatus(status.key)}
                        </Badge>
                        <Text className="font-semibold">
                          {status.value}
                          {locale === 'ja' ? '件' : ''}
                        </Text>
                      </div>
                      <ProgressBar value={percentage} color={status.color} />
                      <Text className="text-right">{percentage.toFixed(1)}%</Text>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Source Donut Chart */}
            <Card className="p-6">
              <Title>{t('charts.sourceBreakdown')}</Title>
              {sourceLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse" />
                </div>
              ) : sourceBreakdown && sourceBreakdown.length > 0 ? (
                <>
                  <DonutChart
                    className="h-64 mt-4"
                    data={sourceBreakdown.map((item) => ({
                      name: item.source,
                      value: item.count,
                    }))}
                    colors={['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'pink']}
                    valueFormatter={valueFormatter}
                    showLabel={true}
                    showAnimation={true}
                  />
                  <ChartLegend
                    className="mt-4 flex-wrap"
                    categories={sourceBreakdown.map((d) => d.source)}
                    colors={['blue', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'pink']}
                  />
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Text>{t('noData')}</Text>
                </div>
              )}
            </Card>

            {/* Source Bar List */}
            <Card className="p-6">
              <Title>{t('charts.sourceTable')}</Title>
              {sourceLoading ? (
                <div className="space-y-3 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : sourceBreakdown && sourceBreakdown.length > 0 ? (
                <div className="mt-4">
                  <BarList
                    data={sourceBarData}
                    valueFormatter={valueFormatter}
                    showAnimation={true}
                  />
                  <Divider />
                  <div className="space-y-2">
                    {sourceBreakdown.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="gray" size="sm">
                            #{index + 1}
                          </Badge>
                          <Text>{source.source}</Text>
                        </div>
                        <Text className="font-semibold">{source.percentage.toFixed(1)}%</Text>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Text>{t('noData')}</Text>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel">
          <Card className="mt-6 p-6">
            <Title>{t('charts.conversionFunnel')}</Title>
            <Text className="mb-4">{t('description')}</Text>
            <ConversionFunnel
              leadsByStatus={overview?.leadsByStatus}
              funnelData={funnelData}
              isLoading={overviewLoading || funnelLoading}
            />
          </Card>

          {/* Funnel Metrics */}
          {overview && !overviewLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <Card className="p-6" decoration="left" decorationColor="blue">
                <Text>{tStatus('new')}</Text>
                <Metric className="mt-2">{overview.leadsByStatus.new}</Metric>
                <Text className="mt-2">100%</Text>
              </Card>
              <Card className="p-6" decoration="left" decorationColor="yellow">
                <Text>{tStatus('contacted')}</Text>
                <Metric className="mt-2">{overview.leadsByStatus.contacted}</Metric>
                <Text className="mt-2">
                  {overview.leadsByStatus.new > 0
                    ? (
                        (overview.leadsByStatus.contacted / overview.leadsByStatus.new) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Text>
              </Card>
              <Card className="p-6" decoration="left" decorationColor="emerald">
                <Text>{tStatus('qualified')}</Text>
                <Metric className="mt-2">{overview.leadsByStatus.qualified}</Metric>
                <Text className="mt-2">
                  {overview.leadsByStatus.contacted > 0
                    ? (
                        (overview.leadsByStatus.qualified / overview.leadsByStatus.contacted) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Text>
              </Card>
              <Card className="p-6" decoration="left" decorationColor="violet">
                <Text>{tStatus('converted')}</Text>
                <Metric className="mt-2">{overview.leadsByStatus.converted}</Metric>
                <Text className="mt-2">
                  {overview.leadsByStatus.qualified > 0
                    ? (
                        (overview.leadsByStatus.converted / overview.leadsByStatus.qualified) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </Text>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Score Distribution */}
            <Card className="p-6">
              <Title>{t('charts.scoreDistribution')}</Title>
              <ScoreDistributionChart data={scoreDistribution || []} isLoading={scoreDistLoading} />
            </Card>

            {/* Response Time */}
            <Card className="p-6">
              <Title>{t('charts.responseTime')}</Title>
              <ResponseTimeChart data={responseTime || []} isLoading={responseTimeLoading} />
            </Card>
          </div>

          {/* Performance Summary */}
          {overview && !overviewLoading && (
            <Card className="mt-6 p-6">
              <Title>Performance Summary</Title>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <div>
                  <Text>Lead Quality Score</Text>
                  <div className="mt-2 flex items-center justify-between">
                    <Metric>{overview.averageScore}</Metric>
                    <BadgeDelta deltaType="increase">+{scoreChange}%</BadgeDelta>
                  </div>
                  <CategoryBar
                    values={[25, 25, 25, 25]}
                    colors={['red', 'yellow', 'emerald', 'blue']}
                    markerValue={overview.averageScore}
                    className="mt-3"
                  />
                </div>
                <div>
                  <Text>Conversion Rate</Text>
                  <div className="mt-2 flex items-center justify-between">
                    <Metric>{overview.conversionRate.toFixed(1)}%</Metric>
                    <BadgeDelta deltaType="increase">+{conversionChange}%</BadgeDelta>
                  </div>
                  <ProgressBar value={overview.conversionRate} color="violet" className="mt-3" />
                </div>
                <div>
                  <Text>Lead Growth</Text>
                  <div className="mt-2 flex items-center justify-between">
                    <Metric>{overview.newLeadsThisMonth}</Metric>
                    <BadgeDelta deltaType="increase">+{newLeadsChange}%</BadgeDelta>
                  </div>
                  <DeltaBar value={newLeadsChange} className="mt-3" />
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
