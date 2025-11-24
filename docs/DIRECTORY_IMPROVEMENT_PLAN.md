# ディレクトリ構成改善計画

## Phase 2 改善 (今すぐ実施)

### 目的
- マルチテナントロジックの明確化
- Feature-based organizationの実験
- 将来の拡張性確保

### 変更内容

#### 1. マルチテナント専用ディレクトリ

```bash
lib/multi-tenant/
├── middleware/
│   └── organization.ts        # organizationProcedure
├── helpers/
│   ├── membership.ts          # メンバーシップ検証
│   └── permissions.ts         # CASL統合
└── types.ts                   # マルチテナント型定義
```

**移動ファイル**:
- `lib/trpc/init.ts` → `lib/multi-tenant/middleware/organization.ts`
- organizationProcedure関連ロジックを抽出

**利点**:
- マルチテナントロジックが一箇所に集約
- 他のプロジェクトへの再利用が容易
- 責務の明確化

#### 2. Feature-based organization (実験)

```bash
lib/features/
└── leads/
    ├── api/
    │   └── router.ts          # server/routers/leads.ts相当
    ├── hooks/
    │   └── use-leads.ts       # tRPCラッパー
    ├── types/
    │   └── schemas.ts         # Zod schemas
    └── index.ts               # 公開API
```

**利点**:
- 機能ごとの独立性向上
- コロケーション（関連コードが近くにある）
- 機能の追加・削除が容易

#### 3. hooksディレクトリ追加

```bash
hooks/
├── use-organization.ts        # 組織コンテキスト
├── use-leads.ts              # リード管理
└── use-permissions.ts        # 権限管理
```

**理由**: Next.js標準パターン

### 実装順序

1. **Step 1**: `lib/multi-tenant/` 作成
   - organizationProcedureの移動とリファクタリング
   - 共通ヘルパー関数の抽出

2. **Step 2**: `hooks/` 作成
   - useOrganizationフック作成
   - tRPCラッパーフック作成

3. **Step 3**: `lib/features/leads/` 実験
   - Task 2実装時にfeature-based構造を試す
   - 効果を評価して継続判断

### Phase 3以降の計画

#### AI統合 (Phase 3)

```bash
lib/ai/
├── providers/
│   ├── claude.ts
│   └── openai.ts
├── scoring/
│   └── lead-scoring.ts
└── embeddings/
    └── vector-search.ts
```

#### プラグインシステム (Phase 3)

```bash
lib/plugins/
├── core/
│   ├── plugin-api.ts
│   ├── registry.ts
│   └── loader.ts
└── examples/
    └── custom-field-plugin/
```

### OpenSpec構造拡張

```bash
openspec/
├── specs/
│   ├── architecture.md
│   ├── api/                   # 🆕 API仕様詳細
│   │   ├── leads.md
│   │   └── organizations.md
│   └── features/              # 🆕 機能仕様詳細
│       ├── multi-tenant.md
│       └── ai-scoring.md
└── changes/
    ├── phase2-core/
    └── phase3-ai/             # 🆕 将来の変更
```

## 判断基準

### いつ大規模リファクタリングを行うか

**実施する条件**:
- ✅ Phase境界（Phase 2完了後等）
- ✅ 明確な技術的負債が累積
- ✅ 新機能追加が困難になった時

**実施しない条件**:
- ❌ Phase実装途中
- ❌ 現在の構造で問題ない
- ❌ リファクタリングの価値が不明確

## 現時点の推奨

### ✅ 今すぐ実施
1. `lib/multi-tenant/` 作成（小規模改善）
2. `hooks/` ディレクトリ追加
3. Task 2実装

### ⏸️ Phase 2完了後に検討
4. `lib/features/` 全面導入
5. `components/` 再編成
6. `openspec/specs/api/` 詳細化

### ⏸️ Phase 3で実施
7. `lib/ai/` 追加
8. `lib/plugins/` システム構築

## まとめ

**現在の構成**: 🟢 基本的に良好

**改善の方向性**:
- 段階的改善を推奨（Big Bang rewriteは避ける）
- マルチテナントロジックの明確化（Phase 2で）
- Feature-based organizationの実験（Phase 2で試行）
- AI・プラグインシステムは将来（Phase 3以降）

**次のアクション**:
1. この改善計画をレビュー
2. Phase 2の小規模改善を実施するか判断
3. Task 2実装を継続
