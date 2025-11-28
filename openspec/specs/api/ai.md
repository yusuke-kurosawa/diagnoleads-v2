# AI API 仕様書

> **Source of Truth**: DiagnoLeads v2 AI機能API仕様
>
> **最終更新**: 2025-11-28
> **ステータス**: Phase 3 実装完了 (90%)

---

## 概要

AI APIは、リードスコアリング、セマンティック検索、類似リード検索、要約生成の機能を提供します。
すべてのエンドポイントは`organizationProcedure`を使用し、マルチテナント対応を実現しています。

---

## ベースパス

```
tRPC: trpc.ai.*
```

---

## 認証・認可

| レイヤー | 内容 |
|---------|------|
| 認証 | `protectedProcedure` - BetterAuth セッション必須 |
| 組織スコープ | `organizationProcedure` - 組織メンバーシップ検証 |
| データ分離 | PostgreSQL RLS - 自動フィルタリング |

---

## エンドポイント

### ai.scoreLead

単一リードのAIスコアを計算します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  lead: Lead;
  aiScore: LeadScore;
}
```

**LeadScore型**:
```typescript
interface LeadScore {
  score: number;           // 0-100
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  recommendedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
```

**処理時間**: 1-3秒

**例**:
```typescript
const { mutate } = trpc.ai.scoreLead.useMutation();
mutate({
  organizationId: 'org-uuid',
  leadId: 'lead-uuid'
});
```

---

### ai.batchScoreLeads

複数リードのAIスコアを一括計算します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  leadIds: z.array(z.string().uuid()).min(1).max(50),
})
```

**出力スキーマ**:
```typescript
{
  leads: Lead[];
  scores: Array<{
    leadId: string;
    score: LeadScore;
  }>;
}
```

**バッチ処理**:
- 並行リクエスト数: 5
- 最大リード数: 50
- 失敗したリードにはフォールバックスコアを適用

**処理時間**: リード数 / 5 × 3秒（概算）

---

### ai.semanticSearch

自然言語によるリード検索を実行します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  query: z.string().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  minSimilarity: z.number().min(0).max(1).default(0.7),
})
```

**出力スキーマ**:
```typescript
SemanticSearchResult[]
```

**SemanticSearchResult型**:
```typescript
interface SemanticSearchResult {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  similarity: number; // 0-1 コサイン類似度
}
```

**処理フロー**:
1. クエリをOpenAI Embeddingsでベクトル化
2. pgvectorでコサイン類似度検索
3. minSimilarity以上の結果をソート
4. limit件まで返却

**処理時間**: 200-500ms

**例**:
```typescript
const { data } = trpc.ai.semanticSearch.useQuery({
  organizationId: 'org-uuid',
  query: 'IT企業の経営者',
  limit: 20,
  minSimilarity: 0.6
});
```

---

### ai.findSimilar

指定リードに類似したリードを検索します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
  limit: z.number().int().min(1).max(20).default(5),
})
```

**出力スキーマ**:
```typescript
SemanticSearchResult[]
```

**処理フロー**:
1. 対象リードの埋め込みベクトル取得
2. 同組織内の他リードとコサイン類似度計算
3. 類似度の高い順にソート
4. limit件まで返却

**処理時間**: 100-300ms

---

### ai.generateSummary

リード情報のAI要約を生成します。

**Type**: Query

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  summary: string;
}
```

**出力仕様**:
- 2-3文の簡潔な要約
- 重要な属性（会社、業界、役職）を含む
- 次のアクション示唆を含む場合あり

**処理時間**: 1-2秒

---

### ai.updateEmbedding

リードの埋め込みベクトルを更新します。

**Type**: Mutation

**入力スキーマ**:
```typescript
z.object({
  organizationId: z.string().uuid(),
  leadId: z.string().uuid(),
})
```

**出力スキーマ**:
```typescript
{
  success: boolean;
}
```

**用途**:
- リード更新後のベクトル再生成
- 欠損ベクトルの補完
- バッチでのベクトル更新

**処理時間**: 200-500ms

---

## Reactフック

### useScoreLead

```typescript
function useScoreLead(): UseMutationResult<
  { lead: Lead; aiScore: LeadScore },
  Error,
  { organizationId: string; leadId: string }
