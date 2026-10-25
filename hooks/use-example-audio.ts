import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';
import type { ExampleCallId } from '@/lib/examples';

const URL_FRESH_MS = 9 * 60 * 1000;

export function useExampleAudio(example: ExampleCallId, enabled: boolean) {
  return useQuery({
    queryKey: ['example-audio', example],
    queryFn: async () => {
      const res = await api.api.calls.examples[':example'].audio.$get({
        param: { example },
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
