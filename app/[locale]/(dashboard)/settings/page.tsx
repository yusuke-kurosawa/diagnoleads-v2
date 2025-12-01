'use client';

import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 個人設定ページ
 */
export default function SettingsPage() {
  const t = useTranslations('settings.profile');
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const result = await authClient.updateUser({
        name: name.trim(),
      });

      if (result.error) {
        toast.error(t('saveError'));
        return;
      }

      toast.success(t('saveSuccess'));
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      toast.error(t('currentPasswordRequired'));
      return;
    }
    if (!newPassword) {
      toast.error(t('newPasswordRequired'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      // Use $fetch to call the change-password API endpoint
      const result = await authClient.$fetch<{ user?: unknown; error?: { message?: string } }>(
        '/change-password',
        {
          method: 'POST',
          body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: false,
          },
        }
      );

      if (result.error) {
        const errorMessage = result.error.message?.toLowerCase() || '';
        if (
          errorMessage.includes('incorrect') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('wrong')
        ) {
          toast.error(t('currentPasswordIncorrect'));
        } else {
          toast.error(t('passwordChangeError'));
        }
        return;
      }

      toast.success(t('passwordChangeSuccess'));
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(t('passwordChangeError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('title')}</h1>

      <div className="space-y-6">
        {/* プロフィール設定 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('profileSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('emailHelp')}</p>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('accountInfo')}
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('emailVerified')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user?.emailVerified ? (
                      <span className="text-green-600 dark:text-green-400">{t('verified')}</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {t('notVerified')}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('createdAt')}</dt>
                  <dd className="text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('passwordSection')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('currentPasswordLabel')}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isChangingPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newPasswordLabel')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isChangingPassword}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('confirmPasswordLabel')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isChangingPassword}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm font-medium disabled:opacity-50"
            >
              {isChangingPassword ? t('changingPassword') : t('changePassword')}
            </button>
          </div>
        </div>

        {/* アカウント削除 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-red-200 dark:border-red-900/50">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            {t('deleteAccountSection')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
