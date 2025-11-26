import './globals.css';

/**
 * Root Layout
 *
 * Next.js App Routerの要件として、ルートレイアウトは
 * <html>と<body>タグを含む必要があります。
 *
 * 実際のロケール対応レイアウトは app/[locale]/layout.tsx で定義されています。
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
