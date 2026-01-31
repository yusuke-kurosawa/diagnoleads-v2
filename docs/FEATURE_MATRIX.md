# DiagnoLeads v2 機能マトリクス

## 概要

本ドキュメントは、DiagnoLeads v2の全機能を「画面」「API」「バッチ」「外部IF」などのカテゴリでマトリクス形式で管理します。

---

## 凡例

| 区分 | 説明 |
|------|------|
| 画面 | ユーザーが操作するUI画面 |
| API | tRPC/REST APIエンドポイント |
| バッチ | 定期実行・バックグラウンド処理 |
| 外部IF | 外部サービスとの連携インターフェース |
| DB | データベーステーブル・スキーマ |
| ライブラリ | 共通ライブラリ・ユーティリティ |

### ステータス

| 記号 | 意味 |
|------|------|
| ✅ | 実装済み |
| 🚧 | 実装中 |
| 📋 | 計画中 |
| - | 該当なし |

---

# 1. 認証・ユーザー管理

## 1.1 認証機能

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 1.1.1 | ログイン | ✅ `/login` | ✅ Better Auth | - | - | ✅ sessions | メール/パスワード認証 |
| 1.1.2 | ログアウト | ✅ ヘッダー | ✅ Better Auth | - | - | ✅ sessions | セッション削除 |
| 1.1.3 | サインアップ | ✅ `/signup` | ✅ Better Auth | - | - | ✅ users | 新規ユーザー登録 |
| 1.1.4 | パスワードリセット | ✅ `/reset-password` | ✅ Better Auth | - | ✅ Resend | ✅ verification | メール送信 |
| 1.1.5 | メール確認 | 📋 | 📋 Better Auth | - | 📋 Resend | ✅ verification | オプション機能 |
| 1.1.6 | セッション管理 | - | ✅ Better Auth | ✅ 期限切れ削除 | - | ✅ sessions | 7日間有効 |

## 1.2 ユーザー管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 1.2.1 | プロフィール表示 | ✅ `/settings` | ✅ users.get | - | - | ✅ users | |
| 1.2.2 | プロフィール編集 | ✅ `/settings` | ✅ users.update | - | - | ✅ users | 名前、アバター |
| 1.2.3 | パスワード変更 | ✅ `/settings` | ✅ Better Auth | - | - | ✅ users | |

## 1.3 組織管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 1.3.1 | 組織一覧 | ✅ 組織切替UI | ✅ organizations.list | - | - | ✅ organizations | |
| 1.3.2 | 組織作成 | ✅ モーダル | ✅ organizations.create | - | - | ✅ organizations | |
| 1.3.3 | 組織編集 | ✅ `/settings/organization` | ✅ organizations.update | - | - | ✅ organizations | |
| 1.3.4 | 組織削除 | ✅ `/settings/organization` | ✅ organizations.delete | - | - | ✅ organizations | 確認ダイアログ |
| 1.3.5 | 組織切り替え | ✅ ヘッダー | ✅ context切替 | - | - | - | |

## 1.4 メンバー管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 1.4.1 | メンバー一覧 | ✅ `/settings/members` | ✅ members.list | - | - | ✅ members | |
| 1.4.2 | メンバー招待 | ✅ `/settings/members` | ✅ members.invite | - | ✅ Resend | ✅ invitations | メール送信 |
| 1.4.3 | ロール変更 | ✅ `/settings/members` | ✅ members.updateRole | - | - | ✅ members | owner/admin/member/viewer |
| 1.4.4 | メンバー削除 | ✅ `/settings/members` | ✅ members.remove | - | - | ✅ members | |

## 1.5 ホールディングス・階層管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 1.5.1 | 階層構造表示 | ✅ `/settings/organization` | ✅ hierarchy.getHierarchy | - | - | ✅ organizations | ltree |
| 1.5.2 | 子組織一覧 | ✅ 階層ツリー | ✅ hierarchy.getChildren | - | - | ✅ organizations | |
| 1.5.3 | 親組織設定 | ✅ 設定画面 | ✅ hierarchy.setParent | - | - | ✅ organizations | |
| 1.5.4 | データ共有ポリシー | ✅ 設定画面 | ✅ hierarchy.updatePolicy | - | - | ✅ organizations | |
| 1.5.5 | グループ統計 | ✅ ダッシュボード | ✅ hierarchy.getGroupStats | - | - | ✅ organizations | |

