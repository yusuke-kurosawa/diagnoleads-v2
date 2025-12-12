'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { reportHistory, scheduledReports } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import { AlertCircle, CheckCircle, Clock, Download, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

type ReportHistory = InferSelectModel<typeof reportHistory>;
type ScheduledReport = InferSelectModel<typeof scheduledReports>;

interface ReportHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ScheduledReport | null;
  history: ReportHistory[];
  isLoading?: boolean;
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  sent: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  sent: 'default',
  failed: 'destructive',
};

export function ReportHistoryDialog({
  open,
  onOpenChange,
  report,
  history,
  isLoading,
}: ReportHistoryDialogProps) {
  const t = useTranslations();

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('reports.historyTitle', { name: report.name })}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('reports.noHistory')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.history.executedAt')}</TableHead>
                <TableHead>{t('reports.history.status')}</TableHead>
                <TableHead>{t('common.details')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[item.deliveryStatus]} className="gap-1">
                      {statusIcons[item.deliveryStatus]}
                      {t(`reports.history.statuses.${item.deliveryStatus}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {item.leadCount} {t('leads.count')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.deliveryStatus === 'sent' && item.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-1" />
                          {t('common.download')}
                        </a>
                      </Button>
                    )}
                    {item.deliveryStatus === 'failed' && item.errorMessage && (
                      <span className="text-xs text-destructive">{item.errorMessage}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
