import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import type { ReportDetail } from '@/hooks/use-call';
import { findSpeaker, speakerLabel } from '@/lib/report-labels';

type Role = ReportDetail['speakers'][number]['role'];

const ROLE_VARIANT: Record<Role, ComponentProps<typeof Badge>['variant']> = {
  ai_agent: 'outline',
  human_agent: 'default',
  customer: 'secondary',
  unknown: 'secondary',
};

type SpeakerChipProps = {
  speakers: ReportDetail['speakers'];
  speakerId: number;
};

export function SpeakerChip({ speakers, speakerId }: SpeakerChipProps) {
  const role = findSpeaker(speakers, speakerId)?.role ?? 'unknown';
  return (
    <Badge variant={ROLE_VARIANT[role]}>
      {speakerLabel(speakers, speakerId)}
    </Badge>
  );
}
