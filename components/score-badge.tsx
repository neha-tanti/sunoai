import { Badge } from '@/components/ui/badge';
import { SCORE_BAND_CLASS, SCORE_BAND_LABEL } from '@/lib/report-labels';
import { scoreBand } from '@/lib/score-band';

export function ScoreBadge({ percent }: { percent: number }) {
  const band = scoreBand(percent);
  return (
    <Badge className={SCORE_BAND_CLASS[band]}>
      {percent}% · {SCORE_BAND_LABEL[band]}
    </Badge>
  );
}
