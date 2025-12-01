'use client';

/**
 * Global Error Boundary (Root Level)
 * Catches errors in the root layout
 * Note: Cannot use useTranslations here as it's outside IntlProvider context
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="bg-white dark:bg-gray-900">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              システムエラー
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              システムエラーが発生しました。ページを再読み込みしてください。
            </p>
            {error.digest && <p className="mb-4 text-sm text-gray-500">エラーID: {error.digest}</p>}
            <button
              onClick={reset}
              className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700 transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
