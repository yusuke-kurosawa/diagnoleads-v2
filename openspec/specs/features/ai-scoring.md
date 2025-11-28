# AI機能仕様書

> **Source of Truth**: DiagnoLeads v2 AI機能の詳細仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 3 実装完了 (90%)

---

## 概要

DiagnoLeads v2のAI機能は、リード管理の効率化と意思決定支援を目的としています。
Claude 4.5 SonnetとOpenAI Embeddingsを組み合わせ、高精度なリードスコアリングとセマンティック検索を実現します。

### コア機能

| 機能 | 説明 | ステータス |
|------|------|-----------|
| **AIリードスコアリング** | Claudeによる0-100点スコア評価 | ✅ 完了 |
| **セマンティック検索** | 自然言語によるリード検索 | ✅ 完了 |
| **類似リード検索** | ベクトル類似度による関連リード発見 | ✅ 完了 |
| **AI要約生成** | リード情報の自動要約 | ✅ 完了 |
| **チャットボット** | AIアシスタント | ⏸️ 保留 |

---

## 技術スタック

### AIプロバイダー

| 用途 | プロバイダー | モデル |
|------|------------|--------|
| リードスコアリング | Anthropic | claude-sonnet-4-20250514 |
| 要約生成 | Anthropic | claude-sonnet-4-20250514 |
| 埋め込みベクトル | OpenAI | text-embedding-3-small |

### データベース拡張

| 拡張 | バージョン | 用途 |
|------|-----------|------|
| pgvector | Latest | ベクトル検索 |
| PostgreSQL tsvector | Built-in | 全文検索 |

### インデックス

```sql
-- HNSW: ベクトル検索用高速インデックス
CREATE INDEX leads_embedding_idx ON leads
  USING hnsw (embedding vector_cosine_ops);

-- GIN: 全文検索用インデックス
CREATE INDEX leads_search_vector_idx ON leads
  USING gin (search_vector);
```

---

## AIリードスコアリング

### 概要

リードの属性と行動履歴を分析し、成約可能性を0-100点でスコアリングします。

### スコア構造

```typescript
interface LeadScore {
  score: number;           // 0-100の整数スコア
  confidence: Confidence;  // 信頼度レベル
  reasoning: string;       // スコアの根拠説明
  recommendedActions: string[]; // 推奨アクション
  priority: Priority;      // 優先度レベル
}

type Confidence = 'low' | 'medium' | 'high';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
```

### スコアリング基準

| スコア範囲 | 優先度 | 説明 |
|-----------|--------|------|
| 80-100 | urgent | 即時対応必要。成約可能性が非常に高い |
| 60-79 | high | 高優先度。積極的なフォローアップ推奨 |
| 40-59 | medium | 中優先度。育成が必要 |
| 0-39 | low | 低優先度。長期的な育成対象 |

### 分析対象データ

- 会社名・業界・従業員規模
- 担当者の役職
- 流入経路（ソースチャネル）
- リードステータス
- 作成日からの経過日数
- 備考・追加情報

### バッチ処理

- **並行数**: 5リクエスト同時
- **レート制限対応**: 自動リトライ
- **フォールバック**: エラー時はスコア50（低信頼度）

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/features/ai/scoring/claude.ts` | スコアリングロジック |
| `lib/features/ai/api/router.ts` | tRPCエンドポイント |
| `hooks/use-ai.ts` | Reactフック |

---

## セマンティック検索

### 概要

自然言語クエリをベクトル化し、類似度に基づいてリードを検索します。

### 動作フロー

```
1. ユーザークエリ受信
   ↓
2. OpenAI Embeddings でベクトル化 (1536次元)
   ↓
3. pgvector でコサイン類似度検索
   ↓
4. 類似度でソート・フィルタ
   ↓
5. 結果返却
```

### パラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| query | string | - | 検索クエリ |
| limit | number | 10 | 最大結果数 (1-50) |
| minSimilarity | number | 0.7 | 最小類似度閾値 (0-1) |

### 結果構造

```typescript
interface SemanticSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  industry: string | null;
  similarity: number; // 0-1 コサイン類似度
}
```

### 検索例

| クエリ | 期待結果 |
|-------|---------|
| "IT企業の経営者" | IT業界で役職が経営者のリード |
| "資金調達に興味がある" | 備考に関連キーワードがあるリード |
| "東京のスタートアップ" | 東京所在のスタートアップ企業 |

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/features/ai/embeddings/openai.ts` | 埋め込み生成 |
| `lib/features/ai/search/semantic.ts` | 検索ロジック |
| `components/features/ai/SemanticSearch.tsx` | 検索UI |

---

## 類似リード検索

### 概要

指定したリードと類似した特徴を持つリードを発見します。

### 動作フロー

```
1. 対象リードの埋め込みベクトル取得
   ↓
2. 同一組織内のリードとコサイン類似度計算
   ↓
3. 類似度でソート（対象リード除外）
   ↓
4. 上位N件を返却
```

### ユースケース

