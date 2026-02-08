'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type ResetPasswordConfirmValues = {
  newPassword: string;
  confirmPassword: string;
};

function ResetPasswordConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('settings.auth.resetPasswordConfirm');
  const tv = useTranslations('settings.auth.validation');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');
  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError === 'INVALID_TOKEN' || urlError === 'invalid_token') {
      setError(t('invalidToken'));
    }
  }, [urlError, t]);

  const resetPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, tv('passwordMin'))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, tv('passwordComplexity')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: tv('passwordMismatch'),
      path: ['confirmPassword'],
    });

  const form = useForm<ResetPasswordConfirmValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordConfirmValues) {
    if (!token) {
      setError(t('missingToken'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: data.newPassword,
        token,
      });

      if (result.error) {
        const errorCode = result.error.code;
        if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
          setError(t('invalidToken'));
        } else {
          toast.error(t('errorToast'));
        }
        return;
      }

      setIsSuccess(true);
      toast.success(t('successToast'));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password confirm error:', error);
      toast.error(t('errorToast'));
    } finally {
      setIsLoading(false);
    }
  }

  // Error state (invalid/expired token)
  if (error) {
    return (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">{t('errorTitle')}</div>
          <p className="text-sm text-gray-600">{error}</p>
          <Link
            href="/reset-password"
            className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center space-y-4">
          <div className="text-green-600 text-lg font-semibold">{t('successTitle')}</div>
          <p className="text-sm text-gray-600">{t('successMessage')}</p>
          <Link
            href="/login"
            className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  // No token provided
  if (!token) {
    return (
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">{t('errorTitle')}</div>
          <p className="text-sm text-gray-600">{t('missingToken')}</p>
          <Link
            href="/reset-password"
            className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('requestNewLink')}
          </Link>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('title')}</h2>
      <p className="text-center text-sm text-gray-600 mb-6">{t('description')}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('newPasswordLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t('newPasswordPlaceholder')}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('submittingButton') : t('submitButton')}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}
