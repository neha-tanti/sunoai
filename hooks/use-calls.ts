import { useQuery } from '@tanstack/react-query';
import type { InferResponseType } from 'hono/client';
import { api } from '@/lib/api-client';

export type RecentCalls = InferResponseType<typeof api.api.calls.$get, 200>;
export type RecentCall = RecentCalls['calls'][number];

export function useCalls() {
  return useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await api.api.calls.$get();
      if (!res.ok) throw new Error("Couldn't load recent calls.");
      return res.json();
    },
  });
}
