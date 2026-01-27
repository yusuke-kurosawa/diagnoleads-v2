'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type ResetPasswordFormValues = {
  email: string;
};

export function ResetPasswordForm() {
  const t = useTranslations('settings.auth.resetPassword');
  const tv = useTranslations('settings.auth.validation');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPasswordSchema = z.object({
    email: z.string().email(tv('emailInvalid')),
  });

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      await (authClient as any).forgetPassword({
        email: data.email,
        redirectTo: '/reset-password/confirm',
      });

      toast.success(t('successToast'));
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(t('errorToast'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 text-lg font-semibold">{t('successTitle')}</div>
        <p className="text-sm text-gray-600">{t('successMessage')}</p>
        <p className="text-xs text-gray-500">{t('successNote')}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>{t('description')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('submittingButton') : t('submitButton')}
        </Button>
      </form>
    </Form>
  );
}
