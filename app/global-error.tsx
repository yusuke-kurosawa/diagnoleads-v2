'use client';

import { useTranslations } from 'next-intl';

/**
 * Global Error Boundary (Root Level)
 * Catches errors in the root layout
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('settings.errorPages.globalError');

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">{t('title')}</h2>
            <p className="mb-6 text-gray-600">
              {t('message')}
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-gray-500">{t('errorId', { digest: error.digest })}</p>
            )}
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
