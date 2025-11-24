'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { createLeadSchema, leadStatusEnum } from '@/lib/features/leads/types';
import type { Lead } from '@/lib/db/schema';

// Form schema without organizationId (will be added by parent component)
const formSchema = createLeadSchema.omit({ organizationId: true });
type FormValues = z.infer<typeof formSchema>;

interface LeadFormProps {
  lead?: Lead;
  onSubmit: (data: FormValues) => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * Lead form component
 * Used for creating and editing leads
 */
export function LeadForm({ lead, onSubmit, isLoading }: LeadFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: lead?.email ?? '',
      name: lead?.name ?? '',
      company: lead?.company ?? '',
      phone: lead?.phone ?? '',
      status: lead?.status ?? 'new',
      score: lead?.score ?? undefined,
      source: lead?.source ?? undefined,
      responses: lead?.responses ?? {},
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input placeholder="山田 太郎" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>会社名</FormLabel>
              <FormControl>
                <Input placeholder="株式会社サンプル" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <FormControl>
                <Input placeholder="03-1234-5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ステータス</FormLabel>
              <FormControl>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...field}
                >
                  <option value="new">新規</option>
                  <option value="contacted">連絡済</option>
                  <option value="qualified">見込</option>
                  <option value="converted">成約</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>スコア (0-100)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '保存中...' : lead ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
