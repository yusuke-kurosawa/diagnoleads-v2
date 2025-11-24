import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

/**
 * Home Page
 *
 * ロケール対応のホームページ
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">DiagnoLeads v2</h1>
        <p className="mt-4 text-xl text-gray-600 mb-8">
          {locale === 'ja'
            ? 'AI搭載 B2B診断プラットフォーム'
            : 'AI-Powered B2B Diagnostic Platform'}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('title')}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            {locale === 'ja' ? 'ログイン' : 'Login'}
          </Link>
        </div>
      </div>
    </main>
  );
}
