import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';

const URL_FRESH_MS = 9 * 60 * 1000;

export function useCoachingAudio(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['coaching-audio', id],
    queryFn: async () => {
      const res = await api.api.calls[':id']['coaching-audio'].$post({
        param: { id },
      });
      if (!res.ok) throw new Error((await apiError(res)).message);
      return (await res.json()).url;
    },
    enabled,
    retry: false,
    staleTime: URL_FRESH_MS,
    refetchOnWindowFocus: false,
  });
}
