export type ScoreBand = 'good' | 'needs_work' | 'poor';

export function scorePercent(passed: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((passed / total) * 100);
}

export function scoreBand(percent: number): ScoreBand {
  if (percent >= 80) return 'good';
  if (percent >= 50) return 'needs_work';
  return 'poor';
}
