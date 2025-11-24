# Components

再利用可能な React コンポーネントディレクトリ

## ディレクトリ構造

- **`ui/`** - 基本的な UI コンポーネント (shadcn/ui)
  - Button, Input, Card, Dialog など
  - shadcn/ui CLI で追加されたコンポーネント

- **`auth/`** - 認証関連コンポーネント
  - LoginForm, SignupForm, PasswordResetForm
  - AuthGuard, SessionProvider

- **`dashboard/`** - ダッシュボード専用コンポーネント
  - StatsCard, RecentActivity, LeadTable
  - OrganizationSwitcher, UserMenu

- **`common/`** - 共通コンポーネント
  - Header, Footer, Navigation
  - Loading, Error, Empty states

## 使用方法

```tsx
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/LoginForm';

export default function Page() {
  return (
    <div>
      <LoginForm />
      <Button>ログイン</Button>
    </div>
  );
}
```

## コンポーネント追加

### shadcn/ui コンポーネント

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

### カスタムコンポーネント

適切なディレクトリに作成し、`index.ts` でエクスポートしてください。
