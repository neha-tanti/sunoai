import { ChecklistView } from '@/components/checklist-view';

export default function ChecklistPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Checklist</h1>
        <p className="text-muted-foreground">
          What SunoAI checks on every call. Changes apply to the next call you
          check; reports already made keep the checklist they used.
        </p>
      </div>
      <ChecklistView />
    </main>
  );
}
