'use client';

import { ChecklistEditor } from '@/components/checklist-editor';
import { ChecklistReadOnly } from '@/components/checklist-read-only';
import { useChecklist, useSaveChecklist } from '@/hooks/use-checklist';

export function ChecklistView() {
  const checklist = useChecklist();
  const save = useSaveChecklist();

  if (checklist.isPending) {
    return <p className="text-muted-foreground">Loading the checklist…</p>;
  }
  if (checklist.isError) {
    return (
      <p role="alert" className="text-destructive">
        {checklist.error.message} Refresh the page to try again.
      </p>
    );
  }

  if (!checklist.data.can_edit) {
    return <ChecklistReadOnly checklist={checklist.data} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ChecklistEditor
        key={checklist.dataUpdatedAt}
        checklist={checklist.data}
        saving={save.isPending}
        onSave={save.mutate}
        onEdit={save.reset}
      />
      {save.isSuccess && (
        <p role="status" className="text-sm text-muted-foreground">
          Saved. The next call you check uses this checklist.
        </p>
      )}
      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}
    </div>
  );
}
