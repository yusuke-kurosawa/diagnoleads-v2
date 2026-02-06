# DiagnoFlow - DiagnoLeads独自アジャイル開発手法

## 概要

**DiagnoFlow**は、DiagnoLeads v2プロジェクトのために設計された独自のアジャイル開発手法です。
スクラムをベースに、AI Agent（Droid）との協働、Issue駆動開発、継続的品質保証を統合した実践的なフレームワークです。

---

## DiagnoFlowの5つの原則

### 1. 🎯 Issue-First (イシューファースト)
> **「コードを書く前に、必ずIssueを確認する」**

すべての作業はGitHub Issueから始まる。Issueなしの作業は存在しない。

### 2. 🔄 Continuous Quality (継続的品質)
> **「テストが通らなければ、コミットしない」**

実装 → テスト → コミットの順序を厳守。品質は後付けではなく、開発プロセスに組み込む。

### 3. 🤖 Human-AI Collaboration (人間とAIの協働)
> **「Droidは実行者、人間は意思決定者」**

Droidが実装を担当し、人間が方向性を決定する。役割分担を明確にする。

### 4. 📊 Visibility (可視化)
> **「進捗は常に見える状態にする」**

ラベル、ステータス、ドキュメントで進捗を可視化。暗黙知を形式知に変換する。

### 5. 🚀 Ship Small, Ship Often (小さく、頻繁にリリース)
> **「大きな変更より、小さな改善を積み重ねる」**

1つのPRは1つの目的。大きな機能は分割してリリースする。

---

## DiagnoFlow サイクル

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│    │  PLAN    │───▶│  BUILD   │───▶│  CHECK   │───▶│  SHIP    │    │
│    │ 計画     │    │ 実装     │    │ 検証     │    │ 出荷     │    │
│    └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│         │                                               │           │
│         └───────────────◀───────────────────────────────┘           │
│                         LEARN (学習)                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### PLAN (計画)
- Issue確認・作成
- 受け入れ基準の定義
- 優先度・見積もりの設定

### BUILD (実装)
- コーディング
- ユニットテスト作成
- ドキュメント更新

### CHECK (検証)
- 全テスト実行
- 型チェック
- リントチェック

### SHIP (出荷)
- コミット
- プッシュ（承認後）
- 報告

### LEARN (学習)
- レトロスペクティブ
- プロセス改善
- ナレッジ蓄積

---

## ロール定義

### Product Owner (PO)
- バックログ優先順位付け
- 受け入れ基準承認
- リリース判断

### Droid (AI Agent)
- Issue確認
- 実装・テスト
- コミット・報告

### Human Developer
- 複雑な設計判断
- Droidのレビュー・承認
- プッシュ承認

---

## Droid開発フロー (5ステップ)

```
STEP 1: CONFIRM (確認)
   │
   ├─ gh issue list --state open
   ├─ 優先度確認
   └─ Issueなし → ユーザーに確認
   │
   ▼
STEP 2: IMPLEMENT (実装)
   │
   ├─ コーディングルール遵守
   ├─ テスト作成
   └─ ファイル配置規則
   │
   ▼
STEP 3: VERIFY (検証)
   │
   ├─ bun run test
   ├─ bun run typecheck
   └─ bun run lint
   │
   ▼
STEP 4: COMMIT (コミット)
   │
   ├─ コミットメッセージ形式
   ├─ Co-authored-by
   └─ Refs #ISSUE_NUMBER
   │
   ▼
STEP 5: REPORT (報告)
   │
   ├─ 実装内容
   ├─ 変更ファイル
   ├─ テスト結果
   └─ コミットハッシュ
```

---

## ラベル体系

### 優先度 (Priority)
| ラベル | 説明 | SLA |
|--------|------|-----|
| `priority: critical` | 本番障害、セキュリティ | 24時間 |
| `priority: high` | 重要機能、ブロッカー | 3日 |
| `priority: medium` | 通常機能 | 1週間 |
| `priority: low` | 改善、nice-to-have | 将来 |

### タイプ (Type)
| ラベル | 説明 |
|--------|------|
| `type: feature` | 新機能 |
| `type: tech-debt` | 技術的負債 |
| `type: test` | テスト追加 |
| `type: spike` | 調査・研究 |

### 見積もり (Story Points)
| ラベル | 目安時間 |
|--------|---------|
| `story-points: 1` | ~2時間 |
| `story-points: 2` | ~4時間 |
| `story-points: 3` | ~1日 |
| `story-points: 5` | ~2-3日 |
| `story-points: 8` | ~1週間 |

### ステータス (Status)
| ラベル | 説明 |
|--------|------|
| `status: backlog` | バックログ内 |
| `status: ready` | 実装準備完了 |
| `status: in-progress` | 実装中 |
| `status: review` | レビュー中 |
| `status: blocked` | ブロック中 |

### エリア (Area)
| ラベル | 説明 |
|--------|------|
| `area: frontend` | UI/UX |
| `area: backend` | API/ビジネスロジック |
| `area: database` | DB/スキーマ |
| `area: devops` | CI/CD/インフラ |
| `area: ai` | AI/ML |

---

## コミットメッセージ規約

```
type(scope): 説明

- 変更点1
- 変更点2

Refs #ISSUE_NUMBER

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

### Type一覧
| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `test` | テスト |
| `refactor` | リファクタリング |
| `perf` | パフォーマンス |
| `chore` | その他 |

---

## 品質ゲート

### コミット前チェック (必須)
```bash
bun run test        # 全テストパス
bun run typecheck   # 型エラーなし
bun run lint        # リントエラーなし
```

### プッシュ前チェック (推奨)
- 変更ファイルのレビュー
- セキュリティ確認（秘密情報なし）
- ドキュメント更新確認

---

## メトリクス

### 追跡指標

| 指標 | 目標 | 現状 |
|------|------|------|
| テストカバレッジ | 70% | 25% |
| ユニットテスト数 | 1,500+ | 1,012 |
| E2Eテスト数 | 50+ | 5 |
| バグ率 | <10% | - |
| リードタイム | <5日 | - |

---

## セレモニー

### デイリー (任意)
- 時間: 10分
- 内容: 進捗確認、ブロッカー共有

### ウィークリー
- 時間: 1時間
- 内容: バックログリファインメント、優先度調整

### スプリント (2週間)
- プランニング: 2時間
- レビュー: 1時間
- レトロスペクティブ: 1時間

---

## ドキュメント構成

```
docs/
├── DIAGNOFLOW.md          # この文書（アジャイル手法定義）
├── WORKFLOW.md            # 詳細ワークフロー
├── AGILE_PROCESS.md       # スクラムプロセス詳細
├── PRODUCT_BACKLOG.md     # バックログ管理
├── DEVELOPMENT_STATUS.md  # 開発状況
└── ROADMAP.md             # ロードマップ

CLAUDE.md                  # Droid開発ルール
AGENTS.md                  # Droid詳細指示
CONTRIBUTING.md            # 開発者ガイド
```

---

## 関連ドキュメント

- [WORKFLOW.md](./WORKFLOW.md) - 詳細ワークフロー
- [AGILE_PROCESS.md](./AGILE_PROCESS.md) - スクラムプロセス
- [PRODUCT_BACKLOG.md](./PRODUCT_BACKLOG.md) - バックログ
- [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) - 開発状況

---

*DiagnoFlow v1.0 - 2026-02-06*
