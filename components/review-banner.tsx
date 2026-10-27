import { CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ReviewBanner({ redFlags }: { redFlags: number }) {
  if (redFlags === 0) {
    return (
      <Alert role="region" aria-label="Review">
        <CircleCheckIcon />
        <AlertTitle>No red flags</AlertTitle>
        <AlertDescription>
          Nothing on this call needs a person to look at it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      role="region"
      aria-label="Review"
      variant="destructive"
      className="bg-angry/10"
    >
      <TriangleAlertIcon />
      <AlertTitle>Needs review</AlertTitle>
      <AlertDescription>
        {redFlags === 1 ? '1 red flag' : `${redFlags} red flags`}. A person
        should look at this call, whatever its checklist score.
      </AlertDescription>
    </Alert>
  );
}
