import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '認証 - DiagnoLeads',
  description: 'DiagnoLeads へのログイン・サインアップ',
};

/**
 * 認証レイアウト
 * ログイン、サインアップ、パスワードリセットページで共有
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">DiagnoLeads</h1>
          <p className="mt-2 text-sm text-gray-600">
            AI を活用した B2B 診断プラットフォーム
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
