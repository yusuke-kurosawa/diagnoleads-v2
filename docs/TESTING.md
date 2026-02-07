# テスト戦略ガイド

> DiagnoLeads v2 のテスト原則・ルールを定義

---

## テストピラミッド

```
        ┌───────────┐
        │   E2E     │  少量・高コスト・遅い
        │  Tests    │  クリティカルパスのみ
        ├───────────┤
        │Integration│  中量・中コスト・中速
        │  Tests    │  モジュール連携
        ├───────────┤
        │   Unit    │  大量・低コスト・高速
        │  Tests    │  ビジネスロジック
        └───────────┘
```

| 種別 | 割合目安 | 実行時間 | 外部依存 |
|------|---------|---------|---------|
| Unit | 70% | 数秒 | なし |
| Integration | 20% | 数十秒 | モック |
| E2E | 10% | 数分 | 実環境 |

---

## 1. Unit Tests

### 定義
**外部依存なし**で実行可能な、単一関数・モジュールのテスト

### 命名規則
```
*.test.ts
```

### 対象
- 純粋関数（入力→出力が決定的）
- バリデーション・スキーマ
- 型定義・ユーティリティ
- ビジネスロジック（計算・変換）
- Reactコンポーネント（レンダリング・イベント）

### 原則

#### 1.1 AAA パターン
```typescript
it('should calculate lead score correctly', () => {
  // Arrange（準備）
  const lead = { responses: [{ score: 80 }, { score: 60 }] };
  
  // Act（実行）
  const result = calculateLeadScore(lead);
  
  // Assert（検証）
  expect(result).toBe(70);
});
```

#### 1.2 単一責任
- 1テスト = 1検証項目
- テスト名で何を検証しているか明確に

```typescript
// ❌ Bad: 複数の検証
it('should validate email', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
  expect(isValidEmail('')).toBe(false);
});

// ✅ Good: 単一の検証
it('should return true for valid email', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
});

it('should return false for invalid format', () => {
  expect(isValidEmail('invalid')).toBe(false);
});

it('should return false for empty string', () => {
  expect(isValidEmail('')).toBe(false);
});
```

#### 1.3 外部依存の排除
```typescript
// ❌ Bad: 外部依存あり
import { db } from '@/lib/db/client';

it('should get user', async () => {
  const user = await db.query.users.findFirst(); // DB接続必要
});

// ✅ Good: 純粋関数テスト
it('should format user name', () => {
  const result = formatUserName({ firstName: '太郎', lastName: '田中' });
  expect(result).toBe('田中 太郎');
});
```

#### 1.4 テストデータの独立性
```typescript
// ❌ Bad: 共有状態
let counter = 0;
it('test 1', () => { counter++; expect(counter).toBe(1); });
it('test 2', () => { counter++; expect(counter).toBe(2); }); // 順序依存

// ✅ Good: 独立したテスト
it('test 1', () => {
  const counter = createCounter();
  counter.increment();
  expect(counter.value).toBe(1);
});
```

### カバレッジ目標
- **ビジネスロジック**: 80%+
- **バリデーション**: 100%
- **ユーティリティ**: 100%

---

## 2. Integration Tests

### 定義
**モックを使用**して、複数モジュールの連携をテスト

### 命名規則
```
*.integration.ts
```

### 対象
- DB操作（Drizzle ORM モック）
- Cache操作（Redis モック）
- Email送信（Resend モック）
- 外部API連携（Anthropic/OpenAI モック）
- tRPC routers（コンテキストモック）
- 認証フロー（better-auth モック）

### 原則

#### 2.1 モック境界の明確化
```typescript
// モックする外部依存を明示
vi.mock('@/lib/db/client', () => ({
  db: {
    query: { users: { findFirst: vi.fn() } },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

vi.mock('@/lib/email/client', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'email-123' }),
}));
```

#### 2.2 実際の関数をテスト
```typescript
// ✅ Good: 実際の関数をインポートしてテスト
import { createUser } from '@/lib/features/users/service';

it('should create user and send welcome email', async () => {
  const mockDb = vi.mocked(db);
  const mockSendEmail = vi.mocked(sendEmail);
  
  mockDb.returning.mockResolvedValue([{ id: 'user-123' }]);
  
  const result = await createUser({ email: 'test@example.com' });
  
  expect(mockDb.insert).toHaveBeenCalled();
  expect(mockSendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'test@example.com' })
  );
  expect(result.id).toBe('user-123');
});
```

