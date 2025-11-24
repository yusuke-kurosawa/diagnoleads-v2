import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

export const metadata: Metadata = {
  title: 'ダッシュボード - DiagnoLeads',
  description: 'DiagnoLeads ダッシュボード',
};

/**
 * ダッシュボードレイアウト
 * ナビゲーション、言語切り替え、ユーザーメニューを含む
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('navigation');
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href={`/${locale}`} className="text-2xl font-bold text-gray-900">
                DiagnoLeads
              </Link>
            </div>

            {/* 言語切り替えとユーザーメニュー */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <span className="text-sm text-gray-700">ユーザー名</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* サイドバーナビゲーション */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href={`/${locale}/dashboard`}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    {t('dashboard')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/leads`}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    {t('leads')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/organizations`}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    {t('organizations')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/settings`}
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    {t('settings')}
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
