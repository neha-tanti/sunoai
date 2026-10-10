'use client';

import { useHealth } from '@/hooks/use-health';

export function HealthStatus() {
  const health = useHealth();

  return (
    <p role="status" className="text-muted-foreground">
      {health.isPending && 'Checking API…'}
      {health.isError && 'API unreachable'}
      {health.isSuccess && `API: ${health.data.status}`}
    </p>
  );
}
