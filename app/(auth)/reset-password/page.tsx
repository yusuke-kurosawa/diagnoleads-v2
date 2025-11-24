import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

/**
 * パスワードリセットページ
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

      <ResetPasswordForm />

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
