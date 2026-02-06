# DiagnoLeads v2 - Droid Instructions

## Project Overview

DiagnoLeads v2 is an enterprise-grade diagnostic lead management platform built with Next.js 15, featuring AI-powered lead scoring, multi-tenant support, and holdings/group company hierarchy management.

---

## 🧠 MemoryBank (MUST READ)

> セッション間で一貫した判断を行うための記憶システム

**セッション開始時に必ず参照:**

| ファイル | 内容 | 重要度 |
|----------|------|--------|
| `.factory/memory/violations.md` | **原則違反記録** | **必読** |
| `.factory/memory/decisions.md` | 過去の意思決定 | 必読 |
| `.factory/memory/preferences.md` | ユーザーの好み | 必読 |
| `.factory/memory/learnings.md` | 学習・教訓 | 必読 |

**更新タイミング:**
- **原則に違反した → `violations.md` に記録（必須）**
- 重要な意思決定をした → `decisions.md` に追記
- ユーザーの好みが判明した → `preferences.md` に追記
- 問題を解決した / 学びがあった → `learnings.md` に追記

---

## 🚀 SprintPath - アジャイル開発フレームワーク

> **SprintPath**は汎用的なアジャイル開発フレームワークです。
> 全てのDroid作業はSprintPathに従って実行されます。

### SprintPathの5原則 (MUST FOLLOW)

| 原則 | 説明 |
|------|------|
| 🎯 **Issue-First** | コードを書く前に、必ずIssueを確認する |
| 🔄 **Continuous Quality** | テストが通らなければ、コミットしない |
| 👤 **Clear Ownership** | 役割分担を明確にし、責任者を決める |
| 📊 **Visibility** | 進捗は常に見える状態にする |
| 🚀 **Ship Small** | 大きな変更より、小さな改善を積み重ねる |

**詳細**: [docs/SPRINTPATH.md](./docs/SPRINTPATH.md)

---

## ⚠️ SprintPath開発サイクル (MUST FOLLOW)

### 🔄 サイクル図

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: タスク確認                                          │
│  ↓                                                          │
│  STEP 2: 実装                                                │
│  ↓                                                          │
│  STEP 3: テスト実行 (必須)                                    │
│  ↓                                                          │
│  STEP 4: コミット                                            │
│  ↓                                                          │
│  STEP 5: ユーザーへ報告                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### STEP 1: タスク確認

**作業開始前に実行:**
```bash
# オープンなIssueを確認
gh issue list --state open --limit 10

# 優先度の高いものを確認
gh issue list --label "priority: critical" --state open
gh issue list --label "priority: high" --state open
```

**判断基準:**
- Issueがある → Issueの受け入れ基準に従って実装
- Issueがない → ユーザーに確認「Issueを作成しますか？」

---

### STEP 2: 実装

**コーディングルール:**
```
✅ DO:
- 既存のコードパターンを踏襲
- Biomeのルールに従う
- テストを書く
- 型を明示する

❌ DON'T:
- any型を使う
- console.logを残す
- 秘密情報をハードコード
- 既存テストを壊す
```

**ファイル配置:**
```
新機能:     lib/features/{name}/
テスト:     test/unit/features/{name}.test.ts
コンポーネント: components/{name}/
```

---

### STEP 3: テスト実行 (必須)

**実装後に必ず実行:**
```bash
bun run test        # ユニットテスト
bun run typecheck   # 型チェック
bun run lint        # リント
```

**⚠️ 全てパスするまでSTEP 4に進まない**

失敗した場合:
1. エラー内容を確認
2. 修正
3. 再度テスト実行
4. パスするまで繰り返す

---

### STEP 4: コミット

**コミットメッセージ形式:**
```bash
git commit -m "type(scope): 説明

- 変更点1
- 変更点2

Refs #ISSUE番号 (あれば)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

**Type:**
| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `test` | テスト追加 |
| `refactor` | リファクタリング |
| `chore` | その他 |
| `perf` | パフォーマンス |

**プッシュ:**
```bash
git push origin main  # ユーザー確認後
```

---

### STEP 5: ユーザーへ報告

**報告テンプレート:**
```
## 完了報告

**実装内容:**
- [実装した機能/修正]

**変更ファイル:**
- path/to/file1.ts
- path/to/file2.ts

**テスト結果:**
- ユニットテスト: ✅ PASS (XXX tests)
- 型チェック: ✅ PASS
- リント: ✅ PASS

**関連Issue:** #XXX (あれば)

**コミット:** abc1234
```

---

## 📊 便利なコマンド

```bash
# Issue確認
gh issue list --state open --limit 10
gh issue view NUMBER

