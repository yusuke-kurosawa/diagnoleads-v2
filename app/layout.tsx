/**
 * Root Layout
 *
 * PayloadCMS v3とNext.js App Routerの統合のため、
 * このルートレイアウトはchildrenのみを返します。
 *
 * 各ルートグループで独自の<html>と<body>を定義:
 * - app/[locale]/layout.tsx - 通常のアプリ用
 * - app/(payload)/layout.tsx - PayloadCMS管理画面用
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
