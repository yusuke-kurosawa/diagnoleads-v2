# DiagnoLeads v2 プロジェクト進行ワークフロー

## 概要

このドキュメントは、DiagnoLeads v2の開発における**標準ワークフロー**を定義します。
全てのチームメンバー（人間・AI Agent）はこのフローに従って作業を行います。

---

## 🔄 標準開発フロー (7ステップ)

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1: Issue確認/作成                                              │
│  ↓                                                                   │
│  STEP 2: Issue準備 (ラベル付け・見積もり)                             │
│  ↓                                                                   │
│  STEP 3: ブランチ作成・作業開始                                       │
│  ↓                                                                   │
│  STEP 4: 実装・テスト                                                │
│  ↓                                                                   │
│  STEP 5: PR作成・レビュー依頼                                        │
│  ↓                                                                   │
│  STEP 6: レビュー・修正                                              │
│  ↓                                                                   │
│  STEP 7: マージ・クローズ                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## STEP 1: Issue確認/作成

### 目的
作業の追跡可能性を確保し、スコープを明確にする

### 手順

```bash
# 1-1. 既存Issueを確認
gh issue list --state open --label "status: ready"

# 1-2. 該当Issueがない場合は作成
gh issue create --template user_story.yml   # 新機能
gh issue create --template bug_report.yml   # バグ
gh issue create --template task.yml         # 技術タスク
gh issue create --template spike.yml        # 調査
```

### チェックリスト
- [ ] 対応するIssueが存在する
- [ ] Issueの内容が明確である
- [ ] 受け入れ基準が定義されている

---

## STEP 2: Issue準備

### 目的
作業の優先度と規模を明確にし、計画に組み込む

### 必須ラベル

| カテゴリ | ラベル | 選択肢 |
|---------|--------|--------|
| 優先度 | `priority:` | `critical` / `high` / `medium` / `low` |
| タイプ | `type:` | `feature` / `tech-debt` / `test` / `spike` |
| 見積もり | `story-points:` | `1` / `2` / `3` / `5` / `8` |
| ステータス | `status:` | `backlog` → `ready` |
| エリア | `area:` | `frontend` / `backend` / `database` / `devops` / `ai` |

### コマンド

```bash
# ラベル追加
gh issue edit <NUMBER> --add-label "priority: high"
gh issue edit <NUMBER> --add-label "type: feature"
gh issue edit <NUMBER> --add-label "story-points: 3"
gh issue edit <NUMBER> --add-label "status: ready"
gh issue edit <NUMBER> --add-label "area: backend"

# アサイン
gh issue edit <NUMBER> --add-assignee @me
```

### チェックリスト
- [ ] 全必須ラベルが付いている
- [ ] ステータスが `status: ready` になっている
- [ ] 担当者がアサインされている

---

## STEP 3: ブランチ作成・作業開始

### 目的
Issueと実装を紐付け、作業開始を明示する

### ブランチ命名規則

```
{type}/{issue-number}-{short-description}
```

| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能 | `feat/123-lead-export` |
| `fix` | バグ修正 | `fix/456-login-error` |
| `refactor` | リファクタリング | `refactor/789-optimize-query` |
| `test` | テスト追加 | `test/101-auth-tests` |
| `docs` | ドキュメント | `docs/102-api-docs` |
| `chore` | その他 | `chore/103-update-deps` |

### コマンド

```bash
# 3-1. 最新のmainを取得
git checkout main
git pull origin main

# 3-2. ブランチ作成
git checkout -b feat/123-lead-export

# 3-3. Issueステータス更新
gh issue edit 123 --remove-label "status: ready"
gh issue edit 123 --add-label "status: in-progress"
```

### チェックリスト
- [ ] mainブランチが最新
- [ ] ブランチ名にIssue番号が含まれている
- [ ] Issueステータスが `status: in-progress`

---

## STEP 4: 実装・テスト

### 目的
品質を担保しながら機能を実装する

### 実装ルール

1. **コードスタイル**: Biomeに従う
2. **テスト**: 新機能には必ずテストを書く
3. **i18n**: UI文字列は `locales/` に定義
4. **型安全**: `any` を使わない

### コミット規則

```bash
# コミットメッセージ形式
git commit -m "type(scope): description

- Detail 1
- Detail 2

Refs #123"
```

### テスト実行

```bash
# 必須: 全テスト通過を確認
bun run test
bun run typecheck
bun run lint
```

### チェックリスト
- [ ] 機能が実装されている
- [ ] テストが書かれている
- [ ] `bun run test` が通る
- [ ] `bun run typecheck` が通る
- [ ] `bun run lint` が通る

---

## STEP 5: PR作成・レビュー依頼

