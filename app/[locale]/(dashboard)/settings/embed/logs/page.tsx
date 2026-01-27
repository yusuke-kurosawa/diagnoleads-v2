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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function EmbedAccessLogsPage() {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const configIdParam = searchParams.get('configId');

  const [selectedConfigId, setSelectedConfigId] = useState<string>(configIdParam || '');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Fetch embed configs for selector
  const { data: configs, isLoading: configsLoading } = trpc.embed.list.useQuery(
    { organizationId: organization?.id ?? '' },
    { enabled: !!organization?.id }
  );

  // Fetch access logs
  const {
    data: logs,
    isLoading: logsLoading,
    refetch,
  } = trpc.embed.getAccessLogs.useQuery(
    {
      organizationId: organization?.id ?? '',
      embedConfigId: selectedConfigId,
      limit: pageSize,
      offset: page * pageSize,
    },
    { enabled: !!organization?.id && !!selectedConfigId }
  );

  // Fetch stats
  const { data: stats } = trpc.embed.getStats.useQuery(
    {
      organizationId: organization?.id ?? '',
      embedConfigId: selectedConfigId,
    },
    { enabled: !!organization?.id && !!selectedConfigId }
  );

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <Badge variant="default" className="bg-green-500">
          Success
        </Badge>
      );
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="destructive">Client Error</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">Server Error</Badge>;
    }
    return <Badge variant="secondary">{statusCode}</Badge>;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '-';
    return `${ms}ms`;
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
          <h1 className="text-2xl font-bold">Access Logs</h1>
          <p className="text-muted-foreground">
            View API access logs for your embed configurations
          </p>
        </div>
      </div>

      {/* Config Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an embed configuration" />
              </SelectTrigger>
              <SelectContent>
                {configs?.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedConfigId && (
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Requests</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.totalRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Successful</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.successfulRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Failed</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.failedRequests}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Leads Created</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.leadsCreated}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Table */}
      {selectedConfigId ? (
        <Card>
          <CardHeader>
            <CardTitle>Request Logs</CardTitle>
            <CardDescription>Recent API requests to this embed configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs && logs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDate(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                        <TableCell>{getStatusBadge(log.statusCode)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {log.origin || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(log.durationMs)}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs text-red-500">
                          {log.errorCode || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * pageSize + 1} - {page * pageSize + (logs?.length || 0)} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={(logs?.length || 0) < pageSize}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                No logs found for this configuration
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Select an embed configuration to view its access logs
          </CardContent>
        </Card>
      )}
    </div>
  );
}
