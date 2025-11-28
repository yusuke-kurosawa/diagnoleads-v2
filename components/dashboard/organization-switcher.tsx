'use client';

import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/use-organization';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Organization Switcher Component
 *
 * Displays current organization and allows switching between organizations
 *
 * @example
 * ```tsx
 * <OrganizationSwitcher />
 * ```
 */
export function OrganizationSwitcher() {
  const router = useRouter();
  const { organizationId, organization, setOrganization, isLoading } = useOrganization();

  // Fetch user's organizations
  const { data: orgsData, isLoading: orgsLoading } = trpc.organizations.list.useQuery(
    {},
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const organizations = (orgsData?.organizations || []) as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  const currentOrg = organization || organizations.find((o) => o.id === organizationId);

  const utils = trpc.useContext();

  const handleSelectOrganization = async (orgId: string) => {
    const selected = organizations.find((o) => o.id === orgId);
    if (selected) {
      setOrganization(orgId, selected as any);

      // Clear all tRPC cache when switching organizations
      // This prevents data from previous organization from showing
      await utils.invalidate();

      // Navigate to dashboard of selected organization
      router.push(`/dashboard/${orgId}`);
    }
  };

  if (isLoading || orgsLoading) {
    return <div className="w-[200px] h-10 bg-gray-200 animate-pulse rounded-md" />;
  }

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/organizations/new')}
        className="w-[200px] justify-start"
      >
        <Plus className="mr-2 h-4 w-4" />
        組織を作成
      </Button>
    );
  }

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex items-center justify-between w-[200px] px-3 py-2 text-sm border rounded-md hover:bg-gray-50 cursor-pointer list-none">
          <div className="flex-1 truncate">{currentOrg?.name || '組織を選択'}</div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </summary>

        <div className="absolute z-50 mt-1 w-[200px] bg-white border rounded-md shadow-lg group-open:block hidden">
          <div className="p-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrganization(org.id)}
                className={cn(
                  'flex items-center w-full px-2 py-2 text-sm rounded hover:bg-gray-100 transition-colors',
                  org.id === organizationId && 'bg-gray-50'
                )}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    org.id === organizationId ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 text-left">
                  <div className="truncate">{org.name}</div>
                  <div className="text-xs text-gray-500">{org.role}</div>
                </div>
              </button>
            ))}

            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => router.push('/organizations/new')}
                className="flex items-center w-full px-2 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>新しい組織を作成</span>
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