### 目的
コードレビューを通じて品質を担保する

### PR作成

```bash
# 5-1. 変更をプッシュ
git push origin feat/123-lead-export

# 5-2. PR作成 (テンプレートに従う)
gh pr create --title "feat(leads): add export functionality" \
  --body "## Description
Add CSV export for leads.

## Related Issues
Closes #123

## Changes Made
- Add export button
- Implement export API
- Add tests"
```

### PR必須事項

| 項目 | 必須 |
|------|------|
| タイトル: `type(scope): description` | ✅ |
| Issue紐付け: `Closes #xxx` | ✅ |
| 変更内容の説明 | ✅ |
| テスト通過の確認 | ✅ |
| チェックリスト完了 | ✅ |

### Issueステータス更新

```bash
gh issue edit 123 --remove-label "status: in-progress"
gh issue edit 123 --add-label "status: review"
```

### チェックリスト
- [ ] PRタイトルが規約に従っている
- [ ] `Closes #xxx` でIssueが紐付いている
- [ ] PRテンプレートのチェックリストが完了
- [ ] Issueステータスが `status: review`

---

## STEP 6: レビュー・修正

### 目的
第三者の目でコード品質を確認する

### レビュー観点

| 観点 | チェック内容 |
|------|-------------|
| 機能 | 要件を満たしているか |
| コード品質 | 可読性、保守性 |
| テスト | 十分なカバレッジか |
| セキュリティ | 脆弱性がないか |
| パフォーマンス | 明らかな問題がないか |

### 修正対応

```bash
# レビュー指摘を修正
git add .
git commit -m "fix: address review comments

- Fix variable naming
- Add missing test case

Refs #123"
git push origin feat/123-lead-export
```

### チェックリスト
- [ ] 全てのレビューコメントに対応
- [ ] 追加のテストが必要な場合は追加
- [ ] CIが全てグリーン

---

## STEP 7: マージ・クローズ

### 目的
変更をmainに統合し、作業を完了する

### マージ

```bash
# Squash mergeを推奨
gh pr merge --squash
```

### 確認事項

```bash
# マージ後の確認
git checkout main
git pull origin main
bun run test
```

### Issueは自動クローズ
`Closes #123` により、PRマージ時にIssueが自動クローズされます。

### チェックリスト
- [ ] PRがマージされた
- [ ] Issueが自動クローズされた
- [ ] mainブランチでテストが通る

---

## 🚨 緊急対応フロー (Hotfix)

本番で緊急のバグが発生した場合:

```bash
# 1. Hotfixブランチ作成
git checkout main
git pull origin main
git checkout -b hotfix/999-critical-bug

# 2. 最小限の修正
# ... 修正 ...

# 3. テスト
bun run test

# 4. 直接PRを作成 (レビュー簡略化可)
gh pr create --title "hotfix: fix critical bug" --body "Fixes #999"

# 5. 承認後即マージ
gh pr merge --squash
```

---

## 📊 ステータス遷移図

```
                    ┌─────────────┐
                    │   Backlog   │ ← 新規Issue作成
                    └──────┬──────┘
                           │ リファインメント
                           ▼
                    ┌─────────────┐
                    │    Ready    │ ← スプリント準備完了
                    └──────┬──────┘
                           │ 作業開始
                           ▼
                    ┌─────────────┐
            ┌──────►│ In Progress │ ← 実装中
            │       └──────┬──────┘
            │              │ PR作成
   修正依頼 │              ▼
            │       ┌─────────────┐
            └───────┤   Review    │ ← レビュー中
                    └──────┬──────┘
                           │ 承認・マージ
                           ▼
                    ┌─────────────┐
                    │   Closed    │ ← 完了
                    └─────────────┘

                    ┌─────────────┐
                    │   Blocked   │ ← 依存関係でブロック
                    └─────────────┘
                      (任意のステータスから遷移可)
```

---

## 📅 スプリントサイクル

### Week 1

| 曜日 | イベント | 時間 |
|------|---------|------|
| 月 | スプリントプランニング | 2-4h |
| 火-金 | デイリースタンドアップ | 15min/日 |
| 木 | バックログリファインメント | 1h |

### Week 2

| 曜日 | イベント | 時間 |
|------|---------|------|
| 月-木 | デイリースタンドアップ | 15min/日 |
| 金 | スプリントレビュー | 1-2h |
| 金 | レトロスペクティブ | 1-1.5h |

---

## 関連ドキュメント

- [AGILE_PROCESS.md](./AGILE_PROCESS.md) - スクラムプロセス詳細
- [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) - バックログ管理
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 開発者ガイド

---

*最終更新: 2026-02-06*
