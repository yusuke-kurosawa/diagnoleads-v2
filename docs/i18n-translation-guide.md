# 翻訳追加ガイド

**対象**: DiagnoLeads v2 開発者
**更新日**: 2025-11-25

このガイドでは、DiagnoLeads v2に新しい翻訳を追加する方法を説明します。

---

## 📚 目次

1. [基本概念](#基本概念)
2. [翻訳ファイルの構造](#翻訳ファイルの構造)
3. [翻訳の追加手順](#翻訳の追加手順)
4. [コンポーネントでの使用方法](#コンポーネントでの使用方法)
5. [エラーメッセージの追加](#エラーメッセージの追加)
6. [Zodバリデーションの多言語化](#zodバリデーションの多言語化)
7. [翻訳キー命名規則](#翻訳キー命名規則)
8. [ベストプラクティス](#ベストプラクティス)
9. [トラブルシューティング](#トラブルシューティング)

---

## 基本概念

### 使用しているi18nライブラリ

- **next-intl 3.27+**: Next.jsの多言語化ライブラリ
- **date-fns**: 日付フォーマットのロケール対応

### サポートされている言語

- **日本語** (`ja`): デフォルト言語
- **英語** (`en`): セカンダリ言語

### ディレクトリ構造

```
diagnoleads-v2/
├── locales/              # 翻訳ファイル
│   ├── ja/
│   │   ├── common.json   # 共通翻訳（156キー）
│   │   └── errors.json   # エラーメッセージ（67キー）
│   └── en/
│       ├── common.json   # 英語翻訳（156キー）
│       └── errors.json   # 英語エラーメッセージ（67キー）
│
├── lib/messages/         # エラーメッセージ管理
│   ├── error-mapper.ts   # エラーコードマッピング
│   └── validation.ts     # Zodバリデーション多言語化
│
└── scripts/              # i18nチェックスクリプト
    ├── check-i18n.ts                  # 翻訳完全性チェック
    └── check-hardcoded-strings.ts     # ハードコーディング検出
```

---

## 翻訳ファイルの構造

### common.json の構造

```json
{
  "navigation": {
    "dashboard": "ダッシュボード",
    "leads": "リード管理",
    "settings": "設定"
  },
  "dashboard": {
    "title": "ダッシュボード",
    "stats": {
      "totalLeads": "総リード数",
      "newLeads": "今月の新規リード"
    }
  },
  "leads": {
    "title": "リード管理",
    "create": "リードを作成",
    "table": {
      "name": "名前",
      "email": "メールアドレス"
    }
  },
  "status": {
    "new": "新規",
    "contacted": "連絡済",
    "qualified": "見込",
    "converted": "成約"
  }
}
```

### errors.json の構造

```json
{
  "api": {
    "400": "リクエストが正しくありません",
    "401": "認証が必要です",
    "404": "リソースが見つかりません"
  },
  "validation": {
    "required": "{field}は必須です",
    "email": "有効なメールアドレスを入力してください",
    "min": "{field}は{min}文字以上で入力してください"
  },
  "lead": {
    "notFound": "リードが見つかりません",
    "createFailed": "リードの作成に失敗しました"
  },
  "toast": {
    "lead": {
      "created": "リードを作成しました",
      "updated": "リードを更新しました",
      "deleted": "リードを削除しました"
    }
  }
}
```

---

## 翻訳の追加手順

### ステップ1: 翻訳キーの設計

まず、追加する機能に必要な翻訳キーを設計します。

**良い例**:
```
settings.profile.title
settings.profile.name
settings.profile.email
settings.profile.save
```

**悪い例**:
```
profileTitle  (ネストなし)
settingsPTitle  (略語使用)
settings_profile_title  (スネークケース)
```

### ステップ2: 日本語翻訳の追加

`locales/ja/common.json` に翻訳を追加します。

```json
{
  "settings": {
    "profile": {
      "title": "プロフィール設定",
      "name": "名前",
      "email": "メールアドレス",
      "save": "保存する",
      "saveSuccess": "プロフィールを更新しました"
    }
  }
}
```

### ステップ3: 英語翻訳の追加

`locales/en/common.json` に対応する英語翻訳を追加します。

```json
{
  "settings": {
    "profile": {
      "title": "Profile Settings",
      "name": "Name",
      "email": "Email",
      "save": "Save",
      "saveSuccess": "Profile updated successfully"
    }
  }
}
```

### ステップ4: 翻訳の検証

翻訳完全性チェックスクリプトを実行します。

```bash
pnpm i18n:check
```

✅ **成功例**:
```
🎉 All translations are complete and consistent!
```

❌ **エラー例**:
```
❌ Missing keys in locales/en/common.json:
   - settings.profile.save
```

→ 英語翻訳に `settings.profile.save` を追加する必要があります。

---

## コンポーネントでの使用方法

### 1. 基本的な翻訳

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function ProfileSettings() {
  const t = useTranslations('settings.profile');

  return (
    <div>
      <h1>{t('title')}</h1>
      <label>{t('name')}</label>
      <input type="text" />
      <button>{t('save')}</button>
    </div>
  );
}
```

### 2. パラメータ付き翻訳

**翻訳ファイル** (`locales/ja/common.json`):
```json
{
  "settings": {
    "profile": {
      "greeting": "こんにちは、{name}さん",
      "lastLogin": "最終ログイン: {date}"
    }
  }
}
```

**コンポーネント**:
```tsx
const t = useTranslations('settings.profile');

return (
  <div>
    <p>{t('greeting', { name: user.name })}</p>
    <p>{t('lastLogin', { date: formatDate(user.lastLogin) })}</p>
  </div>
);
```

### 3. 複数の名前空間

```tsx
const tSettings = useTranslations('settings');
const tCommon = useTranslations('common');
const tErrors = useTranslations('errors');

return (
  <div>
    <h1>{tSettings('title')}</h1>
    <button>{tCommon('buttons.save')}</button>
    {error && <p className="error">{tErrors('api.500')}</p>}
  </div>
);
```

### 4. サーバーコンポーネント

```tsx
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage() {
  const t = await getTranslations('settings.profile');

  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
}
```

---

## エラーメッセージの追加

### ステップ1: エラーコードの定義

`lib/messages/error-mapper.ts` にエラーコードを追加します。

```typescript
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'LEAD_NOT_FOUND'
  | 'ORGANIZATION_NOT_FOUND'  // ← 新しいエラーコード
  | ...;

export const errorMessageMap: Record<ErrorCode, string> = {
  AUTH_REQUIRED: 'auth.unauthorized',
  FORBIDDEN: 'api.403',
  LEAD_NOT_FOUND: 'lead.notFound',
  ORGANIZATION_NOT_FOUND: 'organization.notFound',  // ← 新しいマッピング
  // ...
};
```

### ステップ2: エラーメッセージ翻訳の追加

**日本語** (`locales/ja/errors.json`):
```json
{
  "organization": {
    "notFound": "組織が見つかりません",
    "createFailed": "組織の作成に失敗しました"
  }
}
```

**英語** (`locales/en/errors.json`):
```json
{
  "organization": {
    "notFound": "Organization not found",
    "createFailed": "Failed to create organization"
  }
}
```

### ステップ3: エラーメッセージの使用

```tsx
import { useTranslations } from 'next-intl';
import { getLocalizedErrorMessage } from '@/lib/messages/error-mapper';

function OrganizationSettings() {
  const tErrors = useTranslations('errors');

  try {
    // API呼び出し
    await updateOrganization(data);
  } catch (error) {
    const errorResponse = await mapFetchErrorToErrorResponse(error);
    const message = getLocalizedErrorMessage(errorResponse, tErrors);
    toast.error(message);  // 多言語化されたエラーメッセージ
  }
}
```

---

## Zodバリデーションの多言語化

### ステップ1: Zodスキーマの定義

```typescript
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(18),
});
```

### ステップ2: エラーメッセージ翻訳の追加

**日本語** (`locales/ja/errors.json`):
```json
{
  "validation": {
    "required": "{field}は必須です",
    "email": "有効なメールアドレスを入力してください",
    "min": "{field}は{min}文字以上で入力してください",
    "minNumber": "{field}は{min}以上である必要があります"
  }
}
```

**英語** (`locales/en/errors.json`):
```json
{
  "validation": {
    "required": "{field} is required",
    "email": "Please enter a valid email address",
    "min": "{field} must be at least {min} characters",
    "minNumber": "{field} must be at least {min}"
  }
}
```

### ステップ3: フィールド名翻訳の追加

**日本語** (`locales/ja/common.json`):
```json
{
  "fields": {
    "name": "名前",
    "email": "メールアドレス",
    "age": "年齢"
  }
}
```

**英語** (`locales/en/common.json`):
```json
{
  "fields": {
    "name": "Name",
    "email": "Email",
    "age": "Age"
  }
}
```

### ステップ4: Zodエラーマップの使用

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { createZodErrorMap } from '@/lib/messages/validation';
import { z } from 'zod';

export function ProfileForm() {
  const tErrors = useTranslations('errors');
  const tFields = useTranslations('fields');

  // Zodエラーマップを設定
  z.setErrorMap(createZodErrorMap(tErrors, tFields));

  // React Hook Formと統合
  const form = useForm({
    resolver: zodResolver(profileSchema),
  });

  // エラーメッセージは自動的に多言語化される
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && (
        <p className="error">{form.formState.errors.name.message}</p>
      )}
    </form>
  );
}
```

---

## 翻訳キー命名規則

### 基本ルール

1. **ケース**: キャメルケースを使用
2. **階層**: 最大4階層まで
3. **明確性**: キー名から内容が推測できること
4. **一貫性**: 同じパターンを繰り返し使用

### 推奨命名パターン

#### ページタイトル
```
<feature>.title
```
例: `dashboard.title`, `leads.title`, `settings.title`

#### ボタン
```
<feature>.actions.<action>
```
例: `leads.actions.create`, `leads.actions.delete`

#### テーブルヘッダー
```
<feature>.table.<column>
```
例: `leads.table.name`, `leads.table.email`

#### フォームラベル
```
<feature>.form.<field>
```
例: `leads.form.name`, `leads.form.company`

#### メッセージ
```
<feature>.messages.<type>
```
例: `leads.messages.createSuccess`, `leads.messages.deleteConfirm`

#### ステータス
```
status.<statusName>
```
例: `status.new`, `status.contacted`

### 例: リード管理機能

```json
{
  "leads": {
    "title": "リード管理",
    "description": "リードを管理します",
    "actions": {
      "create": "リードを作成",
      "edit": "編集",
      "delete": "削除"
    },
    "table": {
      "name": "名前",
      "email": "メールアドレス",
      "company": "会社名",
      "status": "ステータス"
    },
    "form": {
      "name": "名前",
      "email": "メールアドレス",
      "company": "会社名"
    },
    "messages": {
      "createSuccess": "リードを作成しました",
      "updateSuccess": "リードを更新しました",
      "deleteConfirm": "{name}を削除してもよろしいですか？"
    }
  }
}
```

---

## ベストプラクティス

### 1. 翻訳キーを使う（ハードコーディング禁止）

❌ **悪い例**:
```tsx
<h1>リード管理</h1>
<button>作成する</button>
```

✅ **良い例**:
```tsx
const t = useTranslations('leads');
<h1>{t('title')}</h1>
<button>{t('actions.create')}</button>
```

### 2. パラメータ付きメッセージを活用

❌ **悪い例**:
```tsx
// 翻訳ファイル
"deleteConfirmLead": "リードを削除してもよろしいですか？"
"deleteConfirmOrganization": "組織を削除してもよろしいですか？"

// コンポーネント
<p>{t('deleteConfirmLead')}</p>
```

✅ **良い例**:
```tsx
// 翻訳ファイル
"deleteConfirm": "{resource}を削除してもよろしいですか？"

// コンポーネント
<p>{t('deleteConfirm', { resource: t('leads.title') })}</p>
```

### 3. 名前空間を適切に分割

❌ **悪い例**:
```json
{
  "leadTitle": "リード管理",
  "leadCreate": "リードを作成",
  "leadTableName": "名前"
}
```

✅ **良い例**:
```json
{
  "leads": {
    "title": "リード管理",
    "actions": {
      "create": "リードを作成"
    },
    "table": {
      "name": "名前"
    }
  }
}
```

### 4. エラーハンドリングの一貫性

```tsx
// 一貫したエラーハンドリングパターン
const tErrors = useTranslations('errors');

try {
  await createLead(data);
  toast.success(tErrors('toast.lead.created'));
} catch (error) {
  const errorResponse = await mapFetchErrorToErrorResponse(error);
  const message = getLocalizedErrorMessage(errorResponse, tErrors);
  toast.error(message);
}
```

### 5. ロケール対応の日付フォーマット

```tsx
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

function DateDisplay({ date }: { date: Date }) {
  const locale = useLocale();
  const dateLocale = locale === 'ja' ? ja : enUS;

  return (
    <time>
      {format(date, locale === 'ja' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy', {
        locale: dateLocale,
      })}
    </time>
  );
}
```

---

## トラブルシューティング

### 問題1: 翻訳キーが表示される

**症状**:
```
画面に「leads.title」と表示される
```

**原因**:
- 翻訳ファイルに該当キーが存在しない
- useTranslations の名前空間が間違っている

**解決方法**:
```bash
# 翻訳完全性チェック
pnpm i18n:check

# 翻訳ファイルに不足しているキーを追加
```

### 問題2: 言語切り替えが機能しない

**症状**:
```
言語切り替えボタンを押しても日本語のまま
```

**原因**:
- ハードコーディングされたテキストが残っている
- useTranslations を使用していない

**解決方法**:
```bash
# ハードコーディング検出
pnpm i18n:check-hardcoded

# 検出されたハードコーディングをuseTranslations()に置き換える
```

### 問題3: パラメータが置換されない

**症状**:
```
"{name}を削除してもよろしいですか？"と表示される
```

**原因**:
- パラメータを渡していない

**解決方法**:
```tsx
// ❌ 悪い例
t('deleteConfirm')

// ✅ 良い例
t('deleteConfirm', { name: lead.name })
```

### 問題4: Zodエラーメッセージが翻訳されない

**症状**:
```
"String must contain at least 1 character(s)"と表示される
```

**原因**:
- Zodエラーマップが設定されていない

**解決方法**:
```tsx
import { createZodErrorMap } from '@/lib/messages/validation';
import { z } from 'zod';

// コンポーネント内で設定
const tErrors = useTranslations('errors');
const tFields = useTranslations('fields');
z.setErrorMap(createZodErrorMap(tErrors, tFields));
```

---

## 参考リンク

### 公式ドキュメント

- [next-intl Documentation](https://next-intl.dev/)
- [date-fns Documentation](https://date-fns.org/)
- [Zod Documentation](https://zod.dev/)

### プロジェクト内ドキュメント

- [README.md - i18nセクション](../README.md#-internationalization-i18n)
- [i18n動作確認テストレポート](./i18n-test-report.md)
- [IMPLEMENTATION_CHECKLIST.md - Phase 2.5](../IMPLEMENTATION_CHECKLIST.md)

### スクリプト

- `scripts/check-i18n.ts` - 翻訳完全性チェック
- `scripts/check-hardcoded-strings.ts` - ハードコーディング検出

---

**ガイド作成者**: Claude Code
**最終更新**: 2025-11-25
