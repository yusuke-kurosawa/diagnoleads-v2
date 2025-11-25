'use client';

import { useTranslations } from 'next-intl';

/**
 * 個人設定ページ
 * TODO: 実際の設定フォームを実装
 */
export default function SettingsPage() {
  const t = useTranslations('settings.profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="space-y-6">
        {/* プロフィール設定 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('profileSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder={t('emailPlaceholder')}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('emailHelp')}
              </p>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {t('save')}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('passwordSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('currentPasswordLabel')}
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('newPasswordLabel')}
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmPasswordLabel')}
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
              {t('changePassword')}
            </button>
          </div>
        </div>

        {/* アカウント削除 */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            {t('deleteAccountSection')}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('deleteAccountWarning')}
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium">
            {t('deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
