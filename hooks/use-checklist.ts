import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';
import type { SaveChecklist } from '@/lib/checklist';

export type SavedChecklist = InferResponseType<
  typeof api.api.checklist.$get,
  200
>;

export function useChecklist() {
  return useQuery({
    queryKey: ['checklist'],
    queryFn: async () => {
      const res = await api.api.checklist.$get();
      if (!res.ok) throw new Error("Couldn't load the checklist.");
      return res.json();
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSaveChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checklist: SaveChecklist) => {
      const res = await api.api.checklist.$put({ json: checklist });
      if (!res.ok) throw new Error((await apiError(res)).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist'] }),
  });
}
