'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Lead } from '@/lib/db/schema';
import { format, formatDistance } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import { Building2, Calendar, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

interface LeadDetailsProps {
  lead: Lead;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  isDeleting?: boolean;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
};

/**
 * Lead details component
 * Displays detailed lead information with edit/delete actions
 */
export function LeadDetails({ lead, onEdit, onDelete, isDeleting }: LeadDetailsProps) {
  const t = useTranslations('leads');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'ja' ? ja : enUS;
  const dateFormat = locale === 'ja' ? 'yyyy年MM月dd日 HH:mm' : 'MMM dd, yyyy HH:mm';

  const statusLabels = {
    new: tStatus('new'),
    contacted: tStatus('contacted'),
    qualified: tStatus('qualified'),
    converted: tStatus('converted'),
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{lead.name || t('nameNotSet')}</h2>
            <div className="mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[lead.status as keyof typeof statusColors]
                }`}
              >
                {statusLabels[lead.status as keyof typeof statusLabels]}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                {tCommon('edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {tCommon('delete')}
              </Button>
            )}
          </div>
        </div>

        {/* Contact information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('contactInfo')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t('email')}</div>
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                  {lead.email}
                </a>
              </div>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">{t('phone')}</div>
                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                    {lead.phone}
                  </a>
                </div>
              </div>
            )}

            {lead.company && (
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">{t('company')}</div>
                  <div className="font-medium">{lead.company}</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Lead score */}
        {lead.score !== null && lead.score !== undefined && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('leadScore')}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-600">{lead.score}</span>
              <span className="text-xl text-gray-500">{t('scoreMax')}</span>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${lead.score}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Source information */}
        {lead.source && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('sourceInfo')}</h3>
            <div>
              <div className="text-sm text-gray-500">{t('sourceChannel')}</div>
              <div className="font-medium capitalize mt-1">{lead.source}</div>
            </div>
          </Card>
        )}

        {/* Responses */}
        {lead.responses && Object.keys(lead.responses).length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('diagnosticResults')}</h3>
            <div className="space-y-3">
              {Object.entries(lead.responses as Record<string, unknown>).map(([key, value]) => (
                <div key={key}>
                  <div className="text-sm text-gray-500">{key}</div>
                  <div className="font-medium mt-1">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('timestamps')}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t('createdAt')}</div>
                <div className="font-medium">
                  {format(new Date(lead.createdAt), dateFormat, {
                    locale: dateLocale,
                  })}
                  <span className="text-sm text-gray-500 ml-2">
                    (
                    {formatDistance(new Date(lead.createdAt), new Date(), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                    )
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t('updatedAt')}</div>
                <div className="font-medium">
                  {format(new Date(lead.updatedAt), dateFormat, {
                    locale: dateLocale,
                  })}
                  <span className="text-sm text-gray-500 ml-2">
                    (
                    {formatDistance(new Date(lead.updatedAt), new Date(), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                    )
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmMessage', { name: lead.name || lead.email })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t('deleting') : tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