#### 2.3 エラーハンドリングの検証
```typescript
it('should handle database error', async () => {
  const mockDb = vi.mocked(db);
  mockDb.returning.mockRejectedValue(new Error('Connection failed'));
  
  await expect(createUser({ email: 'test@example.com' }))
    .rejects.toThrow('Connection failed');
});

it('should rollback on partial failure', async () => {
  // トランザクションのロールバック検証
});
```

#### 2.4 beforeEach でモックリセット
```typescript
describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  // tests...
});
```

### カバレッジ目標
- **API routers**: 70%+
- **主要サービス**: 80%+
- **エラーハンドリング**: 100%

---

## 3. E2E Tests

### 定義
**実環境**で、ユーザー視点のフロー全体をテスト

### 命名規則
```
*.spec.ts
```

### 対象
- 認証フロー（ログイン/登録/パスワードリセット）
- 診断フォーム送信
- リード管理（CRUD）
- 組織管理・切り替え
- ダッシュボード表示

### 原則

#### 3.1 ユーザー視点で記述
```typescript
// ❌ Bad: 実装詳細に依存
test('should set localStorage token', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('token', 'xxx'));
});

// ✅ Good: ユーザー操作で記述
test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('ダッシュボード');
});
```

#### 3.2 Page Object Model (POM)
```typescript
// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// tests/auth.spec.ts
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  
  await expect(page).toHaveURL('/dashboard');
});
```

#### 3.3 テストデータの独立性
```typescript
test.beforeEach(async ({ page }) => {
  // テスト用ユーザーを作成
  await createTestUser({ email: `test-${Date.now()}@example.com` });
});

test.afterEach(async () => {
  // テストデータをクリーンアップ
  await cleanupTestData();
});
```

#### 3.4 待機戦略
```typescript
// ❌ Bad: 固定待機
await page.waitForTimeout(3000);

// ✅ Good: 要素の出現を待機
await page.waitForSelector('[data-testid="dashboard"]');
await expect(page.locator('h1')).toBeVisible();
```

#### 3.5 クリティカルパスのみ
```typescript
// E2Eでテストすべき: ユーザーの主要フロー
test('complete diagnostic form submission flow', async ({ page }) => {
  // 1. フォームにアクセス
  // 2. 質問に回答
  // 3. 送信
  // 4. 結果確認
  // 5. リード作成確認
});

// E2Eで不要: 細かいバリデーション（Unitでカバー）
```

### カバレッジ目標
- **クリティカルパス**: 100%
- **主要ユーザーフロー**: 100%
- **エッジケース**: Unitでカバー

---

## テスト環境

### Unit / Integration
```bash
bun run test              # 全テスト
bun run test:coverage     # カバレッジ付き
bun run test -- --watch   # ウォッチモード
```

### E2E
```bash
# 環境起動
docker compose up -d

# テスト実行
bun run test:e2e

# UIモードで実行
bun run test:e2e -- --ui
```

---

## CI/CD 統合

### 実行タイミング

| 種別 | PR | main | release |
|------|-----|------|---------|
| Unit | ✅ | ✅ | ✅ |
| Integration | ✅ | ✅ | ✅ |
| E2E | ❌ | ✅ | ✅ |

### 失敗時の対応

```yaml
# Unit/Integration 失敗 → PRマージ不可
# E2E 失敗 → リリース不可
```

---

## ベストプラクティス

### DO ✅
- テスト名は「should + 期待動作」で記述
- 1テスト1検証を守る
- テストデータは各テストで独立
- モックは最小限に
- エラーケースも必ずテスト

### DON'T ❌
- 実装詳細に依存したテスト
- 順序依存のテスト
- 外部サービスへの実接続（Unit/Integration）
- sleep/timeout での待機（E2E）
- スナップショットの過度な使用

---

## 関連ドキュメント

- [SprintPath](./SPRINTPATH.md) - アジャイル開発フレームワーク
- [CONTRIBUTING](../CONTRIBUTING.md) - 開発者ガイド
- [vitest.config.ts](../vitest.config.ts) - Vitest設定
- [playwright.config.ts](../playwright.config.ts) - Playwright設定

---

*最終更新: 2026-02-07*
