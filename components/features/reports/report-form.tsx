'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { scheduledReports } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type ScheduledReport = InferSelectModel<typeof scheduledReports>;

interface ReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: ScheduledReport | null;
  onSubmit: (data: ReportFormData) => void;
  isLoading?: boolean;
}

export interface ReportFormData {
  name: string;
  reportType:
    | 'lead_summary'
    | 'conversion_analysis'
    | 'source_performance'
    | 'team_performance'
    | 'custom';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  sendHour: number;
  timezone: string;
  format: 'pdf' | 'excel' | 'csv';
  recipients: string;
}

const timezones = [
  { value: 'Asia/Tokyo', label: '(UTC+9) Tokyo' },
  { value: 'America/New_York', label: '(UTC-5) New York' },
  { value: 'America/Los_Angeles', label: '(UTC-8) Los Angeles' },
  { value: 'Europe/London', label: '(UTC+0) London' },
  { value: 'Europe/Paris', label: '(UTC+1) Paris' },
];

const weekdays = [
  { value: 0, label: 'common.weekdays.sunday' },
  { value: 1, label: 'common.weekdays.monday' },
  { value: 2, label: 'common.weekdays.tuesday' },
  { value: 3, label: 'common.weekdays.wednesday' },
  { value: 4, label: 'common.weekdays.thursday' },
  { value: 5, label: 'common.weekdays.friday' },
  { value: 6, label: 'common.weekdays.saturday' },
];

export function ReportForm({ open, onOpenChange, report, onSubmit, isLoading }: ReportFormProps) {
  const t = useTranslations();
  const isEditing = !!report;

  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    reportType: 'lead_summary',
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    sendHour: 9,
    timezone: 'Asia/Tokyo',
    format: 'pdf',
    recipients: '',
  });

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        reportType: report.reportType as ReportFormData['reportType'],
        frequency: report.frequency as ReportFormData['frequency'],
        dayOfWeek: report.dayOfWeek ?? 1,
        dayOfMonth: report.dayOfMonth ?? 1,
        sendHour: report.sendHour,
        timezone: report.timezone,
        format: report.format as ReportFormData['format'],
        recipients: report.recipients,
      });
    } else {
      setFormData({
        name: '',
        reportType: 'lead_summary',
        frequency: 'weekly',
        dayOfWeek: 1,
        dayOfMonth: 1,
        sendHour: 9,
        timezone: 'Asia/Tokyo',
        format: 'pdf',
        recipients: '',
      });
    }
  }, [report]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const showDayOfWeek = formData.frequency === 'weekly';
  const showDayOfMonth = formData.frequency === 'monthly' || formData.frequency === 'quarterly';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('reports.editReport') : t('reports.createReport')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('reports.form.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('reports.form.namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">{t('reports.form.reportType')}</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) =>
                setFormData({ ...formData, reportType: value as ReportFormData['reportType'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead_summary">{t('reports.types.leadSummary')}</SelectItem>
                <SelectItem value="conversion_analysis">
                  {t('reports.types.conversionAnalysis')}
                </SelectItem>
                <SelectItem value="source_performance">
                  {t('reports.types.sourcePerformance')}
                </SelectItem>
                <SelectItem value="team_performance">
                  {t('reports.types.teamPerformance')}
                </SelectItem>
                <SelectItem value="custom">{t('reports.types.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">{t('reports.form.frequency')}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value as ReportFormData['frequency'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('reports.frequency.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('reports.frequency.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('reports.frequency.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('reports.frequency.quarterly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">{t('reports.form.format')}</Label>
              <Select
                value={formData.format}
                onValueChange={(value) =>
                  setFormData({ ...formData, format: value as ReportFormData['format'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showDayOfWeek && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">{t('reports.form.dayOfWeek')}</Label>
              <Select
                value={formData.dayOfWeek?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, dayOfWeek: Number.parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekdays.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {t(day.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showDayOfMonth && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">{t('reports.form.dayOfMonth')}</Label>
              <Select
                value={formData.dayOfMonth?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, dayOfMonth: Number.parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sendHour">{t('reports.form.sendHour')}</Label>
              <Select
                value={formData.sendHour.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, sendHour: Number.parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t('reports.form.timezone')}</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipients">{t('reports.form.recipients')}</Label>
            <Textarea
              id="recipients"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder={t('reports.form.recipientsPlaceholder')}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">{t('reports.form.recipientsHint')}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.saving') : isEditing ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
