# DiagnoLeads v2 OpenSpec

> **仕様駆動開発 (Specification-Driven Development)** のための仕様管理ディレクトリ

---

## 概要

OpenSpecは、DiagnoLeads v2の**Source of Truth**（唯一の真実の情報源）として機能します。
すべての機能実装はこの仕様に基づいて行われ、AI支援開発の精度を最大化します。

---

## ディレクトリ構造

```
openspec/
├── README.md              # このファイル
├── specs/                 # 確定済み仕様（Source of Truth）
│   ├── architecture.md    # 全体アーキテクチャ
│   ├── phase2-plan.md     # Phase 2実装計画
│   ├── api/               # API仕様詳細
│   │   ├── leads.md       # リード管理API
│   │   ├── organizations.md # 組織・メンバー管理API
│   │   ├── analytics.md   # 統計・分析API
│   │   └── ai.md          # AI機能API
│   └── features/          # 機能仕様詳細
│       ├── multi-tenant.md # マルチテナント機能
│       └── ai-scoring.md  # AI機能詳細
├── changes/               # 変更提案（実装前）
│   └── {feature}/
│       ├── spec-delta.md  # 何が変わるか
│       └── tasks.md       # 何をするか
└── archive/               # 完了した変更
    └── phase2-core/       # Phase 2実装完了
```

---

## 仕様書一覧

### アーキテクチャ

| ドキュメント | 説明 | ステータス |
|-------------|------|-----------|
| [architecture.md](specs/architecture.md) | 全体アーキテクチャ仕様 | ✅ 最新 |
| [phase2-plan.md](specs/phase2-plan.md) | Phase 2実装計画 | ✅ 完了 |

### API仕様

| API | 説明 | ステータス |
|-----|------|-----------|
| [leads.md](specs/api/leads.md) | リード管理CRUD | ✅ Phase 2完了 |
| [organizations.md](specs/api/organizations.md) | 組織・メンバー管理 | ✅ Phase 2完了 |
| [analytics.md](specs/api/analytics.md) | 統計・分析 | ✅ Phase 2完了 |
| [ai.md](specs/api/ai.md) | AI機能 | ✅ Phase 3完了 |

### 機能仕様

| 機能 | 説明 | ステータス |
|------|------|-----------|
| [multi-tenant.md](specs/features/multi-tenant.md) | マルチテナント | ✅ Phase 1-2完了 |
| [ai-scoring.md](specs/features/ai-scoring.md) | AI機能 | ✅ Phase 3完了(90%) |

---

## 開発ワークフロー

### 1. Draft（変更提案）

新機能や変更を実装する前に、`changes/`に提案を作成：

```bash
openspec/changes/{feature-name}/
├── spec-delta.md   # 何が変わるか
└── tasks.md        # 実装タスク
```

### 2. Review（レビュー）

- 仕様の妥当性確認
- 影響範囲の評価
- 工数見積もり

### 3. Implement（実装）

AI支援で仕様に基づいた実装を実行。

### 4. Complete（完了）

実装完了後：
1. `changes/{feature}` を `archive/` に移動
2. `specs/` の関連ドキュメントを更新
3. `IMPLEMENTATION_CHECKLIST.md` を更新

---

## 仕様書の書き方

### 必須セクション

```markdown
# {機能名}仕様書

> **Source of Truth**: {説明}
>
> **最終更新**: YYYY-MM-DD
> **ステータス**: Phase X 実装完了

---

## 概要
## 実装詳細
## 関連ドキュメント
```

### ベストプラクティス

1. **具体的な型定義を含める** - TypeScript/Zodスキーマ
2. **コード例を提供** - 使用方法を明確に
3. **エラーケースを記載** - エラーコードと対処法
4. **パフォーマンス目標を設定** - 測定可能な指標
5. **相互参照を維持** - 関連ドキュメントへのリンク

---

## 更新履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-11-28 | OpenSpec構造拡張（api/, features/追加）、Phase 3仕様追加 |
| 2025-11-24 | Phase 2仕様作成 |
| 2025-11-20 | 初版作成 |

---

## 関連リンク

- [実装チェックリスト](/IMPLEMENTATION_CHECKLIST.md)
- [プロジェクトコンテキスト](/.claude/project-context.md)
- [マルチテナント戦略](/docs/MULTI_TENANT_STRATEGY.md)
- [OpenSpec GitHub](https://github.com/Fission-AI/OpenSpec)
