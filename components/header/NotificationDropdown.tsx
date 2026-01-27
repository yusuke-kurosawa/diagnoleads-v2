'use client';

import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/use-notifications';
import { useOrganization } from '@/hooks/use-organization';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ja } from 'date-fns/locale';
import {
  Bell,
  Check,
  CheckCheck,
  FileSpreadsheet,
  Mail,
  Star,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const notificationIcons: Record<string, React.ElementType> = {
  lead_created: UserPlus,
  lead_status_changed: Users,
  lead_scored: Star,
  import_completed: FileSpreadsheet,
  export_completed: FileSpreadsheet,
  member_invited: Mail,
  member_removed: UserMinus,
  system: Bell,
};

const notificationColors: Record<string, string> = {
  lead_created: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  lead_status_changed: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  lead_scored: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  import_completed: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  export_completed: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  member_invited: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  member_removed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

export default function NotificationDropdown() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const dateLocale = locale === 'ja' ? ja : enUS;
  const { organizationId: orgId } = useOrganization();
  const organizationId = orgId || undefined;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useNotifications(organizationId, { limit: 10 });
  const { data: unreadData } = useUnreadCount(organizationId);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate({ organizationId });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('unreadCount', { count: unreadCount })}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium"
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="w-4 h-4" />
                {t('markAllAsRead')}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t('noNotifications')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('noNotificationsDescription')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  const colorClass =
                    notificationColors[notification.type] || notificationColors.system;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                        !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                      )}
                      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                          colorClass
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm',
                            notification.read
                              ? 'text-gray-600 dark:text-gray-300'
                              : 'text-gray-900 dark:text-white font-medium'
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                          title={t('markAsRead')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Link
              href="/settings#notifications"
              className="block w-full text-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium py-1"
              onClick={() => setIsOpen(false)}
            >
              {t('viewSettings')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
