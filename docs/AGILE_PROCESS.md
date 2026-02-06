# DiagnoLeads v2 アジャイル開発プロセス

## 概要

DiagnoLeads v2はスクラムベースのアジャイル開発を採用しています。
このドキュメントでは、チームが従うべきプロセス、セレモニー、アーティファクトについて説明します。

---

## スプリント設定

| 項目 | 設定 |
|------|------|
| スプリント期間 | 2週間 |
| スプリント開始 | 月曜日 |
| スプリント終了 | 金曜日 (2週目) |
| ベロシティ目標 | 40-50 ストーリーポイント |

---

## ロールと責任

### Product Owner (PO)
- プロダクトバックログの優先順位付け
- ユーザーストーリーの受け入れ基準定義
- ステークホルダーとの調整

### Scrum Master (SM)
- スプリントセレモニーのファシリテート
- 障害の除去
- プロセス改善の推進

### Development Team
- ストーリーの見積もりと実装
- コードレビュー
- テストの作成と実行

---

## セレモニー

### 1. スプリントプランニング (Sprint Planning)

**タイミング**: スプリント初日 (月曜日)  
**時間**: 2-4時間  
**参加者**: PO, SM, Dev Team

**アジェンダ**:
1. スプリントゴールの設定
2. プロダクトバックログからのアイテム選択
3. タスク分解と見積もり
4. スプリントバックログの確定

**アウトプット**:
- スプリントゴール
- スプリントバックログ (GitHub Milestone)

### 2. デイリースクラム (Daily Standup)

**タイミング**: 毎日 10:00  
**時間**: 15分以内  
**参加者**: Dev Team (PO, SM任意)

**3つの質問**:
1. 昨日やったこと
2. 今日やること
3. 障害や困っていること

### 3. スプリントレビュー (Sprint Review)

**タイミング**: スプリント最終日  
**時間**: 1-2時間  
**参加者**: PO, SM, Dev Team, ステークホルダー

**アジェンダ**:
1. 完了したストーリーのデモ
2. フィードバック収集
3. バックログの更新

### 4. スプリントレトロスペクティブ (Retrospective)

**タイミング**: スプリントレビュー後  
**時間**: 1-1.5時間  
**参加者**: SM, Dev Team

**フォーマット**:
- 🌟 良かったこと (Keep)
- 😞 改善点 (Problem)
- 💡 試してみたいこと (Try)

---

## アーティファクト

### 1. プロダクトバックログ (Product Backlog)

**管理場所**: GitHub Issues with `status: backlog` label

**バックログアイテムの種類**:
- 📖 User Story - ユーザー向け機能
- 🐛 Bug - バグ修正
- ✅ Task - 技術タスク
- 🔬 Spike - 調査・研究

**優先度ラベル**:
| ラベル | 説明 |
|--------|------|
| `priority: critical` | P0: 即時対応必須 |
| `priority: high` | P1: 次スプリントで対応 |
| `priority: medium` | P2: 計画的に対応 |
| `priority: low` | P3: 余裕があれば |

### 2. スプリントバックログ (Sprint Backlog)

**管理場所**: GitHub Milestone

**ステータスラベル**:
| ラベル | 説明 |
|--------|------|
| `status: backlog` | バックログ内 |
| `status: ready` | スプリント準備完了 |
| `status: in-progress` | 作業中 |
| `status: review` | レビュー中 |
| `status: blocked` | ブロック中 |

### 3. ストーリーポイント

**フィボナッチスケール**:
| ポイント | 目安時間 | 説明 |
|---------|---------|------|
| 1 | ~2時間 | 非常に小さい |
| 2 | ~4時間 | 小さい |
| 3 | ~1日 | 中程度 |
| 5 | ~2-3日 | やや大きい |
| 8 | ~1週間 | 大きい |
| 13 | - | 分割が必要 |

---

## GitHub ワークフロー

### Issue作成フロー

