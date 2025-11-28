'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/**
 * Global Error Boundary
 * Catches errors in the app and displays a fallback UI
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('settings.errorPages.error');

  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error);
    // TODO: Send to Sentry
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-6 text-gray-600">{t('message')}</p>
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
  );
}
