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

### [Testing] テストカバレッジ目標
- **日付**: プロジェクト開始時
- **決定**: 70%
- **理由**: 実用的なバランス、100%は過剰
- **却下案**: 80%、90%

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

---

*最終更新: 2026-02-06*
