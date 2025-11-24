import Link from 'next/link';

/**
 * パスワードリセットページ
 * TODO: 実際のリセットフォームを実装
 */
export default function ResetPasswordPage() {
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
        パスワードリセット
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        登録されているメールアドレスを入力してください。
        <br />
        パスワードリセット用のリンクをお送りします。
      </p>

      {/* TODO: React Hook Form + BetterAuth によるリセットフォーム実装 */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          リセットリンクを送信
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          ← ログインページに戻る
        </Link>
      </div>
    </div>
  );
}