---

# 2. リード管理

## 2.1 リード基本操作

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 2.1.1 | リード一覧 | ✅ `/leads` | ✅ leads.list | - | - | ✅ leads | ページネーション、フィルター |
| 2.1.2 | リード詳細 | ✅ `/leads/[id]` | ✅ leads.get | - | - | ✅ leads | |
| 2.1.3 | リード作成 | ✅ `/leads` モーダル | ✅ leads.create | - | - | ✅ leads | |
| 2.1.4 | リード編集 | ✅ `/leads/[id]` | ✅ leads.update | - | - | ✅ leads | |
| 2.1.5 | リード削除 | ✅ `/leads` | ✅ leads.delete | - | - | ✅ leads | |

## 2.2 リード一括操作

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 2.2.1 | 一括ステータス変更 | ✅ `/leads` | ✅ leads.bulkUpdateStatus | - | - | ✅ leads | |
| 2.2.2 | 一括削除 | ✅ `/leads` | ✅ leads.bulkDelete | - | - | ✅ leads | |
| 2.2.3 | CSVインポート | ✅ `/leads` モーダル | ✅ leads.import | - | - | ✅ leads | xlsx対応 |
| 2.2.4 | CSVエクスポート | ✅ `/leads` | ✅ ライブラリ | - | - | - | |
| 2.2.5 | JSONエクスポート | ✅ `/leads` | ✅ ライブラリ | - | - | - | |
| 2.2.6 | PDFエクスポート | ✅ `/leads` | ✅ ライブラリ | - | - | - | jspdf |

## 2.3 タグ管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 2.3.1 | タグ一覧 | ✅ タグセレクター | ✅ tags.list | - | - | ✅ tags | |
| 2.3.2 | タグ作成 | ✅ タグセレクター | ✅ tags.create | - | - | ✅ tags | カラー設定 |
| 2.3.3 | タグ編集 | ✅ タグ管理画面 | ✅ tags.update | - | - | ✅ tags | |
| 2.3.4 | タグ削除 | ✅ タグ管理画面 | ✅ tags.delete | - | - | ✅ tags | |
| 2.3.5 | リードへのタグ付け | ✅ リード詳細 | ✅ tags.addToLead | - | - | ✅ leadTags | |
| 2.3.6 | タグでフィルター | ✅ `/leads` | ✅ leads.list | - | - | ✅ leadTags | |

## 2.4 コメント・メモ

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 2.4.1 | コメント一覧 | ✅ リード詳細 | ✅ comments.list | - | - | ✅ leadComments | |
| 2.4.2 | コメント追加 | ✅ リード詳細 | ✅ comments.create | - | - | ✅ leadComments | |
| 2.4.3 | コメント編集 | ✅ リード詳細 | ✅ comments.update | - | - | ✅ leadComments | |
| 2.4.4 | コメント削除 | ✅ リード詳細 | ✅ comments.delete | - | - | ✅ leadComments | |
| 2.4.5 | スレッド返信 | ✅ リード詳細 | ✅ comments.reply | - | - | ✅ leadComments | |

## 2.5 カスタムフィールド

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 2.5.1 | フィールド一覧 | ✅ `/settings` | ✅ customFields.list | - | - | ✅ customFields | |
| 2.5.2 | フィールド作成 | ✅ `/settings` | ✅ customFields.create | - | - | ✅ customFields | 10種類のタイプ |
| 2.5.3 | フィールド編集 | ✅ `/settings` | ✅ customFields.update | - | - | ✅ customFields | |
| 2.5.4 | フィールド削除 | ✅ `/settings` | ✅ customFields.delete | - | - | ✅ customFields | |
| 2.5.5 | 並び替え | ✅ `/settings` | ✅ customFields.reorder | - | - | ✅ customFields | D&D |
| 2.5.6 | 有効/無効切替 | ✅ `/settings` | ✅ customFields.toggleActive | - | - | ✅ customFields | |

---

# 3. AI機能

