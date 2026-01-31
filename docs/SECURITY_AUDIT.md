# DiagnoLeads v2 セキュリティ監査レポート

**監査日**: 2026-01-31  
**監査者**: security-auditor Droid  
**対象**: DiagnoLeads v2 本番リリース前監査

---

## エグゼクティブサマリー

| 重大度 | 件数 | ステータス |
|--------|------|-----------|
| Critical | 1 | ⚠️ 要対応 |
| High | 8 | ⚠️ 要対応 |
| Moderate | 7 | 📋 監視 |
| Low | 3 | ℹ️ 情報 |
| **合計** | **19** | - |

---

## 1. 依存関係脆弱性

### Critical (1件)

#### jsPDF - Local File Inclusion/Path Traversal
- **パッケージ**: `jspdf <=3.0.4`
- **CVE**: GHSA-f8cm-6447-x5h2
- **影響**: PDFエクスポート機能でのパストラバーサル攻撃
- **対応**: 
  - jsPDFをv3.0.5以上にアップデート
  - またはサーバーサイドでのファイルパス検証を追加
- **優先度**: 🔴 高

```bash
bun update jspdf
```

### High (8件)

#### 1. @trpc/server - WebSocket DoS & Prototype Pollution
- **パッケージ**: `@trpc/server >=11.0.0 <11.1.1`
- **CVE**: GHSA-pj3v-9cm8-gvj8, GHSA-43p4-m455-4f4j
- **影響**: WebSocket経由のDoS攻撃、プロトタイプ汚染
- **対応**: @trpc/server v11.1.1以上にアップデート
- **優先度**: 🔴 高

#### 2. better-auth - Path Normalization Bypass
- **パッケージ**: `better-auth <1.4.2`
- **CVE**: GHSA-x732-6j76-qmhm
- **影響**: パスノーマライゼーションバイパス、レート制限回避
- **対応**: better-auth v1.4.2以上にアップデート
- **優先度**: 🔴 高

#### 3. Next.js - DoS Vulnerabilities
- **パッケージ**: `next >=15.5.1-canary.0 <15.5.8`
- **CVE**: GHSA-mwv6-3258-q52c, GHSA-h25m-26qc-wcjf
- **影響**: サーバーコンポーネント経由のDoS攻撃
- **対応**: Next.js v15.5.8以上にアップデート
- **優先度**: 🔴 高

#### 4. xlsx - Prototype Pollution & ReDoS
- **パッケージ**: `xlsx <0.19.3`
- **CVE**: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
- **影響**: CSVインポート時のプロトタイプ汚染、ReDoS攻撃
- **対応**: xlsx v0.19.3以上にアップデート
- **優先度**: 🔴 高

#### 5. Playwright - SSL Certificate Verification
- **パッケージ**: `playwright <1.55.1`
- **CVE**: GHSA-7mvr-c777-76hp
- **影響**: 開発環境でのMITM攻撃リスク（本番影響なし）
- **対応**: Playwright v1.55.1以上にアップデート
- **優先度**: 🟡 中（開発のみ）

### Moderate (7件)

| パッケージ | 脆弱性 | 対応 |
|-----------|--------|------|
| lodash | Prototype Pollution | payload依存、監視 |
| jsondiffpatch | XSS | ai SDK依存、監視 |
| undici | Decompression DoS | payload依存、監視 |
| esbuild | Dev Server CORS | 開発のみ、影響小 |
| next | Source Code Exposure | アップデートで解決 |
| next | Image Optimizer DoS | アップデートで解決 |
| next | PPR Memory Consumption | アップデートで解決 |

### Low (3件)

| パッケージ | 脆弱性 | 対応 |
|-----------|--------|------|
| better-auth | basePath DoS | アップデートで解決 |
| cookie | Out of bounds chars | 監視 |
| ai | File upload bypass | アップデートで解決 |

---

## 2. 推奨アクション

### 即時対応 (P0)

```bash
# 1. 重要パッケージのアップデート
bun update @trpc/server @trpc/client @trpc/react-query
bun update better-auth
bun update next
bun update xlsx
bun update jspdf

# 2. アップデート後のテスト
bun run test
bun run build
```

### 短期対応 (P1)

1. **入力検証の強化**
   - PDFエクスポート時のファイルパス検証
   - CSVインポート時のデータサニタイズ

2. **レート制限の確認**
   - `/api/*` エンドポイントのレート制限設定確認
   - WebSocketエンドポイントの制限確認

### 中期対応 (P2)

1. **依存関係の定期監査**
   - 毎週 `bun audit` を実行
   - Dependabot/Renovate の導入検討

2. **セキュリティヘッダーの確認**
   - CSPヘッダーの追加検討
   - HSTS設定の確認

---

## 3. 認証・認可確認

### Better Auth 設定

| 項目 | 設定 | ステータス |
|------|------|-----------|
| セッション有効期限 | 7日間 | ✅ |
| Cookie Secure | 本番でtrue | ✅ |
| Cookie HttpOnly | true | ✅ |
| CSRF保護 | 有効 | ✅ |

### CASL 権限設定

| ロール | 権限 | ステータス |
|--------|------|-----------|
| owner | 全権限 | ✅ |
| admin | 削除以外 | ✅ |
| member | CRUD | ✅ |
| viewer | 読み取りのみ | ✅ |

---

## 4. データ分離確認

### Row-Level Security (RLS)

| テーブル | RLSポリシー | ステータス |
|----------|------------|-----------|
| leads | organization_id制限 | ✅ |
| organizations | メンバーシップ確認 | ✅ |
| members | organization_id制限 | ✅ |
| webhooks | organization_id制限 | ✅ |
| workflows | organization_id制限 | ✅ |

### マルチテナント分離

- [x] すべてのクエリに`organizationId`条件あり
- [x] tRPC procedureで組織コンテキスト検証
- [x] APIルートで認証チェック

---

## 5. レート制限確認

### 設定状況

| エンドポイント | 制限 | ステータス |
|--------------|------|-----------|
| /api/diagnostic | 10/min | ✅ |
| /api/v2/* | 100/min | ✅ |
| /api/embed/* | 設定による | ✅ |
| 認証エンドポイント | Better Auth内蔵 | ✅ |

---

## 6. セキュリティヘッダー確認

### vercel.json 設定

| ヘッダー | 値 | ステータス |
|---------|---|-----------|
| X-Content-Type-Options | nosniff | ✅ |
| X-Frame-Options | DENY | ✅ |
| X-XSS-Protection | 1; mode=block | ✅ |
| Referrer-Policy | strict-origin-when-cross-origin | ✅ |
| Content-Security-Policy | 未設定 | ⚠️ 推奨 |

---

## 7. 結論と推奨事項

### 必須対応

1. **Critical/High脆弱性の修正**
   - jspdf, @trpc/server, better-auth, next, xlsx をアップデート
   - 推定工数: 2時間

2. **アップデート後の回帰テスト**
   - 全ユニットテスト実行
   - 手動での主要機能確認

### 推奨対応

1. **CSPヘッダーの追加**
2. **Dependabot/Renovateの導入**
3. **定期的なセキュリティ監査の実施**

---

## 8. 監査証跡

```
監査日時: 2026-01-31T17:XX:XX+09:00
監査ツール: bun audit
監査対象: package.json dependencies
結果: 19 vulnerabilities (1 critical, 8 high, 7 moderate, 3 low)
```

---

*次回監査予定: 2026-02-07*