>
```

### useBatchScoreLeads

```typescript
function useBatchScoreLeads(): UseMutationResult<
  { leads: Lead[]; scores: Array<{ leadId: string; score: LeadScore }> },
  Error,
  { organizationId: string; leadIds: string[] }
>
```

### useSemanticSearch

```typescript
function useSemanticSearch(input: {
  organizationId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
}): UseQueryResult<SemanticSearchResult[]>
```

**備考**: `query.length > 0`の時のみ有効化

### useFindSimilarLeads

```typescript
function useFindSimilarLeads(input: {
  organizationId: string;
  leadId: string;
  limit?: number;
}): UseQueryResult<SemanticSearchResult[]>
```

### useGenerateSummary

```typescript
function useGenerateSummary(input: {
  organizationId: string;
  leadId: string;
}): UseQueryResult<{ summary: string }>
```

### useUpdateEmbedding

```typescript
function useUpdateEmbedding(): UseMutationResult<
  { success: boolean },
  Error,
  { organizationId: string; leadId: string }
>
```

### useAI（統合フック）

```typescript
function useAI(organizationId: string): {
  scoreLead: UseMutationResult;
  batchScoreLeads: UseMutationResult;
  updateEmbedding: UseMutationResult;
  score: (leadId: string) => void;
  batchScore: (leadIds: string[]) => void;
  updateLeadEmbedding: (leadId: string) => void;
}
```

---

## エラーハンドリング

### エラーコード

| コード | 説明 | 対応 |
|--------|------|------|
| BAD_REQUEST | 入力バリデーションエラー | 入力を修正 |
| UNAUTHORIZED | 認証が必要 | 再ログイン |
| FORBIDDEN | 組織に所属していない | 権限確認 |
| NOT_FOUND | リードが見つからない | ID確認 |
| INTERNAL_SERVER_ERROR | AI API エラー | リトライ |

### フォールバック動作

**スコアリング失敗時**:
```typescript
{
  score: 50,
  confidence: 'low',
  reasoning: 'スコアリングに失敗しました',
  recommendedActions: ['後で再試行してください'],
  priority: 'medium'
}
```

**検索失敗時**:
- 空の配列を返却
- エラートースト表示

---

## レート制限

| API | 制限 |
|-----|------|
| Anthropic Claude | 1000 req/min (API tier依存) |
| OpenAI Embeddings | 3000 req/min |

**バッチ処理での対策**:
- 並行リクエスト数制限（5）
- エクスポネンシャルバックオフ

---

## パフォーマンス目標

| エンドポイント | 目標レスポンス時間 |
|---------------|-------------------|
| scoreLead | < 3s |
| batchScoreLeads | < 30s (50件) |
| semanticSearch | < 500ms |
| findSimilar | < 300ms |
| generateSummary | < 2s |
| updateEmbedding | < 500ms |

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `lib/features/ai/api/router.ts` | tRPCルーター |
| `lib/features/ai/scoring/claude.ts` | スコアリングロジック |
| `lib/features/ai/embeddings/openai.ts` | 埋め込み生成 |
| `lib/features/ai/search/semantic.ts` | セマンティック検索 |
| `lib/features/ai/chat/assistant.ts` | 要約生成 |
| `hooks/use-ai.ts` | Reactフック |

---

## 関連ドキュメント

- [AI機能仕様](/openspec/specs/features/ai-scoring.md)
- [Leads API仕様](/openspec/specs/api/leads.md)
- [アーキテクチャ仕様](/openspec/specs/architecture.md)
