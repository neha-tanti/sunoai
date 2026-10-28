import { Badge } from '@/components/ui/badge';
import type { Tone } from '@/lib/report-labels';
import { cn } from '@/lib/utils';

const DOT_CLASS: Record<Tone, string> = {
  calm: 'bg-calm',
  annoyed: 'bg-annoyed',
  angry: 'bg-angry',
  neutral: 'bg-muted-foreground/40',
};

type ToneBadgeProps = {
  tone: Tone;
  className?: string;
  children: React.ReactNode;
};

export function ToneBadge({ tone, className, children }: ToneBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      <span
        aria-hidden
        className={cn('size-2 rounded-full', DOT_CLASS[tone])}
      />
      {children}
    </Badge>
  );
}
