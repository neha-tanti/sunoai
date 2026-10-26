import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { CallView } from '@/components/call-view';
import { createAdminClient } from '@/server/supabase';

export async function generateMetadata({
  params,
}: PageProps<'/calls/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const call = await createAdminClient()
    .from('calls')
    .select('title')
    .eq('id', id)
    .maybeSingle();
  return { title: call.data?.title ?? 'Call not found' };
}

// Renders nothing; it tells Next.js this page is rendered per request, which
// generateMetadata needs to read the call's title.
async function RequestTimeMarker() {
  await connection();
  return null;
}

export default function CallPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-6 py-16">
      <Suspense
        fallback={<p className="text-muted-foreground">Loading the call…</p>}
      >
        <CallView />
      </Suspense>
      <Suspense>
        <RequestTimeMarker />
      </Suspense>
    </main>
  );
}
