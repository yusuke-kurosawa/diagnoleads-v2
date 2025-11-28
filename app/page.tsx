import { defaultLocale } from '@/lib/i18n/config';
import { redirect } from 'next/navigation';

/**
 * Root Page (Locale Redirect)
 *
 * ロケールが指定されていない場合、デフォルトロケールにリダイレクト
 * ミドルウェアが主にこれを処理しますが、フォールバックとして提供
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
