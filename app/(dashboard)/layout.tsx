import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ダッシュボード - DiagnoLeads',
  description: 'DiagnoLeads ダッシュボード',
};

/**
 * ダッシュボードレイアウト
 * TODO: ナビゲーション、ユーザーメニュー、組織切り替えを実装
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                DiagnoLeads
              </Link>
            </div>

            {/* TODO: ユーザーメニュー、組織切り替え */}
            <div className="flex items-center space-x-4">
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
                    href="/dashboard"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    ダッシュボード
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leads"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    リード管理
                  </Link>
                </li>
                <li>
                  <Link
                    href="/organizations"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    組織設定
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    個人設定
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
