import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';
import type { ExampleCallId } from '@/lib/examples';

export function useCheckExample() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (example: ExampleCallId) => {
      const res = await api.api.calls.examples.$post({ json: { example } });
      if (!res.ok) throw new Error((await apiError(res)).message);
      const { id } = await res.json();
      return id;
    },
    onSuccess: (id) => router.push(`/calls/${id}`),
  });
}
