'use client';

import { authClient } from '@/lib/auth/client';
import { RiArrowDownSLine, RiLogoutBoxRLine, RiSettings4Line, RiUserLine } from '@remixicon/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('header.userDropdown');

  // Get current session/user from BetterAuth
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getInitials(user?.name, user?.email);
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const result = await authClient.signOut();
      if (result.error) {
        console.error('Logout failed:', result.error);
        toast.error(t('logoutError'));
        return;
      }
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(t('logoutError'));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 text-sm p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* アバター */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-emerald-500 flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          {/* オンラインインジケーター */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-gray-900 rounded-full" />
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{displayName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
            {displayEmail}
          </p>
        </div>
        <RiArrowDownSLine
          className={`hidden lg:block w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 z-50 overflow-hidden">
          {/* ユーザー情報ヘッダー */}
          <div className="p-4 bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 border-b border-gray-100 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-emerald-500 flex items-center justify-center shadow-md">
                <span className="text-white font-semibold">{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</p>
              </div>
            </div>
          </div>

          {/* メニューアイテム */}
          <div className="py-2">
            <Link
              href={`/${locale}/settings`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <RiUserLine className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {t('profile')}
            </Link>
            <Link
              href={`/${locale}/settings/organization`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <RiSettings4Line className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {t('settings')}
            </Link>
          </div>

          {/* ログアウト */}
          <div className="border-t border-gray-100 dark:border-gray-700 py-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              <RiLogoutBoxRLine className="w-4 h-4" />
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
