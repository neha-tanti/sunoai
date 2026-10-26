import type { Metadata } from 'next';
import { RecentCalls } from '@/components/recent-calls';

export const metadata: Metadata = { title: 'Recent calls' };

export default function RecentCallsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Recent calls</h1>
        <p className="text-muted-foreground">
          The 10 newest calls your team has checked.
        </p>
      </div>
      <RecentCalls />
    </main>
  );
}