## 3.1 AIスコアリング

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 3.1.1 | スコア計算 | ✅ リード詳細 | ✅ ai.scoreLead | - | ✅ Anthropic | ✅ leads.score | Claude 4.5 |
| 3.1.2 | バッチスコアリング | ✅ `/leads` | ✅ ai.batchScoreLeads | ✅ | ✅ Anthropic | ✅ leads | |
| 3.1.3 | スコア表示 | ✅ AIScoreCard | ✅ leads.get | - | - | ✅ leads | 信頼度・優先度 |
| 3.1.4 | 推奨アクション | ✅ AIScoreCard | ✅ ai.scoreLead | - | ✅ Anthropic | - | |

## 3.2 セマンティック検索

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 3.2.1 | 自然言語検索 | ✅ 検索UI | ✅ ai.semanticSearch | - | ✅ OpenAI | ✅ leads.embedding | pgvector |
| 3.2.2 | 類似リード検索 | ✅ リード詳細 | ✅ ai.findSimilar | - | ✅ OpenAI | ✅ leads.embedding | |
| 3.2.3 | 埋め込み更新 | - | ✅ ai.updateEmbedding | ✅ | ✅ OpenAI | ✅ leads.embedding | |

## 3.3 AI要約・アシスタント

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 3.3.1 | リード要約生成 | ✅ AISummaryCard | ✅ ai.generateSummary | - | ✅ Anthropic | - | |
| 3.3.2 | AIチャット | ✅ ChatAssistant | ✅ /api/chat | - | ✅ Anthropic | - | ストリーミング |

## 3.4 スコアリングルール

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 3.4.1 | ルールセット一覧 | ✅ `/settings` | ✅ scoringRules.list | - | - | ✅ leadScoringRulesets | |
| 3.4.2 | ルールセット作成 | ✅ `/settings` | ✅ scoringRules.create | - | - | ✅ leadScoringRulesets | |
| 3.4.3 | ルールセット編集 | ✅ `/settings` | ✅ scoringRules.update | - | - | ✅ leadScoringRulesets | |
| 3.4.4 | スコア計算 | - | ✅ scoringRules.calculateScore | - | - | ✅ leads | |
| 3.4.5 | シミュレーション | ✅ `/settings` | ✅ scoringRules.simulateScore | - | - | - | |
| 3.4.6 | 一括再計算 | ✅ `/settings` | ✅ scoringRules.recalculateAll | ✅ | - | ✅ leads | |

---

# 4. 分析・レポート

## 4.1 ダッシュボード

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 4.1.1 | KPIカード | ✅ `/dashboard` | ✅ analytics.getOverview | - | - | ✅ leads | |
| 4.1.2 | トレンドチャート | ✅ `/dashboard` | ✅ analytics.getTrend | - | - | ✅ leads | ApexCharts |
| 4.1.3 | ステータス分布 | ✅ `/dashboard` | ✅ analytics.getStatusBreakdown | - | - | ✅ leads | |
| 4.1.4 | ソース分布 | ✅ `/dashboard` | ✅ analytics.getSourceBreakdown | - | - | ✅ leads | |
| 4.1.5 | アクティビティ | ✅ `/dashboard` | ✅ analytics.getRecentActivity | - | - | ✅ leads | |

## 4.2 分析ページ

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 4.2.1 | 日付範囲フィルター | ✅ `/analytics` | ✅ analytics.* | - | - | - | 7日/30日/90日/全期間 |
| 4.2.2 | コンバージョンファネル | ✅ `/analytics` | ✅ analytics.getConversionFunnel | - | - | ✅ leads | |
| 4.2.3 | ソース別パフォーマンス | ✅ `/analytics` | ✅ analytics.getSourcePerformance | - | - | ✅ leads | |
| 4.2.4 | ROI分析 | ✅ `/analytics` | ✅ analytics.getROI | - | - | ✅ leads | |
| 4.2.5 | 期間比較 | ✅ `/analytics` | ✅ analytics.getComparison | - | - | ✅ leads | |

## 4.3 レポート

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 4.3.1 | CSVエクスポート | ✅ `/analytics` | ✅ ライブラリ | - | - | - | |
| 4.3.2 | PDFレポート | ✅ `/analytics` | ✅ ライブラリ | - | - | - | jspdf |
| 4.3.3 | スケジュールレポート | ✅ `/settings` | ✅ scheduledReports.* | ✅ Cron | ✅ Resend | ✅ scheduledReports | |
| 4.3.4 | カスタムレポート | ✅ `/settings` | ✅ customReports.* | - | - | ✅ customReports | |