# 優先度別
gh issue list --label "priority: critical"
gh issue list --label "priority: high"

# ステータス別
gh issue list --label "status: in-progress"
gh issue list --label "status: blocked"

# テスト
bun run test                    # 全テスト
bun run test path/to/test.ts    # 特定テスト
bun run test:coverage           # カバレッジ
```

---

## 🏷️ ラベル体系

| カテゴリ | ラベル |
|---------|--------|
| 優先度 | `priority: critical/high/medium/low` |
| タイプ | `type: feature/tech-debt/test/spike` |
| 見積もり | `story-points: 1/2/3/5/8` |
| ステータス | `status: backlog/ready/in-progress/review/blocked` |
| エリア | `area: frontend/backend/database/devops/ai` |

---

## Core Commands

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run lint             # Run Biome linter
bun run typecheck        # TypeScript type checking

# Testing
bun run test             # Run unit tests (Vitest)
bun run test:coverage    # Run with coverage
bun run test:e2e         # Run E2E tests (Playwright)

# Database
bun run db:push          # Push schema changes
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio

# Docker
docker compose up -d     # Start local services (PostgreSQL, Redis, Mailhog)
docker compose down      # Stop services
```

---

## Project Layout

```
diagnoleads-v2/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes (ja, en)
│   │   ├── (dashboard)/   # Authenticated dashboard pages
│   │   ├── (public)/      # Public pages (landing, diagnostic)
│   │   └── (auth)/        # Auth pages (login, signup)
│   ├── api/               # API routes
│   └── (payload)/         # PayloadCMS admin
├── lib/
│   ├── features/          # Feature modules (leads, ai, webhooks, etc.)
│   ├── db/                # Drizzle ORM schema and client
│   ├── auth/              # Better Auth configuration
│   └── cms/               # CMS abstraction layer
├── components/            # React components
├── test/
│   ├── unit/              # Vitest unit tests
│   └── e2e/               # Playwright E2E tests
├── docs/                  # Documentation
│   ├── FEATURES.md        # Feature list
│   ├── FEATURE_MATRIX.md  # Feature matrix with test coverage
│   └── ROADMAP.md         # Prioritized task roadmap
└── locales/               # i18n translation files (ja, en)
```

---

## Development Patterns & Constraints

### Architecture
- **tRPC v11** for type-safe APIs
- **Drizzle ORM** for database operations
- **Better Auth** for authentication
- **CASL** for authorization
- **PayloadCMS 3.66** for content management

### Code Style
- Use **Biome** for linting and formatting
- Follow existing patterns in the codebase
- All UI text must support i18n (ja/en)
- Use TailAdmin components for dashboard UI

### Testing
- Unit tests: `test/unit/features/{feature}.test.ts`
- E2E tests: `test/e2e/{feature}.spec.ts`
- Mock external services (Anthropic, OpenAI, Resend)
- Target: 70%+ unit test coverage

### Security
- Row-Level Security (RLS) for data isolation
- CSRF protection on all forms
- Rate limiting on public APIs
- Never commit secrets or API keys

---

## Git Workflow Essentials

```bash
# Before committing
git status               # Check changes
git diff                 # Review changes

# Commit format
git commit -m "type(scope): description"

# Types: feat, fix, docs, test, refactor, chore
# Example: feat(leads): add bulk export functionality
```

### Branch Strategy
- `main` - Production-ready code
- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`

---

## Evidence Required for Every PR

1. **Tests pass**: `bun run test` shows all green
2. **Type check**: `bun run typecheck` has no errors
3. **Lint**: `bun run lint` has no errors
4. **Documentation**: Update docs if API changes

---

## Current Sprint Focus

### P0: Pre-Release (Must Complete)
1. E2E test environment setup
2. Diagnostic form submission tests
3. Production environment variables
4. Security audit

### P1: Post-Release Week 1
1. AI feature tests with mocks
2. External integration tests
3. REST API v2 tests
4. Performance optimization

See `docs/ROADMAP.md` for full task breakdown.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_CHECKLIST.md` | Implementation progress tracking |
| `docs/FEATURE_MATRIX.md` | Feature matrix with test coverage |
| `docs/ROADMAP.md` | Prioritized task list |
| `vitest.config.ts` | Unit test configuration |
| `playwright.config.ts` | E2E test configuration |
| `drizzle.config.ts` | Database configuration |

---

## Contact & Resources

- Tech Stack: Next.js 15, React 19, TypeScript 5.9, Tailwind CSS v4
- Database: PostgreSQL 16 with pgvector
- AI: Anthropic Claude 4.5 Sonnet, OpenAI Embeddings
- Deployment: Vercel
