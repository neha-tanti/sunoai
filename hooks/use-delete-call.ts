import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';

export async function deleteCall(id: string) {
  const res = await api.api.calls[':id'].$delete({ param: { id } });
  if (res.ok) return;

  const error = await apiError(res);
  if (error.code === 'not_found') return;
  throw new Error(error.message);
}

export function useDeleteCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCall,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['call', id] });
      return queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}