- 類似案件のパターン発見
- 関連リードへのクロスセル提案
- リード品質の相対評価

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/features/ai/search/semantic.ts` | 検索ロジック |
| `components/features/ai/SimilarLeadsCard.tsx` | 類似リード表示UI |

---

## AI要約生成

### 概要

リード情報を2-3文で簡潔に要約し、重要なインサイトを抽出します。

### 出力形式

```
[要約例]
株式会社テストの山田太郎様は、IT業界のCTOで新規システム導入を検討中。
初回コンタクトから2週間が経過しており、積極的なフォローアップが推奨される。
```

### 生成パラメータ

| パラメータ | 値 |
|-----------|-----|
| モデル | claude-sonnet-4 |
| Temperature | 0.7 |
| 最大トークン | 150 |

### 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/features/ai/chat/assistant.ts` | 要約生成ロジック |
| `components/features/ai/AISummaryCard.tsx` | 要約表示UI |

---

## 埋め込みベクトル管理

### リードテキスト準備

以下のフィールドを連結してテキスト化：

```typescript
function prepareLeadText(lead: Lead): string {
  return [
    lead.name,
    lead.email,
    lead.company,
    lead.industry,
    lead.position,
    lead.notes
  ].filter(Boolean).join(' ');
}
```

### ベクトル更新タイミング

| イベント | 更新 |
|---------|------|
| リード作成 | 自動生成 |
| リード更新 | 手動トリガー |
| バッチ処理 | 未埋め込みリードを一括更新 |

### ベクトル仕様

| 項目 | 値 |
|------|-----|
| 次元数 | 1536 |
| 正規化 | L2正規化済み |
| 距離関数 | コサイン距離 |

---

## UIコンポーネント

### AIScoreCard

リードのAIスコアを表示するカード。

```typescript
interface AIScoreCardProps {
  leadId: string;
  organizationId: string;
  initialScore?: LeadScore;
}
```

**表示内容**:
- スコア（0-100）と円形プログレス
- 信頼度バッジ
- 優先度ラベル
- 推奨アクションリスト
- 再スコアリングボタン

### SimilarLeadsCard

類似リードを表示するカード。

```typescript
interface SimilarLeadsCardProps {
  leadId: string;
  organizationId: string;
  limit?: number;
}
```

**表示内容**:
- 類似リード一覧
- 類似度パーセント
- 会社名・業界・担当者

### AISummaryCard

AI要約を表示するカード。

```typescript
interface AISummaryCardProps {
  leadId: string;
  organizationId: string;
}
```

**表示内容**:
- 要約テキスト
- 再生成ボタン
- ローディング状態

### SemanticSearch

セマンティック検索UI。

```typescript
interface SemanticSearchProps {
  organizationId: string;
  onSelectLead?: (leadId: string) => void;
}
```

**機能**:
- 検索クエリ入力
- 例文サジェスト
- リアルタイム検索結果
- 類似度表示

---

## i18n対応

### 翻訳キー構造

```
ai:
  score:
    title: "AIスコア"
    calculating: "スコアを計算中..."
    recalculate: "再計算"
  priority:
    low: "低"
    medium: "中"
    high: "高"
    urgent: "緊急"
  confidence:
    low: "低信頼度"
    medium: "中信頼度"
    high: "高信頼度"
  search:
    placeholder: "自然言語で検索..."
    examples: "例: IT企業の経営者"
  similar:
    title: "類似リード"
    noResults: "類似リードが見つかりませんでした"
  summary:
    title: "AI要約"
    regenerate: "再生成"
```

### 対応言語

- 日本語 (ja): 42キー
- 英語 (en): 42キー

---

## エラーハンドリング

### APIエラー

| エラーコード | 説明 | 対応 |
|-------------|------|------|
| RATE_LIMIT | APIレート制限 | 自動リトライ |
| TIMEOUT | タイムアウト | フォールバックスコア |
| INVALID_INPUT | 入力不正 | バリデーションエラー表示 |

### フォールバック動作

```typescript
const fallbackScore: LeadScore = {
  score: 50,
  confidence: 'low',
  reasoning: 'スコアリングに失敗しました',
  recommendedActions: ['後で再試行してください'],
  priority: 'medium'
};
```

---

## パフォーマンス目標

| 指標 | 目標値 |
|------|--------|
| 単一スコアリング | < 3s |
| セマンティック検索 | < 500ms |
| 類似リード検索 | < 500ms |
| 要約生成 | < 2s |

---

## セキュリティ

### 組織スコープ

- すべてのAI操作は`organizationProcedure`経由
- 他組織のデータにアクセス不可
- RLSによる自動フィルタリング

### APIキー管理

| キー | 環境変数 |
|------|---------|
| Anthropic | `ANTHROPIC_API_KEY` |
| OpenAI | `OPENAI_API_KEY` |

---

## 将来の拡張（Phase 4以降）

### チャットボット

- ストリーミング対応AIアシスタント
- 組織コンテキストを考慮した回答
- リード情報へのクエリ

### 自動スコアリング

- リード作成時の自動スコアリング
- 定期バッチスコアリング
- スコア変動の通知

### 予測分析

- 成約確率の時系列予測
- リード育成の最適タイミング提案
- A/Bテスト最適化

---

## 関連ドキュメント

- [アーキテクチャ仕様](/openspec/specs/architecture.md)
- [AI API仕様](/openspec/specs/api/ai.md)
- [実装チェックリスト](/IMPLEMENTATION_CHECKLIST.md)
