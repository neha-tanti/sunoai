import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TINT_CLASS } from '@/lib/tints';

export function ReviewBanner({ redFlags }: { redFlags: number }) {
  if (redFlags === 0) {
    return (
      <Alert role="region" aria-label="Review" className={TINT_CLASS.sage}>
        <CircleCheckIcon />
        <AlertTitle>No red flags</AlertTitle>
        <AlertDescription className="text-current">
          Nothing on this call needs a person to look at it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert role="region" aria-label="Review" className={TINT_CLASS.coral}>
      <TriangleAlertIcon />
      <AlertTitle>Needs review</AlertTitle>
      <AlertDescription className="text-current">
        {redFlags === 1 ? '1 red flag' : `${redFlags} red flags`}. A person
        should look at this call, whatever its checklist score.
      </AlertDescription>
    </Alert>
  );
}
