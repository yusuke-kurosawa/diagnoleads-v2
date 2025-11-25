import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';

/**
 * ログインページ
 */
export default async function LoginPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'settings.auth.login' });

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        {t('title')}
      </h2>

      <LoginForm />

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <Link
            href="/reset-password"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
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
