import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';

export function useCheckAgain(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.api.calls[':id'].analyze.$post({ param: { id } });
      if (!res.ok) throw new Error((await apiError(res)).message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['call', id] }),
  });
}