## 4.4 ウィジェット設定

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 4.4.1 | ウィジェット表示設定 | ✅ `/dashboard` | - | - | - | - | LocalStorage |
| 4.4.2 | ウィジェット並び替え | ✅ `/dashboard` | - | - | - | - | D&D |

---

# 5. 診断フォーム

## 5.1 診断テンプレート

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 5.1.1 | テンプレート一覧 | ✅ `/settings` | ✅ diagnosticTemplates.list | - | - | ✅ diagnosticTemplates | |
| 5.1.2 | テンプレート作成 | ✅ `/settings` | ✅ diagnosticTemplates.create | - | - | ✅ diagnosticTemplates | |
| 5.1.3 | テンプレート編集 | ✅ `/settings` | ✅ diagnosticTemplates.update | - | - | ✅ diagnosticTemplates | |
| 5.1.4 | テンプレート削除 | ✅ `/settings` | ✅ diagnosticTemplates.delete | - | - | ✅ diagnosticTemplates | |
| 5.1.5 | テンプレート複製 | ✅ `/settings` | ✅ diagnosticTemplates.duplicate | - | - | ✅ diagnosticTemplates | |
| 5.1.6 | 送信統計 | ✅ `/settings` | ✅ diagnosticTemplates.getStats | - | - | ✅ diagnosticTemplates | |

## 5.2 診断フォーム（公開）

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 5.2.1 | 診断フォーム表示 | ✅ `/diagnostic` | - | - | - | - | ステップウィザード |
| 5.2.2 | 診断送信 | ✅ `/diagnostic` | ✅ /api/diagnostic | - | - | ✅ leads | |
| 5.2.3 | 結果表示 | ✅ `/diagnostic` | - | - | - | - | スコア表示 |
| 5.2.4 | 結果メール送信 | - | ✅ /api/diagnostic | - | ✅ Resend | - | 自動送信 |

## 5.3 A/Bテスト

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 5.3.1 | A/Bテスト一覧 | ✅ `/settings` | ✅ abTests.list | - | - | ✅ diagnosticAbTests | |
| 5.3.2 | A/Bテスト作成 | ✅ `/settings` | ✅ abTests.create | - | - | ✅ diagnosticAbTests | |
| 5.3.3 | A/Bテスト開始/停止 | ✅ `/settings` | ✅ abTests.start/pause | - | - | ✅ diagnosticAbTests | |
| 5.3.4 | イベント記録 | - | ✅ abTests.recordEvent | - | - | ✅ diagnosticAbTests | |
| 5.3.5 | 結果分析 | ✅ `/settings` | ✅ abTests.getResults | - | - | ✅ diagnosticAbTests | 統計計算 |
| 5.3.6 | バリアント選択 | - | ✅ abTests.selectVariant | - | - | - | トラフィック配分 |

---

# 6. 外部連携

## 6.1 Webhook

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 6.1.1 | Webhook一覧 | ✅ `/settings/webhooks` | ✅ webhooks.list | - | - | ✅ webhooks | |
| 6.1.2 | Webhook作成 | ✅ `/settings/webhooks` | ✅ webhooks.create | - | - | ✅ webhooks | |
| 6.1.3 | Webhook編集 | ✅ `/settings/webhooks` | ✅ webhooks.update | - | - | ✅ webhooks | |
| 6.1.4 | Webhook削除 | ✅ `/settings/webhooks` | ✅ webhooks.delete | - | - | ✅ webhooks | |
| 6.1.5 | テスト送信 | ✅ `/settings/webhooks` | ✅ webhooks.test | - | ✅ 外部URL | - | |
| 6.1.6 | 配信ログ | ✅ `/settings/webhooks` | ✅ webhooks.getDeliveries | - | - | ✅ webhookDeliveries | |
| 6.1.7 | リトライ処理 | - | - | ✅ Cron | ✅ 外部URL | ✅ webhookDeliveries | 指数バックオフ |

