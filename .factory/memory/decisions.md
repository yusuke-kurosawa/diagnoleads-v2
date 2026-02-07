# MemoryBank: 意思決定履歴

> このファイルはDroidが参照する意思決定の履歴です。
> 新しいセッションでも過去の決定を一貫して適用します。

---

## 記録フォーマット

```
### [カテゴリ] 決定事項
- **日付**: YYYY-MM-DD
- **決定**: 採用した選択肢
- **理由**: なぜこの決定をしたか
- **却下案**: 検討したが採用しなかった案
```

---

## アーキテクチャ

### [Framework] アジャイル開発フレームワーク名称
- **日付**: 2026-02-06
- **決定**: SprintPath
- **理由**: 製品名(DiagnoLeads)に依存しない汎用的なフレームワーク名が必要
- **却下案**: DiagnoFlow（製品名が含まれる）、FlowForge、AgileCore、5Flow

### [Framework] SprintPath第3原則
- **日付**: 2026-02-06
- **決定**: Clear Ownership（明確な責任）
- **理由**: 役割分担の明確化を重視。Collaborative Developmentは補完的概念として位置付け
- **却下案**: Human-AI Collaboration（Droid特有すぎる）、Collaborative Development（Clear Ownershipと相反しないが焦点が異なる）

---

## 技術選定

### [Testing] テストフレームワーク
- **日付**: プロジェクト開始時
- **決定**: Vitest
- **理由**: Bunとの互換性、Jestより高速、ESM対応
- **却下案**: Jest

### [Linting] リンター・フォーマッター
- **日付**: プロジェクト開始時
- **決定**: Biome
- **理由**: ESLint + Prettierより高速、設定がシンプル
- **却下案**: ESLint + Prettier

### [ORM] データベースORM
- **日付**: プロジェクト開始時
- **決定**: Drizzle ORM
- **理由**: 型安全、軽量、SQLに近い記法
- **却下案**: Prisma（重い）、Kysely

### [Auth] 認証ライブラリ
- **日付**: プロジェクト開始時
- **決定**: Better Auth
- **理由**: Next.js App Router対応、柔軟性
- **却下案**: NextAuth/Auth.js、Lucia

### [CMS] コンテンツ管理
- **日付**: プロジェクト開始時
- **決定**: PayloadCMS 3.x
- **理由**: TypeScript native、Next.js統合、セルフホスト可能
- **却下案**: Sanity、Strapi、Contentful

### [UI] ダッシュボードUIライブラリ
- **日付**: プロジェクト開始時
- **決定**: TailAdmin
- **理由**: 無料、500+コンポーネント、Tailwind v4対応、Next.js対応
- **却下案**: Flowbite Admin

---

## コーディング規約

### [Style] コミットメッセージ言語
- **日付**: 2026-02-06
- **決定**: 英語
- **理由**: 国際的な標準、GitHub上での可読性
- **却下案**: 日本語

### [Style] コミットメッセージの絵文字
- **日付**: 2026-02-06
- **決定**: 使用しない
- **理由**: ユーザーの明示的な指示
- **却下案**: gitmoji形式

### [Style] コミットメッセージ形式
- **日付**: プロジェクト開始時
- **決定**: Conventional Commits
- **理由**: 自動changelog生成、セマンティックバージョニング対応
- **却下案**: 自由形式

---

## プロセス

### [Workflow] ブランチ戦略
- **日付**: プロジェクト開始時
- **決定**: mainブランチ直接開発（小規模チーム）
- **理由**: 迅速なイテレーション、CI/CDで品質担保
- **却下案**: GitFlow、GitHub Flow（PRベース）

### [Testing] テストカバレッジ方針
- **日付**: 2026-02-06
- **決定**: 層別カバレッジ目標 + E2E補完
  - Core (lib/features, lib/db, lib/auth): 80%
  - API (server/, app/api/): 70%
  - UI (components/, app/[locale]/): 30-40% (E2Eで補完)
  - E2E: 主要フロー100%
  - 全体目標: 40%+ (E2E含めた実質70%+)
- **理由**: 
  - 品質の一貫性を保つため、カバレッジ対象を恣意的に除外しない
  - UIコンポーネントはE2Eで効果的にカバー可能
  - ビジネスロジック層は高カバレッジを維持
- **却下案**: 
  - 全体70%一律目標（UIテストのコストが高すぎる）
  - カバレッジ対象からUIを除外（品質の一貫性が損なわれる）

---

## 命名規則

### [Naming] 機能モジュールの配置
- **日付**: プロジェクト開始時
- **決定**: `lib/features/{feature-name}/`
- **理由**: Feature-based構造、関連ファイルの近接配置
- **却下案**: `lib/{domain}/`、`src/modules/`

### [Naming] テストファイルの配置
- **日付**: プロジェクト開始時
- **決定**: `test/unit/features/{feature}.test.ts`
- **理由**: テストとソースの分離、CI設定の容易さ
- **却下案**: コロケーション（`*.test.ts`を同じディレクトリに）

### [Naming] テストファイル命名規則（種別別）
- **日付**: 2026-02-07
- **決定**: 
  - `*.test.ts` → Unit tests（外部依存なし、高速）
  - `*.integration.ts` → Integration tests（モック使用、中程度）
  - `*.spec.ts` → E2E tests（実環境、長時間）
- **理由**: 
  - テスト種別による明確な分類
  - CI並列化の容易さ（種別ごとに分離実行可能）
  - 外部依存の有無が明確になる
- **却下案**: 
  - レイヤー別のみの分類（Unit/Integration/E2Eが混在）
  - ディレクトリ分離のみ（ファイル名で判別不可）

---

## Issue管理

### [Process] テストIssue階層構造
- **日付**: 2026-02-07
- **決定**: テスト種別 → レイヤー別SubIssueの2階層構造
  ```
  #6 テストカバレッジ向上 (親)
  ├── #16 Unit Tests
  │   ├── #19 [Unit] Core層
  │   └── #20 [Unit] UI層
  ├── #17 Integration Tests
  │   ├── #21 [Integration] API層
  │   └── #22 [Integration] Core層
  └── #18 E2E Tests
      ├── #23 [E2E] 認証フロー
      ├── #24 [E2E] リード管理フロー
      └── #25 [E2E] 診断フォームフロー
  ```
- **理由**: 
  - テスト種別軸でCI最適化可能
  - レイヤー別で進捗管理が細かくできる
  - SprintPathの5原則（Clear Ownership, Visibility）に適合
- **却下案**: 
  - レイヤー別のみ（#11 Core, #12 API等）→ テスト種別が混在
  - フラットなIssue構造（進捗管理が困難）

---

*最終更新: 2026-02-07*
