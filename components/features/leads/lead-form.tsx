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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead } from '@/lib/db/schema';
import { createLeadSchema } from '@/lib/features/leads/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

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
  const t = useTranslations('leads');
  const tStatus = useTranslations('status');
  const tCommon = useTranslations('common');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: lead?.email ?? '',
      name: lead?.name ?? '',
      company: lead?.company ?? '',
      phone: lead?.phone ?? '',
      status: (lead?.status as 'new' | 'contacted' | 'qualified' | 'converted') ?? 'new',
      score: lead?.score ?? undefined,
      source: (lead?.source as 'website' | 'embed' | 'api') ?? undefined,
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
              <FormLabel>{t('email')} *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@example.com" {...field} />
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
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>{t('company')}</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
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
              <FormLabel>{t('phone')}</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} />
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
              <FormLabel>{t('status')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('status')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="new">{tStatus('new')}</SelectItem>
                  <SelectItem value="contacted">{tStatus('contacted')}</SelectItem>
                  <SelectItem value="qualified">{tStatus('qualified')}</SelectItem>
                  <SelectItem value="converted">{tStatus('converted')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('score')} (0-100)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tCommon('loading') : lead ? tCommon('update') : tCommon('create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
