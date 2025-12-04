'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InferSelectModel } from 'drizzle-orm';
import {
  Calendar,
  Clock,
  Download,
  FileText,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { scheduledReports } from '@/lib/db/schema';

type ScheduledReport = InferSelectModel<typeof scheduledReports>;

interface ReportCardProps {
  report: ScheduledReport;
  onEdit: (report: ScheduledReport) => void;
  onDelete: (reportId: string) => void;
  onToggleStatus: (reportId: string, status: 'active' | 'paused') => void;
  onRunNow: (reportId: string) => void;
}

const frequencyLabels: Record<string, string> = {
  daily: 'reports.frequency.daily',
  weekly: 'reports.frequency.weekly',
  monthly: 'reports.frequency.monthly',
  quarterly: 'reports.frequency.quarterly',
};

const reportTypeLabels: Record<string, string> = {
  lead_summary: 'reports.types.leadSummary',
  conversion_analysis: 'reports.types.conversionAnalysis',
  source_performance: 'reports.types.sourcePerformance',
  team_performance: 'reports.types.teamPerformance',
  custom: 'reports.types.custom',
};

const formatLabels: Record<string, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  csv: 'CSV',
};

export function ReportCard({
  report,
  onEdit,
  onDelete,
  onToggleStatus,
  onRunNow,
}: ReportCardProps) {
  const t = useTranslations();

  const getScheduleDescription = () => {
    const hour = report.sendHour.toString().padStart(2, '0');
    const time = `${hour}:00`;

    switch (report.frequency) {
      case 'daily':
        return t('reports.scheduleDaily', { time });
      case 'weekly': {
        const days = [
          t('common.weekdays.sunday'),
          t('common.weekdays.monday'),
          t('common.weekdays.tuesday'),
          t('common.weekdays.wednesday'),
          t('common.weekdays.thursday'),
          t('common.weekdays.friday'),
          t('common.weekdays.saturday'),
        ];
        const day = days[report.dayOfWeek ?? 1];
        return t('reports.scheduleWeekly', { day, time });
      }
      case 'monthly':
        return t('reports.scheduleMonthly', { day: report.dayOfMonth ?? 1, time });
      case 'quarterly':
        return t('reports.scheduleQuarterly', { day: report.dayOfMonth ?? 1, time });
      default:
        return '';
    }
  };

  const recipientCount = report.recipients.split(',').length;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              {report.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(reportTypeLabels[report.reportType])}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
              {report.status === 'active' ? t('reports.status.active') : t('reports.status.paused')}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(report)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRunNow(report.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  {t('reports.runNow')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onToggleStatus(report.id, report.status === 'active' ? 'paused' : 'active')
                  }
                >
                  {report.status === 'active' ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      {t('reports.pause')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('reports.resume')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(report.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{t(frequencyLabels[report.frequency])}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{getScheduleDescription()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{formatLabels[report.format]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{t('reports.recipientCount', { count: recipientCount })}</span>
          </div>
        </div>
        {report.lastSentAt && (
          <p className="text-xs text-muted-foreground">
            {t('reports.lastRun', {
              date: new Date(report.lastSentAt).toLocaleString(),
            })}
          </p>
        )}
        {report.nextScheduledAt && report.status === 'active' && (
          <p className="text-xs text-muted-foreground">
            {t('reports.nextRun', {
              date: new Date(report.nextScheduledAt).toLocaleString(),
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
