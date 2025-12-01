'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

/**
 * Locale-specific Error Boundary
 * Catches errors within the [locale] segment
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
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">{t('message')}</p>
        {error.digest && (
          <p className="mb-4 text-sm text-gray-500">{t('errorId', { digest: error.digest })}</p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
