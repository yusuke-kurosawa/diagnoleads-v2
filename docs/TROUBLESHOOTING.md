# DiagnoLeads v2 トラブルシューティングガイド

## 目次

1. [開発環境の問題](#開発環境の問題)
2. [データベースの問題](#データベースの問題)
3. [認証の問題](#認証の問題)
4. [APIの問題](#apiの問題)
5. [テストの問題](#テストの問題)
6. [ビルド・デプロイの問題](#ビルドデプロイの問題)
7. [パフォーマンスの問題](#パフォーマンスの問題)

---

## 開発環境の問題

### `bun install` が失敗する

**症状:** 依存関係のインストール時にエラーが発生

**解決方法:**
```bash
# キャッシュをクリア
bun pm cache rm

# node_modulesを削除して再インストール
rm -rf node_modules bun.lock
bun install
```

### 開発サーバーが起動しない

**症状:** `bun run dev` でエラー

**確認項目:**
1. Node.jsバージョン: `node --version` (20以上)
2. Bunバージョン: `bun --version` (1.1以上)
3. ポート競合: `lsof -i :3000`

**解決方法:**
```bash
# ポートを変更して起動
PORT=3001 bun run dev

# または競合プロセスを終了
kill -9 $(lsof -t -i:3000)
```

### 環境変数が読み込まれない

**症状:** 環境変数が `undefined`

**確認項目:**
1. `.env.local` が存在するか
2. 変数名が正しいか
3. `NEXT_PUBLIC_` プレフィックス（クライアント用）

**解決方法:**
```bash
# .env.example からコピー
cp .env.example .env.local

# サーバー再起動（env変更後は必須）
bun run dev
```

---

## データベースの問題

### 接続エラー

**症状:** `Connection refused` または `ECONNREFUSED`

**確認項目:**
```bash
# Dockerが起動しているか
docker compose ps

# PostgreSQLに接続できるか
docker compose exec db psql -U postgres -d diagnoleads
```

**解決方法:**
```bash
# Dockerを再起動
docker compose down
docker compose up -d

# 30秒待ってから再試行
sleep 30
bun run dev
```

### マイグレーションエラー

**症状:** `bun run db:push` が失敗

**解決方法:**
```bash
# スキーマを確認
bun run db:studio

# 強制的にプッシュ（開発環境のみ）
bunx drizzle-kit push --force

# それでも失敗する場合、DBをリセット
docker compose down -v
docker compose up -d
bun run db:push
```

### クエリが遅い

**症状:** API レスポンスが遅い

**確認項目:**
```sql
-- 実行計画を確認
EXPLAIN ANALYZE SELECT * FROM leads WHERE organization_id = 'xxx';
```

**解決方法:**
1. インデックスの追加を検討
2. `WHERE` 句の条件を最適化
3. 必要なカラムのみ `SELECT`

---

## 認証の問題

### ログインできない

**症状:** ログインフォーム送信後にエラー

**確認項目:**
1. `BETTER_AUTH_SECRET` が設定されているか
2. `BETTER_AUTH_URL` が正しいか
3. セッションCookieが設定されているか

**解決方法:**
```bash
# シークレットを再生成
openssl rand -base64 32
# .env.local に設定

# ブラウザのCookieをクリア
```

### セッションが切れる

**症状:** 突然ログアウトされる

**原因:**
- `BETTER_AUTH_SECRET` の変更
- Cookieの有効期限切れ
- サーバー再起動

**解決方法:**
```typescript
// auth設定でセッション期間を延長
session: {
  expiresIn: 60 * 60 * 24 * 30, // 30日
  updateAge: 60 * 60 * 24, // 1日ごとに更新
}
```

### 組織切り替えができない

**症状:** 組織選択後に反映されない

**確認項目:**
1. ユーザーが組織のメンバーか
2. `activeOrganizationId` が更新されているか

**解決方法:**
```bash
# セッションをクリア
# ブラウザの開発者ツール > Application > Cookies > 削除
```

---

## APIの問題

### 401 Unauthorized

**症状:** API呼び出しで認証エラー

**確認項目:**
1. セッションが有効か
2. Bearer トークンが正しいか
3. 組織IDが設定されているか

**解決方法:**
```typescript
// tRPCクライアントでセッションを確認
const session = await auth.api.getSession({ headers });
console.log('Session:', session);
```

### 403 Forbidden

**症状:** 権限エラー

**確認項目:**
1. ユーザーのロールを確認
2. CASL権限設定を確認

**解決方法:**
```typescript
// 権限をデバッグ
console.log('Can read leads:', ability.can('read', 'Lead'));
```

### 429 Too Many Requests

**症状:** レート制限エラー

**確認項目:**
```typescript
// レート制限設定を確認
import { RATE_LIMIT_CONFIGS } from '@/lib/middleware/rate-limit';
console.log(RATE_LIMIT_CONFIGS);
```

**解決方法:**
- しばらく待ってから再試行
- 開発環境ではレート制限を緩和

### tRPCエラー

**症状:** `TRPCClientError`

**デバッグ方法:**
```typescript
// エラーの詳細を確認
try {
  await trpc.leads.list.query({ organizationId });
} catch (error) {
  if (error instanceof TRPCClientError) {
    console.log('Code:', error.data?.code);
    console.log('Message:', error.message);
  }
}
```

---

## テストの問題

### テストが失敗する

**症状:** `bun run test` でエラー

**確認項目:**
```bash
# 型エラーがないか
bun run typecheck

# 特定のテストを実行
bun run test -- --run test/unit/features/specific.test.ts
```

### モックが効かない

**症状:** 実際のAPIが呼ばれる

**解決方法:**
```typescript
// vi.mockをファイルの先頭に移動
vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

// importより前に定義
```

### カバレッジが低い

**症状:** カバレッジレポートで低い数値

**確認項目:**
```bash
# カバレッジレポートを確認
bun run test:coverage

# 未カバーの行を特定
open coverage/index.html
```

---

## ビルド・デプロイの問題

### ビルドエラー

**症状:** `bun run build` が失敗

**確認項目:**
```bash
# 型エラーを確認
bun run typecheck

# ESLintエラーを確認
bun run lint
```

**解決方法:**
```bash
# キャッシュクリア
rm -rf .next
bun run build
```

### Vercelデプロイ失敗

**症状:** デプロイがエラーで終了

**確認項目:**
1. Vercelのビルドログを確認
2. 環境変数が設定されているか
3. Node.jsバージョンが正しいか

**解決方法:**
```json
// package.json でエンジンを指定
{
  "engines": {
    "node": ">=20"
  }
}
```

### PayloadCMS初期化エラー

**症状:** `/admin` アクセス時にエラー

**確認項目:**
1. `PAYLOAD_SECRET` が設定されているか
2. データベース接続が正しいか

**解決方法:**
```bash
# シークレットを再生成
openssl rand -base64 32
```

---

## パフォーマンスの問題

### ページ読み込みが遅い

**症状:** 初回ロードに時間がかかる

**確認項目:**
```bash
# バンドルサイズを確認
bun run build
# .next/analyze を確認
```

**解決方法:**
1. 動的インポートを使用
2. 画像を最適化 (`next/image`)
3. 不要な依存を削除

### APIレスポンスが遅い

**症状:** API呼び出しに時間がかかる

**確認項目:**
```typescript
// レスポンス時間を計測
const start = Date.now();
const result = await trpc.leads.list.query({ organizationId });
console.log('Duration:', Date.now() - start, 'ms');
```

**解決方法:**
1. キャッシュを活用
2. クエリを最適化
3. 必要なデータのみ取得

### メモリ使用量が高い

**症状:** サーバーがクラッシュする

**確認項目:**
```bash
# プロセスのメモリ使用量
ps aux | grep node
```

**解決方法:**
1. メモリリークを特定
2. 大きなオブジェクトを適切に解放
3. ストリーミングを使用

---

## サポート

問題が解決しない場合:

1. [GitHub Issues](https://github.com/yusuke-kurosawa/diagnoleads-v2/issues) で検索
2. 新しいIssueを作成（再現手順を含める）
3. [Discussions](https://github.com/yusuke-kurosawa/diagnoleads-v2/discussions) で質問

---

*最終更新: 2026-02-05*
