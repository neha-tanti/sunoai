import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SavedChecklist } from '@/hooks/use-checklist';

export function ChecklistReadOnly({
  checklist,
}: {
  checklist: SavedChecklist;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="text-sm text-muted-foreground">
        Only the team leader&apos;s account can change the checklist. Visitors
        can read it here.
      </p>

      <Card role="region" aria-label="Checks">
        <CardHeader>
          <CardTitle>Checks</CardTitle>
          <CardDescription>
            Each one is marked Passed, Missed or Not needed, with a quote from
            the call as proof.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            {checklist.checks.map((check) => (
              <div key={check.id}>
                <dt className="font-medium">{check.name}</dt>
                <dd className="text-sm text-muted-foreground">{check.rule}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card role="region" aria-label="Red flags">
        <CardHeader>
          <CardTitle>Red flags</CardTitle>
          <CardDescription>
            Any one of these marks the call Needs review, whatever its score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checklist.red_flags.length === 0 && (
            <p className="text-sm text-muted-foreground">No red flags.</p>
          )}
          <dl className="flex flex-col gap-3">
            {checklist.red_flags.map((flag) => (
              <div key={flag.id}>
                <dt className="font-medium">{flag.name}</dt>
                <dd className="text-sm text-muted-foreground">
                  {flag.example}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card role="region" aria-label="Refund and compensation rules">
        <CardHeader>
          <CardTitle>Refund and compensation rules</CardTitle>
          <CardDescription>
            SunoAI flags a promise that breaks these as a wrong promise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{checklist.rules}</p>
        </CardContent>
      </Card>
    </div>
  );
}
