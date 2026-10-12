import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const REFETCH_MS = 3_000;

export function useCall(id: string) {
  return useQuery({
    queryKey: ['call', id],
    queryFn: async () => {
      const res = await api.api.calls[':id'].$get({ param: { id } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Couldn't load this call.");
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.call.status;
      if (!status || status === 'ready' || status === 'failed') return false;
      return REFETCH_MS;
    },
  });
}
