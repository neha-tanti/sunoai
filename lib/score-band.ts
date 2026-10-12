export type ScoreBand = 'good' | 'needs_work' | 'poor';

export function scoreBand(passed: number, total: number): ScoreBand | null {
  if (total === 0) return null;

  const percent = (passed / total) * 100;
  if (percent >= 80) return 'good';
  if (percent >= 50) return 'needs_work';
  return 'poor';
}
