'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Divider, Text } from '@/components/ui/metric';
import { Switch } from '@/components/ui/switch';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notifications';
import { useOrganization } from '@/hooks/use-organization';
import { Bell, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  organizationId?: string;
}

export function NotificationSettings({ organizationId: propOrgId }: NotificationSettingsProps) {
  const t = useTranslations('notifications.settings');
  const { organizationId: contextOrgId } = useOrganization();
  const organizationId = propOrgId || contextOrgId;

  const { data: preferences, isLoading } = useNotificationPreferences(organizationId || '');
  const updatePreferences = useUpdateNotificationPreferences();

  // Local state for preferences
  const [localPrefs, setLocalPrefs] = useState({
    inAppLeadCreated: true,
    inAppLeadStatusChanged: true,
    inAppLeadScored: true,
    inAppImportExport: true,
    inAppMemberChanges: true,
    emailLeadCreated: false,
    emailLeadStatusChanged: false,
    emailLeadScored: false,
    emailDailyDigest: false,
    emailWeeklyReport: true,
  });

  // Sync with server preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        inAppLeadCreated: preferences.inAppLeadCreated,
        inAppLeadStatusChanged: preferences.inAppLeadStatusChanged,
        inAppLeadScored: preferences.inAppLeadScored,
        inAppImportExport: preferences.inAppImportExport,
        inAppMemberChanges: preferences.inAppMemberChanges,
        emailLeadCreated: preferences.emailLeadCreated,
        emailLeadStatusChanged: preferences.emailLeadStatusChanged,
        emailLeadScored: preferences.emailLeadScored,
        emailDailyDigest: preferences.emailDailyDigest,
        emailWeeklyReport: preferences.emailWeeklyReport,
      });
    }
  }, [preferences]);

  const handleToggle = useCallback(
    async (key: keyof typeof localPrefs, value: boolean) => {
      if (!organizationId) return;

      // Optimistic update
      setLocalPrefs((prev) => ({ ...prev, [key]: value }));

      try {
        await updatePreferences.mutateAsync({
          organizationId,
          [key]: value,
        });
        toast.success(t('saved'));
      } catch {
        // Revert on error
        setLocalPrefs((prev) => ({ ...prev, [key]: !value }));
        toast.error(t('saveError'));
      }
    },
    [organizationId, updatePreferences, t]
  );

  if (!organizationId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card decoration="top" decorationColor="amber">
        <div className="p-6 space-y-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card id="notifications" decoration="top" decorationColor="amber">
      <div className="p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          {t('title')}
        </h2>
        <Text>{t('description')}</Text>

        {/* In-App Notifications */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            {t('inApp.title')}
          </h3>
          <Text className="text-sm">{t('inApp.description')}</Text>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="inAppLeadCreated" className="cursor-pointer">
                {t('inApp.leadCreated')}
              </Label>
              <Switch
                id="inAppLeadCreated"
                checked={localPrefs.inAppLeadCreated}
                onCheckedChange={(checked) => handleToggle('inAppLeadCreated', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="inAppLeadStatusChanged" className="cursor-pointer">
                {t('inApp.leadStatusChanged')}
              </Label>
              <Switch
                id="inAppLeadStatusChanged"
                checked={localPrefs.inAppLeadStatusChanged}
                onCheckedChange={(checked) => handleToggle('inAppLeadStatusChanged', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="inAppLeadScored" className="cursor-pointer">
                {t('inApp.leadScored')}
              </Label>
              <Switch
                id="inAppLeadScored"
                checked={localPrefs.inAppLeadScored}
                onCheckedChange={(checked) => handleToggle('inAppLeadScored', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="inAppImportExport" className="cursor-pointer">
                {t('inApp.importExport')}
              </Label>
              <Switch
                id="inAppImportExport"
                checked={localPrefs.inAppImportExport}
                onCheckedChange={(checked) => handleToggle('inAppImportExport', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="inAppMemberChanges" className="cursor-pointer">
                {t('inApp.memberChanges')}
              </Label>
              <Switch
                id="inAppMemberChanges"
                checked={localPrefs.inAppMemberChanges}
                onCheckedChange={(checked) => handleToggle('inAppMemberChanges', checked)}
              />
            </div>
          </div>
        </div>

        <Divider />

        {/* Email Notifications */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            {t('email.title')}
          </h3>
          <Text className="text-sm">{t('email.description')}</Text>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="emailLeadCreated" className="cursor-pointer">
                {t('email.leadCreated')}
              </Label>
              <Switch
                id="emailLeadCreated"
                checked={localPrefs.emailLeadCreated}
                onCheckedChange={(checked) => handleToggle('emailLeadCreated', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="emailLeadStatusChanged" className="cursor-pointer">
                {t('email.leadStatusChanged')}
              </Label>
              <Switch
                id="emailLeadStatusChanged"
                checked={localPrefs.emailLeadStatusChanged}
                onCheckedChange={(checked) => handleToggle('emailLeadStatusChanged', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="emailLeadScored" className="cursor-pointer">
                {t('email.leadScored')}
              </Label>
              <Switch
                id="emailLeadScored"
                checked={localPrefs.emailLeadScored}
                onCheckedChange={(checked) => handleToggle('emailLeadScored', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="emailDailyDigest" className="cursor-pointer">
                {t('email.dailyDigest')}
              </Label>
              <Switch
                id="emailDailyDigest"
                checked={localPrefs.emailDailyDigest}
                onCheckedChange={(checked) => handleToggle('emailDailyDigest', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <Label htmlFor="emailWeeklyReport" className="cursor-pointer">
                {t('email.weeklyReport')}
              </Label>
              <Switch
                id="emailWeeklyReport"
                checked={localPrefs.emailWeeklyReport}
                onCheckedChange={(checked) => handleToggle('emailWeeklyReport', checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
