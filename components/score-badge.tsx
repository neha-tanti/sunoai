import { ToneBadge } from '@/components/tone-badge';
import { SCORE_BAND_LABEL, SCORE_BAND_TONE } from '@/lib/report-labels';
import { scoreBand } from '@/lib/score-band';

export function ScoreBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <ToneBadge tone="neutral">No checks applied</ToneBadge>;
  }

  const band = scoreBand(percent);
  return (
    <ToneBadge tone={SCORE_BAND_TONE[band]}>
      {percent}% · {SCORE_BAND_LABEL[band]}
    </ToneBadge>
  );
}