```
1. テンプレートを選択
   - User Story / Bug / Task / Spike

2. 必須フィールドを記入
   - 説明、受け入れ基準

3. ラベル付け
   - priority: xxx
   - type: xxx
   - area: xxx
   - story-points: xxx

4. バックログに追加
   - status: backlog ラベル
```

### スプリント開始フロー

```
1. Milestoneを作成
   - 名前: Sprint XX (YYYY-MM-DD ~ YYYY-MM-DD)

2. バックログからIssue選択
   - status: backlog → status: ready
   - Milestoneに追加

3. タスク分解
   - 必要に応じてサブタスク作成
```

### 開発フロー

```
1. Issueを選択
   - status: ready → status: in-progress
   - Assignee設定

2. ブランチ作成
   - feat/issue-number-description
   - fix/issue-number-description

3. 開発・テスト
   - コミット規約に従う
   - テスト作成

4. PR作成
   - テンプレートに従う
   - Closes #xxx で紐付け

5. コードレビュー
   - status: in-progress → status: review

6. マージ
   - Issueが自動クローズ
```

---

## メトリクス

### 追跡するメトリクス

| メトリクス | 目標 | 測定方法 |
|-----------|------|----------|
| ベロシティ | 40-50 SP/sprint | 完了SP合計 |
| スプリント完了率 | 90%+ | 完了Issue/計画Issue |
| リードタイム | < 5日 | Issue作成〜クローズ |
| バグ率 | < 10% | バグIssue/全Issue |
| テストカバレッジ | 70%+ | Vitest coverage |

### バーンダウンチャート

スプリント中の進捗を可視化:

```
SP残
 │
40├─────●
 │       ╲
30├────────●
 │          ╲
20├───────────●
 │             ╲ 理想線
10├──────────────●
 │                ╲
 0├───────────────────●
  └──────────────────────→ 日
   1  2  3  4  5  6  7  8  9 10
```

---

## Definition of Ready (DoR)

Issueがスプリントに入る前の条件:

- [ ] ユーザーストーリーまたは説明が明確
- [ ] 受け入れ基準が定義されている
- [ ] ストーリーポイントが見積もられている
- [ ] 依存関係が特定されている
- [ ] 必要なデザインやモックアップがある

---

## Definition of Done (DoD)

Issueが完了とみなされる条件:

- [ ] コードが実装されている
- [ ] ユニットテストが書かれている
- [ ] コードレビューが完了
- [ ] テストがすべてパス
- [ ] ドキュメントが更新されている
- [ ] 受け入れ基準をすべて満たす
- [ ] mainブランチにマージ済み

---

## ベストプラクティス

### 1. ユーザーストーリーの書き方

```
As a [type of user],
I want [goal/desire],
so that [benefit/value].
```

**良い例**:
> As a **sales manager**,
> I want **to export leads as CSV**,
> so that **I can analyze them in Excel**.

### 2. 受け入れ基準の書き方

Given-When-Then形式:

```
Given [initial context],
When [action/event],
Then [expected outcome].
```

**例**:
> Given I am on the leads page
> When I click the "Export" button
> Then a CSV file is downloaded with all visible leads

### 3. コミットメッセージ

```
type(scope): description

[optional body]

[optional footer]
Closes #123
```

---

## ツール

| 用途 | ツール |
|------|--------|
| Issue管理 | GitHub Issues |
| スプリント管理 | GitHub Milestones |
| コードレビュー | GitHub Pull Requests |
| CI/CD | GitHub Actions |
| ドキュメント | docs/ ディレクトリ |
| コミュニケーション | GitHub Discussions |

---

## 関連ドキュメント

- [CONTRIBUTING.md](../CONTRIBUTING.md) - 開発者ガイド
- [ROADMAP.md](./ROADMAP.md) - プロダクトロードマップ
- [SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md) - スプリント実績

---

*最終更新: 2026-02-05*