## 6.2 メール統合 (Resend)

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 6.2.1 | リード通知メール | - | ✅ ライブラリ | - | ✅ Resend | - | |
| 6.2.2 | 診断結果メール | - | ✅ ライブラリ | - | ✅ Resend | - | |
| 6.2.3 | 招待メール | - | ✅ ライブラリ | - | ✅ Resend | - | |
| 6.2.4 | ウェルカムメール | - | ✅ ライブラリ | - | ✅ Resend | - | |
| 6.2.5 | パスワードリセット | - | ✅ Better Auth | - | ✅ Resend | - | |
| 6.2.6 | 週次レポート | - | ✅ ライブラリ | ✅ Cron | ✅ Resend | - | |

## 6.3 Slack統合

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 6.3.1 | リード通知 | - | ✅ ライブラリ | - | ✅ Slack | - | Block Kit |
| 6.3.2 | サマリー通知 | - | ✅ ライブラリ | ✅ | ✅ Slack | - | |
| 6.3.3 | アラート通知 | - | ✅ ライブラリ | - | ✅ Slack | - | |

## 6.4 Zapier/Make統合

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 6.4.1 | REST Hook | - | ✅ ライブラリ | - | ✅ Zapier/Make | - | |
| 6.4.2 | トリガー送信 | - | ✅ ライブラリ | - | ✅ Zapier/Make | - | HMAC署名 |

