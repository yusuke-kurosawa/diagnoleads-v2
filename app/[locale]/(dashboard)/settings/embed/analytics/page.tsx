'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function EmbedAnalyticsPage() {
  const { organization } = useOrganization();
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // Fetch embed configs
  const { data: configs, isLoading: configsLoading } = trpc.embed.list.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Fetch stats for selected config
  const { data: stats, isLoading: statsLoading } = trpc.embed.getStats.useQuery(
    {
      organizationId: organization?.id ?? '',
      embedConfigId: selectedConfigId,
    },
    { enabled: !!organization?.id && !!selectedConfigId }
  );

  // Fetch recent logs for selected config
  const { data: recentLogs } = trpc.embed.getAccessLogs.useQuery(
    {
      organizationId: organization?.id ?? '',
      embedConfigId: selectedConfigId,
      limit: 10,
      offset: 0,
    },
    { enabled: !!organization?.id && !!selectedConfigId }
  );

  const calculateSuccessRate = () => {
    if (!stats || stats.totalRequests === 0) return 0;
    return ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
  };

  const calculateConversionRate = () => {
    if (!stats || stats.totalRequests === 0) return 0;
    return ((stats.leadsCreated / stats.totalRequests) * 100).toFixed(2);
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="../embed">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Embed Analytics</h1>
          <p className="text-muted-foreground">
            View performance metrics for your embed configurations
          </p>
        </div>
      </div>

      {/* Config Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select an embed configuration" />
            </SelectTrigger>
            <SelectContent>
              {configs?.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.name}
                  {!config.isActive && (
                    <Badge variant="secondary" className="ml-2">
                      Inactive
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {selectedConfigId && stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Lifetime API requests</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{calculateSuccessRate()}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.successfulRequests.toLocaleString()} successful /{' '}
                  {stats.failedRequests.toLocaleString()} failed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Leads Created</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{stats.leadsCreated.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversion rate: {calculateConversionRate()}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Unique Origins</span>
                </div>
                <p className="mt-2 text-3xl font-bold">{stats.uniqueOrigins}</p>
                <p className="text-xs text-muted-foreground mt-1">Distinct domains using widget</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${stats.isActive ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    {stats.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Used</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${stats.expiresAt ? 'bg-yellow-100' : 'bg-gray-100'}`}
                  >
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Expiration</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.expiresAt
                        ? new Date(stats.expiresAt).toLocaleDateString()
                        : 'No expiration'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 10 API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLogs && recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={log.statusCode < 400 ? 'default' : 'destructive'}
                          className="w-12 justify-center"
                        >
                          {log.statusCode}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{log.endpoint}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.origin || 'Unknown origin'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        {log.durationMs && (
                          <p className="text-xs text-muted-foreground">{log.durationMs}ms</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
              <div className="mt-4 pt-4 border-t">
                <Link href="logs">
                  <Button variant="outline" className="w-full">
                    View All Logs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedConfigId && (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Select an embed configuration to view analytics
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
