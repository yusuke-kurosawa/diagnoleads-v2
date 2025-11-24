# マルチテナント戦略: ホールディングス・グループ企業対応

## 🎯 コアコンピタンス

**DiagnoLeads v2は、ただの標準的なマルチテナントプラットフォームではありません。**

ホールディングス・グループ企業・会社合併という複雑な組織構造に柔軟に対応できる、
エンタープライズグレードのSaaSプラットフォームです。

### 差別化要素

| 一般的なマルチテナントSaaS | DiagnoLeads v2 |
|----------------------|----------------|
| ✅ 組織単位のデータ分離 | ✅ 組織単位のデータ分離 |
| ❌ フラットな組織構造のみ | ✅ **階層的組織構造** |
| ❌ 組織間連携なし | ✅ **グループ横断アクセス** |
| ❌ 組織再編時に手動対応 | ✅ **M&A・再編対応** |
| ❌ 単一組織レポート | ✅ **グループ統合レポート** |
| ❌ シンプルな権限管理 | ✅ **階層的権限継承** |

---

## 🏢 ユースケース

### 1. ホールディングスカンパニー

```
持株会社（ホールディングス）
├── A事業会社（製造業）
├── B事業会社（小売業）
└── C事業会社（IT業）
```

**要件**:
- 各事業会社は独立してリード管理
- ホールディングスは全社のリードを統合分析
- 事業会社間でのリード共有（オプション）

### 2. グループ企業

```
親会社
├── 子会社1
│   ├── 孫会社A
│   └── 孫会社B
└── 子会社2
    └── 孫会社C
```

**要件**:
- 親会社は子会社・孫会社のデータにアクセス可能
- 子会社は自社と配下の孫会社のみアクセス
- 孫会社は自社データのみアクセス

### 3. M&A・会社合併

```
Before:
- 会社A（独立）
- 会社B（独立）

After（会社Aが会社Bを買収）:
- 会社A（親会社）
  └── 会社B（子会社化）
```

**要件**:
- 既存データを維持したまま組織再編
- 段階的な統合プロセス対応
- ロールバック可能な設計

### 4. カンパニー制企業

```
本社
├── 第1カンパニー
├── 第2カンパニー
└── 第3カンパニー
```

**要件**:
- カンパニー間のデータ分離
- 本社による横断分析
- カンパニー間の業績比較

---

## 🏗️ アーキテクチャ設計

### データベーススキーマ拡張

#### 現在の実装
```typescript
organizations {
  id: uuid
  name: text
  slug: text
  settings: jsonb
}
```

#### 提案: 階層構造対応
```typescript
organizations {
  id: uuid
  name: text
  slug: text
  settings: jsonb

  // 🆕 階層構造フィールド
  parent_organization_id: uuid | null  // 親組織ID
  organization_type: enum              // 'holding' | 'subsidiary' | 'independent'
  hierarchy_path: text                 // ltree型: '1.2.3' (PostgreSQL ltree)
  hierarchy_level: integer             // 階層レベル: 0=最上位, 1=子会社, 2=孫会社

  // 🆕 グループ管理
  group_id: uuid                       // グループ識別子（最上位組織のID）
  is_group_admin: boolean              // グループ管理者権限

  // 🆕 データ共有設定
  data_sharing_policy: jsonb {
    allow_parent_access: boolean       // 親組織のアクセス許可
    allow_sibling_access: boolean      // 兄弟組織のアクセス許可
    allow_child_access: boolean        // 子組織へのアクセス許可
    shared_fields: string[]            // 共有するフィールド
  }
}
```

### 権限モデル拡張

#### 現在の実装
```typescript
roles: 'owner' | 'admin' | 'member'
```

#### 提案: 階層的権限
```typescript
roles:
  // 既存ロール
  | 'owner'                    // 組織オーナー
  | 'admin'                    // 組織管理者
  | 'member'                   // 一般メンバー

  // 🆕 グループロール
  | 'group_owner'              // グループオーナー（全組織アクセス）
  | 'group_admin'              // グループ管理者（全組織読取）
  | 'parent_viewer'            // 親会社閲覧者（子会社データ閲覧のみ）
  | 'cross_org_collaborator'   // 横断協力者（指定組織間）
```

