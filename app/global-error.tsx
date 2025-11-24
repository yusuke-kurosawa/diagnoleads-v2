'use client';

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
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">システムエラー</h2>
            <p className="mb-6 text-gray-600">
              システムエラーが発生しました。ページを再読み込みしてください。
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-gray-500">エラーID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
