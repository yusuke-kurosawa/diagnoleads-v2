'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary
 * Catches errors in the app and displays a fallback UI
 * Note: Cannot use useTranslations here as it's outside IntlProvider context
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error);
    // TODO: Send to Sentry
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          エラーが発生しました
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        {error.digest && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-500">エラーID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
