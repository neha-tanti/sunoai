import { Suspense } from 'react';
import { CallView } from '@/components/call-view';

export default function CallPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-16">
      <Suspense
        fallback={<p className="text-muted-foreground">Loading the call…</p>}
      >
        <CallView />
      </Suspense>
    </main>
  );
}