### CASL権限定義拡張

```typescript
// 現在
defineAbilitiesFor(user, membership) {
  can('read', 'Lead', { organizationId: membership.organizationId })
}

// 提案: 階層的権限
defineAbilitiesFor(user, membership, organizationHierarchy) {
  // 自組織のリード
  can('read', 'Lead', { organizationId: membership.organizationId })

  // 🆕 子組織のリード（parent_accessが許可されている場合）
  if (organizationHierarchy.childOrganizations.length > 0) {
    can('read', 'Lead', {
      organizationId: { $in: organizationHierarchy.childOrganizationIds },
      dataSharingPolicy: { allow_parent_access: true }
    })
  }

  // 🆕 グループ全体のリード（group_adminの場合）
  if (membership.role === 'group_admin') {
    can('read', 'Lead', {
      groupId: organizationHierarchy.groupId
    })
  }
}
```

### RLS (Row-Level Security) 拡張

```sql
-- 現在のRLS
CREATE POLICY leads_isolation ON leads
  USING (organization_id = current_setting('app.current_user_org')::uuid);

-- 🆕 提案: 階層的RLS
CREATE POLICY leads_hierarchical_access ON leads
  USING (
    -- 自組織のデータ
    organization_id = current_setting('app.current_user_org')::uuid
    OR
    -- 親組織からのアクセス（data_sharing_policy.allow_parent_accessがtrue）
    (
      organization_id IN (
        SELECT id FROM organizations
        WHERE parent_organization_id = current_setting('app.current_user_org')::uuid
        AND (settings->'data_sharing_policy'->>'allow_parent_access')::boolean = true
      )
    )
    OR
    -- グループ管理者のアクセス
    (
      current_setting('app.current_user_role') = 'group_admin'
      AND group_id = current_setting('app.current_user_group')::uuid
    )
  );
```

---

## 📊 実装フェーズ

### Phase 2.5: 階層構造基盤 (Day 3-5)

**優先度**: P1 (High)
**工数**: 16時間

1. **データベーススキーマ拡張** (6h)
   - `organizations`テーブルに階層フィールド追加
   - ltree拡張インストール
   - マイグレーション作成

2. **階層管理API** (6h)
   - 親組織設定API
   - 子組織一覧取得API
   - 組織ツリー取得API

3. **権限モデル拡張** (4h)
   - グループロール追加
   - CASL定義更新
   - RLS更新

### Phase 3.5: グループ機能 (Day 8-10)

**優先度**: P1 (High)
**工数**: 20時間

1. **グループダッシュボード** (8h)
   - グループ全体の統計
   - 組織比較レポート
   - ドリルダウン機能

2. **クロスオーガナイゼーションアクセス** (8h)
   - データ共有設定UI
   - 共有リード一覧
   - アクセス履歴

3. **組織再編対応** (4h)
   - 親組織変更API
   - データマイグレーション
   - ロールバック機能

### Phase 5: M&A対応 (Phase 3完了後)

**優先度**: P2 (Medium)
**工数**: 24時間

1. **組織統合ウィザード** (12h)
2. **データ統合・分離ツール** (8h)
3. **監査ログ** (4h)

---

## 🎨 UI/UX設計

### 組織選択UI

```
┌─────────────────────────────────────┐
│ 📊 グループダッシュボード           │
├─────────────────────────────────────┤
│                                     │
│ 🏢 ホールディングス株式会社        │
│   📈 統合レポート                   │
│                                     │
│   子会社:                           │
│   ├─ 🏭 製造事業株式会社           │
│   │    📊 リード: 150件             │
│   ├─ 🛒 小売事業株式会社           │
│   │    📊 リード: 320件             │
│   └─ 💻 IT事業株式会社              │
│        📊 リード: 89件              │
│                                     │
│ 合計: 559件のリード                │
└─────────────────────────────────────┘
```

### データ共有設定UI

