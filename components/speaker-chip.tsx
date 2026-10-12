import { Badge } from '@/components/ui/badge';
import type { CallReport } from '@/hooks/use-call';
import { findSpeaker, speakerLabel } from '@/lib/report-labels';

type SpeakerChipProps = {
  speakers: CallReport['speakers'];
  speakerId: number;
};

export function SpeakerChip({ speakers, speakerId }: SpeakerChipProps) {
  const role = findSpeaker(speakers, speakerId)?.role;
  const variant =
    role === 'ai_agent'
      ? 'outline'
      : role === 'human_agent'
        ? 'default'
        : 'secondary';
  return <Badge variant={variant}>{speakerLabel(speakers, speakerId)}</Badge>;
}