## 6.5 REST API v2

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 6.5.1 | リード一覧 | - | ✅ GET /api/v2/leads | - | - | ✅ leads | Bearer認証 |
| 6.5.2 | リード作成 | - | ✅ POST /api/v2/leads | - | - | ✅ leads | |
| 6.5.3 | リード詳細 | - | ✅ GET /api/v2/leads/[id] | - | - | ✅ leads | |
| 6.5.4 | リード更新 | - | ✅ PATCH /api/v2/leads/[id] | - | - | ✅ leads | |
| 6.5.5 | リード削除 | - | ✅ DELETE /api/v2/leads/[id] | - | - | ✅ leads | |
| 6.5.6 | 分析データ | - | ✅ GET /api/v2/analytics | - | - | ✅ leads | |
| 6.5.7 | Webhook CRUD | - | ✅ /api/v2/webhooks/* | - | - | ✅ webhooks | |

---

# 7. ワークフロー自動化

## 7.1 ワークフロー管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 7.1.1 | ワークフロー一覧 | ✅ `/settings` | ✅ workflows.list | - | - | ✅ workflows | |
| 7.1.2 | ワークフロー作成 | ✅ `/settings` | ✅ workflows.create | - | - | ✅ workflows | |
| 7.1.3 | ワークフロー編集 | ✅ `/settings` | ✅ workflows.update | - | - | ✅ workflows | |
| 7.1.4 | ワークフロー削除 | ✅ `/settings` | ✅ workflows.delete | - | - | ✅ workflows | |
| 7.1.5 | 有効/無効切替 | ✅ `/settings` | ✅ workflows.toggleStatus | - | - | ✅ workflows | |
| 7.1.6 | 実行履歴 | ✅ `/settings` | ✅ workflows.getExecutions | - | - | ✅ workflowExecutions | |
| 7.1.7 | 統計情報 | ✅ `/settings` | ✅ workflows.getStats | - | - | ✅ workflowExecutions | |

## 7.2 ワークフロー実行

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 7.2.1 | トリガー評価 | - | ✅ 内部処理 | - | - | ✅ workflows | 7種類 |
| 7.2.2 | 条件評価 | - | ✅ 内部処理 | - | - | - | 12演算子 |
| 7.2.3 | アクション実行 | - | ✅ 内部処理 | - | ✅ 各種 | ✅ workflowExecutions | 7種類 |
| 7.2.4 | スケジュール実行 | - | - | ✅ Cron | - | ✅ workflows | |

---

# 8. 埋め込みウィジェット

## 8.1 埋め込み設定

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 8.1.1 | 設定一覧 | ✅ `/settings/embed` | ✅ embed.list | - | - | ✅ embedConfigs | |
| 8.1.2 | 設定作成 | ✅ `/settings/embed` | ✅ embed.create | - | - | ✅ embedConfigs | |
| 8.1.3 | 設定編集 | ✅ `/settings/embed` | ✅ embed.update | - | - | ✅ embedConfigs | |
| 8.1.4 | 設定削除 | ✅ `/settings/embed` | ✅ embed.delete | - | - | ✅ embedConfigs | |
| 8.1.5 | APIキー再生成 | ✅ `/settings/embed` | ✅ embed.regenerateKey | - | - | ✅ embedConfigs | |
| 8.1.6 | 埋め込みコード取得 | ✅ `/settings/embed` | ✅ embed.getCode | - | - | - | |

## 8.2 埋め込みAPI

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 8.2.1 | 診断フォーム取得 | - | ✅ /api/embed/v1/diagnostic | - | - | ✅ diagnosticTemplates | |
| 8.2.2 | リード送信 | - | ✅ /api/embed/v1/lead | - | - | ✅ leads | |
| 8.2.3 | ドメイン検証 | - | ✅ ライブラリ | - | - | ✅ embedConfigs | |
| 8.2.4 | レート制限 | - | ✅ ライブラリ | - | - | - | |

## 8.3 QRキャンペーン

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 8.3.1 | キャンペーン一覧 | ✅ `/settings/qr-campaigns` | ✅ qrCampaigns.list | - | - | ✅ qrCampaigns | |
| 8.3.2 | キャンペーン作成 | ✅ `/settings/qr-campaigns` | ✅ qrCampaigns.create | - | - | ✅ qrCampaigns | |
| 8.3.3 | QRコード生成 | ✅ `/settings/qr-campaigns` | ✅ qrCampaigns.generateQR | - | - | - | qrcode |
| 8.3.4 | キャンペーン統計 | ✅ `/settings/qr-campaigns` | ✅ qrCampaigns.getStats | - | - | ✅ leads | |

---

# 9. コンテンツ管理 (CMS)

## 9.1 ブログ管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 9.1.1 | 記事一覧 | ✅ `/content/blog` | ✅ content.blog.list | - | - | ✅ PayloadCMS | |
| 9.1.2 | 記事作成 | ✅ `/content/blog` | ✅ content.blog.create | - | - | ✅ PayloadCMS | |
| 9.1.3 | 記事編集 | ✅ `/content/blog` | ✅ content.blog.update | - | - | ✅ PayloadCMS | Lexical |
| 9.1.4 | 記事削除 | ✅ `/content/blog` | ✅ content.blog.delete | - | - | ✅ PayloadCMS | |
| 9.1.5 | ブログ公開ページ | ✅ `/blog` | - | - | - | ✅ PayloadCMS | ISR |
| 9.1.6 | ブログ詳細ページ | ✅ `/blog/[slug]` | - | - | - | ✅ PayloadCMS | ISR |

## 9.2 FAQ管理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 9.2.1 | FAQ一覧 | ✅ `/content/faqs` | ✅ content.faqs.list | - | - | ✅ PayloadCMS | |
| 9.2.2 | FAQ作成 | ✅ `/content/faqs` | ✅ content.faqs.create | - | - | ✅ PayloadCMS | |
| 9.2.3 | FAQ編集 | ✅ `/content/faqs` | ✅ content.faqs.update | - | - | ✅ PayloadCMS | |
| 9.2.4 | FAQ削除 | ✅ `/content/faqs` | ✅ content.faqs.delete | - | - | ✅ PayloadCMS | |
| 9.2.5 | FAQ公開ページ | ✅ `/faq` | - | - | - | ✅ PayloadCMS | アコーディオン |

## 9.3 PayloadCMS Admin

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 9.3.1 | Admin Panel | ✅ `/admin` | - | - | - | ✅ PayloadCMS | |
| 9.3.2 | メディア管理 | ✅ `/admin` | ✅ PayloadCMS | - | - | ✅ PayloadCMS | |
| 9.3.3 | GraphQL API | - | ✅ /api/graphql | - | - | ✅ PayloadCMS | |
| 9.3.4 | GraphQL Playground | ✅ `/api/graphql-playground` | - | - | - | - | 開発用 |

---

# 10. 通知機能

## 10.1 アプリ内通知

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 10.1.1 | 通知一覧 | ✅ ヘッダードロップダウン | ✅ notifications.list | - | - | ✅ notifications | |
| 10.1.2 | 未読カウント | ✅ ヘッダー | ✅ notifications.getUnreadCount | - | - | ✅ notifications | |
| 10.1.3 | 既読化 | ✅ ドロップダウン | ✅ notifications.markAsRead | - | - | ✅ notifications | |
| 10.1.4 | 通知設定 | ✅ `/settings` | ✅ notifications.updatePreferences | - | - | ✅ notificationPreferences | |

---

# 11. 公開ページ

## 11.1 ランディングページ

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 11.1.1 | トップページ | ✅ `/` | - | - | - | - | |
| 11.1.2 | ランディングページ | ✅ `/landing` | - | - | - | - | ISR |

## 11.2 SEO

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 11.2.1 | サイトマップ | - | ✅ /sitemap.xml | - | - | - | 自動生成 |
| 11.2.2 | robots.txt | - | ✅ /robots.txt | - | - | - | |
| 11.2.3 | OGP/Twitter Card | ✅ 各ページ | - | - | - | - | Metadata API |

---

# 12. システム管理

## 12.1 バッチ処理

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 12.1.1 | Webhook配信ログ削除 | - | - | ✅ 毎日3:00 UTC | - | ✅ webhookDeliveries | Vercel Cron |
| 12.1.2 | セッション期限切れ削除 | - | - | ✅ Better Auth | - | ✅ sessions | |
| 12.1.3 | 埋め込み更新 | - | - | ✅ オンデマンド | ✅ OpenAI | ✅ leads | |

## 12.2 監視・ログ

| No | 機能名 | 画面 | API | バッチ | 外部IF | DB | 備考 |
|----|--------|------|-----|--------|--------|-----|------|
| 12.2.1 | エラー監視 | - | - | - | ✅ Sentry | - | クライアント/サーバー/エッジ |
| 12.2.2 | 構造化ログ | - | - | - | - | - | JSON/人間可読 |
| 12.2.3 | ヘルスチェック | - | ✅ /api/health | - | - | - | |

---

# 集計

## カテゴリ別機能数

| 大分類 | 画面 | API | バッチ | 外部IF | DB |
|--------|------|-----|--------|--------|-----|
| 1. 認証・ユーザー管理 | 8 | 16 | 1 | 2 | 8 |
| 2. リード管理 | 12 | 25 | 0 | 0 | 6 |
| 3. AI機能 | 6 | 14 | 3 | 3 | 3 |
| 4. 分析・レポート | 8 | 12 | 1 | 1 | 3 |
| 5. 診断フォーム | 8 | 14 | 0 | 1 | 3 |
| 6. 外部連携 | 3 | 20 | 2 | 8 | 3 |
| 7. ワークフロー自動化 | 7 | 10 | 1 | 1 | 2 |
| 8. 埋め込みウィジェット | 6 | 10 | 0 | 0 | 3 |
| 9. コンテンツ管理 | 10 | 10 | 0 | 0 | 1 |
| 10. 通知機能 | 3 | 4 | 0 | 0 | 2 |
| 11. 公開ページ | 4 | 2 | 0 | 0 | 0 |
| 12. システム管理 | 0 | 1 | 3 | 2 | 2 |
| **合計** | **75** | **138** | **11** | **18** | **36** |

## 外部IF一覧

| サービス | 用途 |
|----------|------|
| Anthropic (Claude) | AIスコアリング、要約、チャット |
| OpenAI | 埋め込みベクトル生成 |
| Resend | メール送信 |
| Slack | 通知連携 |
| Zapier/Make | 自動化連携 |
| Sentry | エラー監視 |
| PayloadCMS | コンテンツ管理 |

## DBテーブル一覧

| テーブル | 用途 |
|----------|------|
| users | ユーザー |
| sessions | セッション |
| accounts | OAuth連携 |
| verification | 確認トークン |
| organizations | 組織 |
| members | 組織メンバー |
| invitations | 招待 |
| leads | リード |
| tags | タグ |
| leadTags | リード-タグ関連 |
| leadComments | コメント |
| customFields | カスタムフィールド |
| leadScoringRulesets | スコアリングルール |
| diagnosticTemplates | 診断テンプレート |
| diagnosticAbTests | A/Bテスト |
| webhooks | Webhook設定 |
| webhookDeliveries | Webhook配信ログ |
| workflows | ワークフロー |
| workflowExecutions | ワークフロー実行履歴 |
| embedConfigs | 埋め込み設定 |
| qrCampaigns | QRキャンペーン |
| scheduledReports | スケジュールレポート |
| customReports | カスタムレポート |
| notifications | 通知 |
| notificationPreferences | 通知設定 |
| PayloadCMS (別スキーマ) | CMS用テーブル群 |

---

*最終更新: 2026-01-31*
