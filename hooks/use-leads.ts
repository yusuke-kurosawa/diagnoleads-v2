import { trpc } from '@/lib/trpc/client';
import type {
  CreateLeadInput,
  UpdateLeadInput,
  GetLeadInput,
  ListLeadsInput,
  DeleteLeadInput,
} from '@/lib/features/leads/types';

/**
 * Hook to create a new lead
 */
export function useCreateLead() {
  const utils = trpc.useContext();

  return trpc.leads.create.useMutation({
    onSuccess: () => {
      // Invalidate leads list to refresh data
      utils.leads.list.invalidate();
    },
  });
}

/**
 * Hook to get a single lead by ID
 */
export function useGetLead(input: GetLeadInput) {
  return trpc.leads.get.useQuery(input);
}

/**
 * Hook to list leads with pagination and filtering
 */
export function useListLeads(input: ListLeadsInput) {
  return trpc.leads.list.useQuery(input);
}

/**
 * Hook to update a lead
 */
export function useUpdateLead() {
  const utils = trpc.useContext();

  return trpc.leads.update.useMutation({
    onSuccess: (_, variables) => {
      // Invalidate the specific lead and the list
      utils.leads.get.invalidate({
        id: variables.id,
        organizationId: variables.organizationId
      });
      utils.leads.list.invalidate();
    },
  });
}

/**
 * Hook to delete a lead
 */
export function useDeleteLead() {
  const utils = trpc.useContext();

  return trpc.leads.delete.useMutation({
    onSuccess: () => {
      // Invalidate leads list to refresh data
      utils.leads.list.invalidate();
    },
  });
}

/**
 * Composite hook for all lead operations
 * Useful when you need multiple operations in a component
 */
export function useLeads(organizationId: string) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  return {
    createLead,
    updateLead,
    deleteLead,
    // Helper methods for common operations
    create: (input: Omit<CreateLeadInput, 'organizationId'>) =>
      createLead.mutate({ ...input, organizationId }),
    update: (input: Omit<UpdateLeadInput, 'organizationId'>) =>
      updateLead.mutate({ ...input, organizationId }),
    delete: (id: string) =>
      deleteLead.mutate({ id, organizationId }),
  };
}