```
┌─────────────────────────────────────┐
│ ⚙️ データ共有設定                   │
├─────────────────────────────────────┤
│                                     │
│ □ 親会社へのアクセスを許可         │
│   └─ 許可する場合、親会社は       │
│      このリードデータを閲覧可能   │
│                                     │
│ □ 子会社へのアクセスを許可         │
│   └─ 許可する場合、子会社は       │
│      このリードデータを閲覧可能   │
│                                     │
│ □ 兄弟会社へのアクセスを許可       │
│   └─ 同じ親を持つ会社間で共有     │
│                                     │
│ 共有するフィールド:                 │
│ ☑ 基本情報（名前、メール）         │
│ ☑ 会社情報                          │
│ □ スコア                            │
│ □ 回答内容                          │
└─────────────────────────────────────┘
```

---

## 🔒 セキュリティ考慮事項

### データ分離の徹底

1. **デフォルトは完全分離**
   - 明示的に許可しない限り、組織間のデータアクセス不可
   - opt-in方式のデータ共有

2. **監査ログ**
   - すべてのクロスオーガナイゼーションアクセスを記録
   - 誰が、いつ、どの組織のデータにアクセスしたか追跡

3. **段階的権限**
   - 読取専用 → 編集可能 → 削除可能
   - 最小権限の原則

### コンプライアンス

1. **GDPR対応**
   - グループ企業間でのデータ移転の明示的同意
   - データ削除要求への対応（グループ全体）

2. **データ所在地**
   - 組織ごとのデータリージョン設定
   - グループ内でのデータ転送ルール

---

## 📈 競合優位性

### 既存SaaSとの比較

| 機能 | Salesforce | HubSpot | Zoho | **DiagnoLeads v2** |
|------|-----------|---------|------|-------------------|
| マルチテナント | ✅ | ✅ | ✅ | ✅ |
| 組織階層 | ⚠️ 有料プラン | ❌ | ⚠️ 複雑 | ✅ **標準** |
| グループレポート | ⚠️ 追加費用 | ❌ | ⚠️ カスタム | ✅ **標準** |
| M&A対応 | ⚠️ コンサル必要 | ❌ | ❌ | ✅ **ウィザード** |
| 価格 | 💰💰💰 | 💰💰 | 💰 | 💰 |

### ターゲット市場

1. **ホールディングスカンパニー**
   - 3社以上の事業会社を持つ企業
   - グループ全体でのマーケティング最適化

2. **急成長スタートアップ**
   - M&Aによる成長戦略
   - 柔軟な組織再編が必要

3. **大企業のカンパニー制**
   - 複数のカンパニーを持つ大企業
   - カンパニー間のベストプラクティス共有

---

## 🚀 成功指標

### Phase 2完了時

- ✅ 階層構造データモデル実装
- ✅ 基本的な親子関係管理
- ✅ 階層的権限モデル

### Phase 3完了時

- ✅ グループダッシュボード
- ✅ クロスオーガナイゼーションアクセス
- ✅ データ共有設定UI

### MVP完了時

- ✅ 3階層以上の組織構造に対応
- ✅ M&A対応ウィザード
- ✅ グループ統合レポート
- ✅ エンタープライズ顧客1社獲得

---

## 📚 参考資料

### 技術リソース

- [PostgreSQL ltree extension](https://www.postgresql.org/docs/current/ltree.html) - 階層データ管理
- [Closure Table Pattern](https://www.slideshare.net/billkarwin/models-for-hierarchical-data) - 階層データモデル
- [Multi-tenant SaaS Patterns](https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/multi-tenant-saas-architecture.html)

### ビジネスリソース

- ホールディングスカンパニー事例研究
- M&Aにおけるシステム統合のベストプラクティス
- グループ企業のデータガバナンス

---

## 💡 将来の拡張性

### Phase 4以降の可能性

1. **マルチリージョン対応**
   - グローバル展開する企業グループ
   - 地域ごとのコンプライアンス対応

2. **パートナーエコシステム**
   - グループ外企業との連携
   - サプライチェーン統合

3. **AI活用**
   - グループ横断のインサイト
   - 最適な組織配置の提案
   - M&A候補企業の推薦

---

**更新日**: 2025-11-24
**バージョン**: 1.0
**承認者**: プロダクトオーナー
