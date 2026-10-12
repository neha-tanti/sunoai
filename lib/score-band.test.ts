import { describe, expect, it } from 'vitest';
import { scoreBand, scorePercent } from './score-band';

describe('scoreBand', () => {
  it.each([
    [5, 5, 'good'],
    [4, 5, 'good'],
    [7, 9, 'needs_work'],
    [1, 2, 'needs_work'],
    [2, 5, 'poor'],
    [0, 3, 'poor'],
  ])('%i of %i passed is %s', (passed, total, band) => {
    expect(scoreBand(scorePercent(passed, total)!)).toBe(band);
  });

  it('bands the percent as shown, so 39 of 49 reads 80% and Good', () => {
    expect(scorePercent(39, 49)).toBe(80);
    expect(scoreBand(80)).toBe('good');
  });

  it('gives no percent when every check was not applicable', () => {
    expect(scorePercent(0, 0)).toBeNull();
  });
});
