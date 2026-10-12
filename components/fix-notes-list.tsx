import { TimeLink } from '@/components/time-link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ReportDetail } from '@/hooks/use-call';

type FixNote = ReportDetail['fix_notes'][number];

export function FixNotesList({ notes }: { notes: FixNote[] }) {
  return (
    <Card role="region" aria-label="AI fix notes">
      <CardHeader>
        <CardTitle>AI fix notes</CardTitle>
        <CardDescription>For the AI team</CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">
            No problems found for the AI on this call.
          </p>
        ) : (
          <ol className="flex flex-col divide-y">
            {notes.map((note, index) => (
              <FixNoteItem
                key={`${note.segment_id}-${index}`}
                note={note}
                number={index + 1}
              />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function FixNoteItem({ note, number }: { note: FixNote; number: number }) {
  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 py-2.5 first:pt-0">
      <span className="grid size-6 place-items-center rounded-full bg-muted font-mono text-xs">
        {number}
      </span>
      <div className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {note.title}
          <TimeLink segmentId={note.segment_id} time={note.time} />
        </p>
        <p>
          <span className="mr-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            AI said
          </span>
          <q className="italic">{note.ai_said}</q>
        </p>
        <p>
          <span className="mr-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Should have
          </span>
          {note.should_have}
        </p>
      </div>
    </li>
  );
}
