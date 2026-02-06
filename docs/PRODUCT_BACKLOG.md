# DiagnoLeads v2 プロダクトバックログ

## 概要

このドキュメントは、DiagnoLeads v2のプロダクトバックログを優先度順に整理したものです。
各アイテムはGitHub Issueとして管理され、スプリントプランニングで選択されます。

> **Note**: GitHub Issuesが正式なバックログです。このドキュメントは概要参照用です。

---

## バックログ管理ルール

### 優先度定義

| レベル | ラベル | 説明 | SLA |
|--------|--------|------|-----|
| P0 | `priority: critical` | ビジネスクリティカル、即時対応 | 24時間以内 |
| P1 | `priority: high` | 次スプリント必須 | 1スプリント |
| P2 | `priority: medium` | 計画的に対応 | 2-3スプリント |
| P3 | `priority: low` | 余裕があれば | 将来検討 |

### WSJF (Weighted Shortest Job First)

優先度決定の計算式:
```
WSJF = (Business Value + Time Criticality + Risk Reduction) / Job Size
```

---

## Epic一覧

### 🏢 Epic 1: コア機能強化

**目標**: リード管理の基本機能を完璧にする

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E1-1 | リード一括インポート改善 | P2 | 5 | Backlog |
| E1-2 | 高度なフィルタリング | P2 | 8 | Backlog |
| E1-3 | カスタムフィールド拡張 | P2 | 5 | Backlog |
| E1-4 | リードマージ機能 | P3 | 5 | Backlog |

### 🤖 Epic 2: AI機能拡張

**目標**: AI活用を最大化し、営業効率を向上

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E2-1 | AI自動タグ付け | P2 | 5 | Backlog |
| E2-2 | 次アクション提案 | P2 | 8 | Backlog |
| E2-3 | 類似リード検索 | P3 | 5 | Backlog |
| E2-4 | AIレポート生成 | P3 | 8 | Backlog |

### 📊 Epic 3: 分析・レポート

**目標**: データドリブンな意思決定を支援

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E3-1 | ダッシュボードカスタマイズ | P2 | 8 | Backlog |
| E3-2 | 予測分析機能 | P3 | 13 | Backlog |
| E3-3 | コホート分析 | P3 | 8 | Backlog |

### 🔗 Epic 4: 外部連携

**目標**: 既存ツールとのシームレスな連携

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E4-1 | Salesforce連携 | P2 | 13 | Backlog |
| E4-2 | HubSpot連携 | P2 | 13 | Backlog |
| E4-3 | Google Sheets連携 | P3 | 5 | Backlog |

### 🛡️ Epic 5: セキュリティ・コンプライアンス

**目標**: エンタープライズ要件を満たす

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E5-1 | SSO (SAML/OIDC) | P1 | 8 | Backlog |
| E5-2 | 監査ログUI | P2 | 5 | Backlog |
| E5-3 | データエクスポート (GDPR) | P2 | 5 | Backlog |

### 📱 Epic 6: UX改善

**目標**: 使いやすさの継続的改善

| ID | ストーリー | 優先度 | SP | 状態 |
|----|-----------|--------|-----|------|
| E6-1 | モバイル最適化 | P2 | 8 | Backlog |
| E6-2 | キーボードショートカット | P3 | 3 | Backlog |
| E6-3 | ダークモード | P3 | 3 | Backlog |

---

## 技術的バックログ

### インフラ・DevOps

| ID | タスク | 優先度 | SP | 状態 |
|----|--------|--------|-----|------|
| T1 | E2Eテスト環境構築 | P1 | 5 | Backlog |
| T2 | パフォーマンスモニタリング | P2 | 3 | Backlog |
| T3 | ステージング環境整備 | P2 | 5 | Backlog |

### コード品質

| ID | タスク | 優先度 | SP | 状態 |
|----|--------|--------|-----|------|
| T4 | テストカバレッジ70%達成 | P2 | 13 | Backlog |
| T5 | TypeScript strict化 | P3 | 5 | Backlog |
| T6 | コンポーネントリファクタリング | P3 | 8 | Backlog |

---

## バックログリファインメント

### 週次リファインメント

**タイミング**: 毎週木曜日 15:00  
**時間**: 1時間  
**参加者**: PO, SM, Dev Team (任意)

**アジェンダ**:
1. 新規アイテムの追加
2. 既存アイテムの詳細化
3. 優先度の見直し
4. 見積もりの更新

### リファインメントチェックリスト

- [ ] ユーザーストーリーが明確か
- [ ] 受け入れ基準が定義されているか
- [ ] 見積もりが適切か (13以上は分割)
- [ ] 依存関係が特定されているか
- [ ] 技術的な懸念点はないか

---

## バックログの健全性指標

### 理想的な状態

| 指標 | 目標 |
|------|------|
| Ready状態のストーリー | 2スプリント分 |
| P0/P1の割合 | 30%以下 |
| 平均ストーリーサイズ | 3-5 SP |
| バグの割合 | 10%以下 |

### 警告サイン

⚠️ 注意が必要な状態:

- Ready状態のストーリーが1スプリント分未満
- P0/P1が50%以上
- 13ポイント以上のストーリーが多い
- 6ヶ月以上動いていないアイテムがある

---

## GitHub Issues クエリ

### バックログ全体
```
is:issue is:open label:"status: backlog" sort:created-desc
```

### 次スプリント候補
```
is:issue is:open label:"status: ready" sort:priority
```

### P0/P1のみ
```
is:issue is:open label:"priority: critical","priority: high"
```

### 見積もり未完了
```
is:issue is:open -label:"story-points: 1" -label:"story-points: 2" -label:"story-points: 3" -label:"story-points: 5" -label:"story-points: 8"
```

### 今スプリント
```
is:issue is:open milestone:"Sprint XX"
```

---

## 関連ドキュメント

- [AGILE_PROCESS.md](./AGILE_PROCESS.md) - アジャイルプロセス
- [ROADMAP.md](./ROADMAP.md) - 長期ロードマップ
- [SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md) - スプリント実績

---

*最終更新: 2026-02-05*
