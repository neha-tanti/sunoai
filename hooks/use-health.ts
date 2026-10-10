import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.api.health.$get();
      if (!res.ok) throw new Error(`Health check failed with ${res.status}`);
      return res.json();
    },
  });
}
