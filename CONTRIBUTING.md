# Contributing to DiagnoLeads v2

## はじめに

DiagnoLeads v2への貢献を検討いただきありがとうございます。このドキュメントでは、プロジェクトへの貢献方法について説明します。

---

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- Bun 1.1+
- Docker & Docker Compose
- Git

### 初期セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yusuke-kurosawa/diagnoleads-v2.git
cd diagnoleads-v2

# 依存関係のインストール
bun install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集

# ローカルサービスの起動 (PostgreSQL, Redis, Mailhog)
docker compose up -d

# データベースのセットアップ
bun run db:push

# 開発サーバーの起動
bun run dev
```

---

## プロジェクト構造

```
diagnoleads-v2/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes (ja, en)
│   ├── api/               # API routes
│   └── (payload)/         # PayloadCMS admin
├── lib/
│   ├── features/          # Feature modules
│   ├── db/                # Drizzle ORM
│   ├── auth/              # Better Auth
│   ├── cache/             # Redis/Memory cache
│   ├── jobs/              # Background jobs
│   ├── events/            # Event bus
│   └── ...
├── components/            # React components
├── test/
│   ├── unit/              # Vitest unit tests
│   └── e2e/               # Playwright E2E tests
└── docs/                  # Documentation
```

---

## コーディング規約

### TypeScript

- Strict modeを使用
- `any`の使用を避ける
- 型定義は `types.ts` ファイルにまとめる

### コードスタイル

Biomeを使用してリント・フォーマットを行います:

```bash
# リント実行
bun run lint

# 自動修正
bun run lint:fix
```

### 命名規則

| 種類 | 規則 | 例 |
|------|------|-----|
| ファイル | kebab-case | `user-service.ts` |
| コンポーネント | PascalCase | `UserProfile.tsx` |
| 関数 | camelCase | `getUserById` |
| 定数 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 型/インターフェース | PascalCase | `UserProfile` |

### インポート順序

```typescript
// 1. Node.js built-ins
import crypto from 'node:crypto';

// 2. External packages
import { z } from 'zod';

// 3. Internal aliases (@/)
import { db } from '@/lib/db';

// 4. Relative imports
import { helper } from './helper';
```

---

## コミット規約

### コミットメッセージ形式

```
type(scope): description

[optional body]

[optional footer]
```

### Type一覧

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット変更 |
| `refactor` | リファクタリング |
| `test` | テスト |
| `chore` | その他 |
| `perf` | パフォーマンス改善 |

### 例

```bash
feat(leads): add bulk export functionality
fix(auth): resolve session timeout issue
docs(api): update OpenAPI specification
test(webhooks): add delivery retry tests
```

---

## テスト

### ユニットテスト (Vitest)

```bash
# 全テスト実行
bun run test

# 特定ファイル
bun run test test/unit/features/leads.test.ts

# カバレッジ
bun run test:coverage

# ウォッチモード
bun run test:watch
```

### テストファイルの配置

```
test/unit/features/{feature-name}.test.ts
```

### テストの書き方

```typescript
import { describe, expect, it, vi } from 'vitest';

describe('FeatureName', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { ... };

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### E2Eテスト (Playwright)

```bash
# E2Eテスト実行
bun run test:e2e

# UIモード
bun run test:e2e:ui

# 特定ファイル
bunx playwright test test/e2e/auth.spec.ts
```

---

## Pull Requestの作成

### PRチェックリスト

- [ ] テストが全てパスする (`bun run test`)
- [ ] 型チェックがパスする (`bun run typecheck`)
- [ ] リントがパスする (`bun run lint`)
- [ ] 必要に応じてドキュメントを更新
- [ ] コミットメッセージが規約に従っている

### PRの流れ

1. Issueの確認または作成
2. featureブランチを作成 (`git checkout -b feat/feature-name`)
3. 変更をコミット
4. プッシュ (`git push origin feat/feature-name`)
5. Pull Requestを作成
6. レビューを受ける
7. 承認後マージ

### ブランチ命名

```
feat/feature-name
fix/bug-description
docs/documentation-topic
refactor/refactor-scope
```

---

## データベース操作

### マイグレーション

```bash
# スキーマ変更をDBに反映
bun run db:push

# マイグレーションファイル生成
bun run db:generate

# マイグレーション実行
bun run db:migrate

# Drizzle Studio (GUI)
bun run db:studio
```

### スキーマ変更時の注意

1. `lib/db/schema.ts` を変更
2. `bun run db:push` で開発DBに反映
3. テストを実行して確認
4. PRにスキーマ変更を含める

---

## 新機能の追加

### Feature Moduleの構造

```
lib/features/{feature-name}/
├── types.ts           # 型定義
├── service.ts         # ビジネスロジック
├── api/
│   └── router.ts      # tRPC router
└── index.ts           # エクスポート
```

### 実装の流れ

1. `types.ts` で型とZodスキーマを定義
2. `service.ts` でビジネスロジックを実装
3. `router.ts` でAPIエンドポイントを定義
4. テストを作成
5. `index.ts` でエクスポート

---

## トラブルシューティング

### よくある問題

#### `bun install` が失敗する

```bash
# キャッシュクリア
bun pm cache rm
bun install
```

#### データベース接続エラー

```bash
# Dockerが起動しているか確認
docker compose ps

# 再起動
docker compose down && docker compose up -d
```

#### テストが失敗する

```bash
# 型チェック
bun run typecheck

# 単体で実行
bun run test -- --run test/unit/features/specific.test.ts
```

---

## コンタクト

- Issue: [GitHub Issues](https://github.com/yusuke-kurosawa/diagnoleads-v2/issues)
- Discussion: [GitHub Discussions](https://github.com/yusuke-kurosawa/diagnoleads-v2/discussions)

---

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
