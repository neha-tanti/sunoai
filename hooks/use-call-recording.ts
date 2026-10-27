import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';

export const URL_FRESH_MS = 9 * 60 * 1000;

export function useCallRecording(id: string) {
  return useQuery({
    queryKey: ['call-recording', id],
    queryFn: async () => {
      const res = await api.api.calls[':id'].recording.$get({ param: { id } });
      if (!res.ok) throw new Error((await apiError(res)).message);
      return (await res.json()).url;
    },
    retry: false,
    staleTime: Infinity,
  });
}
