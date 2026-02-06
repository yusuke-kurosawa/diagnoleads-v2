# DiagnoLeads v2 開発ルール

## ⚠️ 最重要: アジャイル開発ルール

### 1. Issue-First Development (必須)

**全ての作業はGitHub Issueから始めること**

```
作業開始前チェックリスト:
□ 対応するIssueが存在するか確認
□ Issueがない場合は作成してから作業開始
□ Issueに適切なラベルが付いているか確認
□ ステータスを status: in-progress に更新
```

### 2. Issue作成時の必須ラベル

| カテゴリ | ラベル | 必須 |
|---------|--------|------|
| 優先度 | `priority: critical/high/medium/low` | ✅ |
| タイプ | `type: feature/tech-debt/test/spike` | ✅ |
| 見積もり | `story-points: 1/2/3/5/8` | ✅ |
| エリア | `area: frontend/backend/database/devops/ai` | 推奨 |
| ステータス | `status: backlog/ready/in-progress/review/blocked` | ✅ |

### 3. ブランチ・コミットルール

```bash
# ブランチ名: 必ずIssue番号を含める
feat/123-feature-name
fix/456-bug-description

# コミット: 必ずCloses/Fixesを含める
git commit -m "feat(scope): description

Closes #123"
```

### 4. PR作成時の必須事項

- [ ] `.github/PULL_REQUEST_TEMPLATE.md` に従う
- [ ] `Closes #xxx` でIssue紐付け
- [ ] テスト通過: `bun run test && bun run typecheck && bun run lint`
- [ ] チェックリスト全項目確認

### 5. 参照ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `docs/AGILE_PROCESS.md` | スクラムプロセス、セレモニー |
| `docs/PRODUCT_BACKLOG.md` | バックログ管理、Epic一覧 |
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