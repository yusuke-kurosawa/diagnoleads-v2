# DiagnoLeads v2 開発ルール

## 🚀 SprintPath - アジャイル開発フレームワーク

> **SprintPath**は汎用的なアジャイル開発フレームワークです。
> 詳細: [docs/SPRINTPATH.md](./docs/SPRINTPATH.md)

### SprintPathの5原則

1. **🎯 Issue-First** - コードを書く前に、必ずIssueを確認
2. **🔄 Continuous Quality** - テストが通らなければ、コミットしない
3. **👤 Clear Ownership** - 役割分担を明確にし、責任者を決める
4. **📊 Visibility** - 進捗は常に見える状態にする
5. **🚀 Ship Small** - 大きな変更より、小さな改善を積み重ねる

---

## ⚠️ Droid開発フロー (SprintPath準拠)

### フロー概要

```
CONFIRM → IMPLEMENT → VERIFY → COMMIT → REPORT
```

---

### STEP 1: タスク確認 (作業開始前)

**必ず実行:**
```bash
# 現在のIssue状況を確認
gh issue list --state open --limit 10

# 優先度の高いタスクを確認
gh issue list --label "priority: critical" --state open
gh issue list --label "priority: high" --state open
```

**確認事項:**
- [ ] 対応するIssueが存在するか
- [ ] Issueの受け入れ基準を理解したか
- [ ] 依存関係・ブロッカーがないか

**Issueがない場合:** ユーザーに確認してから作業開始

---

### STEP 2: 実装

**コーディング規約:**
- Biomeのルールに従う
- 既存のコードパターンを踏襲
- `any`型を使わない
- UI文字列は`locales/`に定義

**ファイル配置:**
```
lib/features/{feature}/     # 機能モジュール
test/unit/features/         # ユニットテスト
components/                 # UIコンポーネント
```

---

### STEP 3: テスト (必須)

**実装後に必ず実行:**
```bash
bun run test        # ユニットテスト
bun run typecheck   # 型チェック
bun run lint        # リント
```

**全てパスするまでコミットしない**

---

### STEP 4: コミット

**コミットメッセージ形式:**
```bash
git commit -m "type(scope): description

- 変更点1
- 変更点2

Refs #ISSUE_NUMBER (あれば)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"
```

**Type一覧:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`

---

### STEP 5: 報告

**作業完了時にユーザーに報告:**
- 実装した内容
- 追加/変更したファイル
- テスト結果
- 関連Issue番号 (あれば)

---

### ラベル体系 (参照用)

| カテゴリ | ラベル |
|---------|--------|
| 優先度 | `priority: critical/high/medium/low` |
| タイプ | `type: feature/tech-debt/test/spike` |
| 見積もり | `story-points: 1/2/3/5/8` |
| ステータス | `status: backlog/ready/in-progress/review/blocked` |
| エリア | `area: frontend/backend/database/devops/ai` |

---

### 参照ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `docs/SPRINTPATH.md` | SprintPathフレームワーク |
| `docs/WORKFLOW.md` | 詳細ワークフロー |
| `docs/AGILE_PROCESS.md` | スクラムプロセス |
| `CONTRIBUTING.md` | 開発者ガイド |

---

## UI/コンポーネントルール

- TailAdminを導入してください
| 特徴項目          | TailAdmin（無料版）                         | Flowbite Admin                              |
|------------------|-------------------------------------------|---------------------------------------------|
| 利用形態         | 完全無料（オープンソース・MITライセンス）| 無料＋有料プランあり                         |
| コンポーネント数 | 500以上                                   | 約180以上（無料版＋有料拡張あり）             |
| ダッシュボード数 | 7種類（アナリティクス/マーケ/CRMなど）    | 10種類以上                                   |
| フレームワーク対応| Next.js, React, Vue, Angular, Laravel    | React(App)、Vue、Angular、Svelte対応          |
| Tailwind CSS バージョンサポート | v4対応（Oxideエンジン、@theme導入済み） | v4対応（自動バージョン検出、v4+向け最適化）    |
| UIスタイル       | モダン、ビジネス向け                       | モダンで多用途。アクセシビリティ等配慮あり     |
| カスタマイズ性   | 高い（CSS変数、@themeで簡単に変更可）     | 標準的。テーマ切り替えや拡張サポートあり       |
| ダークモード     | 自動切り替え対応                           | 自動切り替え対応                             |
| ドキュメンテーション | わかりやすいセットアップ、サンプル多め    | ��実したAPI・設定ドキュメント               |
| 商用利用         | 無料利用可能                             | 無料利用可能（有料プランあり）               |
| 大規模プロジェクト適性 | 大規模・モノレポでもパフォーマンス良好      | 中～大規模向け、各種デバイス対応良好           |

### コメント

- **TailAdmin**は無料かつ多彩なダッシュボードが揃い、Next.jsなど幅広いフレームワーク対応が魅力で、Tailwind v4の高速化恩恵を活かせる。ビジネス用途の診断プラットフォーム開発に最適。
- **Flowbite Admin**は無料でも高品質なコンポーネント群を提供し、公式ドキュメントが充実。React中心でアクセシビリティ重視設計。商用拡張も視野に入る場合に良い。

どちらもTailwind CSS v4対応の優良ライブラリですが、特にNext.jsベースかつバリエーション豊富な管理画面をすぐ構築したいならTailAdmin、ドキュメント・拡張性重視ならFlowbiteが適しています。