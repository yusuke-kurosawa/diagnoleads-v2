/**
 * Root Layout (Locale Redirect)
 *
 * このレイアウトは直接レンダリングされません
 * ミドルウェアがすべてのリクエストを /[locale]/* にリダイレクトします
 *
 * Note: この構造はNext.jsの要件により必要です
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
