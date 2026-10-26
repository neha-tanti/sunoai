import type { Metadata } from 'next';
import { ChecklistView } from '@/components/checklist-view';

export const metadata: Metadata = { title: 'Checklist' };

export default function ChecklistPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Checklist</h1>
          <p className="text-muted-foreground">
            What SunoAI checks on every call. Changes apply to the next call you
            check; reports already made keep the checklist they used.
          </p>
        </div>
        <ChecklistView />
      </div>
    </main>
  );
}
