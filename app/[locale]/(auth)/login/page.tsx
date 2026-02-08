import { LoginForm } from '@/components/auth/LoginForm';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * ログインページ
 */
export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.auth.login' });

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">{t('title')}</h2>

      {/* 開発環境用テストユーザー情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            {locale === 'ja' ? 'テストユーザー' : 'Test User'}
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <span className="font-medium">{locale === 'ja' ? 'メール:' : 'Email:'}</span>{' '}
              <code className="bg-blue-100 px-1 rounded">test@example.com</code>
            </p>
            <p>
              <span className="font-medium">{locale === 'ja' ? 'パスワード:' : 'Password:'}</span>{' '}
              <code className="bg-blue-100 px-1 rounded">password123</code>
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
        <LoginForm />
      </Suspense>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
            {t('forgotPassword')}
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('divider')}</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/signup"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('signupLink')}
          </Link>
        </div>
      </div>

      {/* TODO: ソーシャルログイン (Google, GitHub) */}
    </div>
  );
}
