'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Divider, Text, Title } from '@/components/ui/metric';
import { authClient } from '@/lib/auth/client';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Key,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * 個人設定ページ - TailAdmin Style
 */
export default function SettingsPage() {
  const t = useTranslations('settings.profile');
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(value !== user?.name);
  };

  const handleReset = () => {
    if (user?.name) {
      setName(user.name);
      setHasChanges(false);
    }
  };

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
      setHasChanges(false);
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
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <Card className="p-6">
            <div className="space-y-6">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <Text className="mt-1">
            {t('description') || 'Manage your personal account settings'}
          </Text>
        </div>

        {/* Profile Card */}
        <Card decoration="top" decorationColor="blue">
          <div className="p-6">
            {/* Profile Header */}
            <div className="flex items-start justify-between pb-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 rounded-xl flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <Title>{user?.name || 'User'}</Title>
                  <div className="flex gap-2 mt-1">
                    <Badge color="blue">{user?.email}</Badge>
                    {user?.emailVerified ? (
                      <Badge color="emerald">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('verified')}
                      </Badge>
                    ) : (
                      <Badge color="yellow">{t('notVerified')}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-6 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {t('profileSection')}
              </h2>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  {t('nameLabel')}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  disabled={isSaving}
                />
              </div>

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {t('emailLabel')}
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
                <Text className="text-xs">{t('emailHelp')}</Text>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <Text className="text-xs">{t('emailVerified')}</Text>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user?.emailVerified ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t('verified')}
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {t('notVerified')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Text className="text-xs">{t('createdAt')}</Text>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <Divider />
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={!hasChanges || isSaving}
                  className="flex-1"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? t('saving') : t('save')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('reset') || 'Reset'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Password Card */}
        <Card decoration="top" decorationColor="violet">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              {t('passwordSection')}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  {t('currentPasswordLabel')}
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  {t('newPasswordLabel')}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  {t('confirmPasswordLabel')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword || !currentPassword || !newPassword || !confirmPassword
                }
                className="w-full"
                size="lg"
              >
                <Key className="h-4 w-4 mr-2" />
                {isChangingPassword ? t('changingPassword') : t('changePassword')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/50">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteAccountSection')}
            </h2>
            <Text>{t('deleteAccountWarning')}</Text>
            <Button variant="destructive" size="lg">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('deleteAccount')}
            </Button>
          </div>
        </Card>

        {/* Info Callout */}
        <Callout title={t('hintsTitle') || 'Tips'} icon={CheckCircle} color="blue">
          <ul className="space-y-1 list-disc list-inside mt-2">
            <li>{t('hintProfile') || 'Your name will be displayed to other members'}</li>
            <li>{t('hintPassword') || 'Use a strong password with at least 8 characters'}</li>
            <li>{t('hintDelete') || 'Deleting your account is permanent and cannot be undone'}</li>
          </ul>
        </Callout>
      </div>
    </div>
  );
}
