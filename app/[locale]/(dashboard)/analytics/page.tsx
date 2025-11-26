'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRequiredOrganizationId } from '@/hooks/use-organization';
import {
  useOverview,
  useLeadTrend,
  useSourceBreakdown,
  useStatusBreakdown,
  useConversionFunnel,
} from '@/hooks/use-analytics';
import { useExport } from '@/hooks/use-export';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, TrendingUp, Target, Award, Calendar, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import type { DateRange, TrendGranularity } from '@/lib/features/analytics/types/schemas';

// Dynamic imports for heavy chart components
const LeadChart = dynamic(
  () => import('@/components/dashboard/lead-chart').then((mod) => ({ default: mod.LeadChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const SourceChart = dynamic(
  () =>
    import('@/components/analytics/source-chart').then((mod) => ({ default: mod.SourceChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

const StatusChart = dynamic(
  () =>
    import('@/components/analytics/status-chart').then((mod) => ({ default: mod.StatusChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

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

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}

/**
 * Analytics Dashboard Page
 * Comprehensive analytics view with date range filters and multiple chart types
 */
export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const organizationId = useRequiredOrganizationId();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [granularity, setGranularity] = useState<TrendGranularity>('daily');
  const [activeTab, setActiveTab] = useState('overview');

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

  // Export functionality
  const { exportAnalyticsReport, exportAnalyticsJSON, isExporting } = useExport({
    organizationName: 'Organization', // TODO: Get from organization context
  });

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

  // Calculate previous period comparison (mock for now)
  const totalLeadsChange = 15.3;
  const conversionChange = 8.2;
  const scoreChange = 5.1;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('description')}</p>
        </div>

        {/* Date Range & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[140px]">
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

          <Select
            value={granularity}
            onValueChange={(v) => setGranularity(v as TrendGranularity)}
          >
            <SelectTrigger className="w-[120px]">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title={t('stats.totalLeads')}
          value={overview?.totalLeads || 0}
          change={totalLeadsChange}
          changeLabel={t('stats.vsLastPeriod')}
          icon={Users}
          iconClassName="text-blue-600"
          iconBgClassName="bg-blue-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title={t('stats.newLeadsThisMonth')}
          value={overview?.newLeadsThisMonth || 0}
          icon={TrendingUp}
          iconClassName="text-green-600"
          iconBgClassName="bg-green-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title={t('stats.conversionRate')}
          value={overview?.conversionRate || 0}
          change={conversionChange}
          changeLabel={t('stats.vsLastPeriod')}
          format="percentage"
          icon={Target}
          iconClassName="text-purple-600"
          iconBgClassName="bg-purple-50"
          isLoading={overviewLoading}
        />

        <StatsCard
          title={t('stats.averageScore')}
          value={overview?.averageScore || 0}
          change={scoreChange}
          changeLabel={t('stats.vsLastPeriod')}
          format="number"
          icon={Award}
          iconClassName="text-orange-600"
          iconBgClassName="bg-orange-50"
          isLoading={overviewLoading}
        />
      </div>

      {/* Tabs for different analytics views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="sources">{t('tabs.sources')}</TabsTrigger>
          <TabsTrigger value="funnel">{t('tabs.funnel')}</TabsTrigger>
          <TabsTrigger value="performance">{t('tabs.performance')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Trend Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.leadTrend')}</h3>
              <LeadChart
                data={leadTrend || []}
                isLoading={trendLoading}
                granularity={granularity}
                title=""
                description=""
              />
            </Card>

            {/* Status Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('charts.statusBreakdown')}
              </h3>
              <StatusChart data={statusBreakdown || []} isLoading={statusLoading} />
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Source Breakdown Donut */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('charts.sourceBreakdown')}
              </h3>
              <SourceChart data={sourceBreakdown || []} isLoading={sourceLoading} />
            </Card>

            {/* Source Table */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('charts.sourceTable')}</h3>
              {sourceLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sourceBreakdown?.map((source, index) => (
                    <div
                      key={source.source}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{source.source}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {source.count} {tCommon('leads')}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {source.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!sourceBreakdown || sourceBreakdown.length === 0) && (
                    <p className="text-center text-gray-500 py-8">{t('noData')}</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('charts.conversionFunnel')}
            </h3>
            <ConversionFunnel
              leadsByStatus={overview?.leadsByStatus}
              funnelData={funnelData}
              isLoading={overviewLoading || funnelLoading}
            />
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('charts.scoreDistribution')}
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('comingSoon')}
              </div>
            </Card>

            {/* Response Time */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('charts.responseTime')}
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('comingSoon')}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
