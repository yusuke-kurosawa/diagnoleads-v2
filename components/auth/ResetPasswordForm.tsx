'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth/client';
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
import { toast } from 'sonner';

const resetPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    try {
      await authClient.forgetPassword({
        email: data.email,
        redirectTo: '/reset-password/confirm',
      });

      toast.success('パスワードリセットメールを送信しました');
      setIsSuccess(true);
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(
        'パスワードリセットメールの送信に失敗しました。メールアドレスを確認してください。'
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 text-lg font-semibold">
          パスワードリセットメールを送信しました
        </div>
        <p className="text-sm text-gray-600">
          メールに記載されたリンクをクリックして、パスワードをリセットしてください。
        </p>
        <p className="text-xs text-gray-500">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
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
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                登録されているメールアドレスにパスワードリセット用のリンクを送信します。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '送信中...' : 'リセットメールを送信'}
        </Button>
      </form>
    </Form>
  );
}
