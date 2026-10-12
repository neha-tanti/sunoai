import { describe, expect, it } from 'vitest';
import { scoreBand } from './score-band';

describe('scoreBand', () => {
  it.each([
    [5, 5, 'good'],
    [4, 5, 'good'],
    [7, 9, 'needs_work'],
    [1, 2, 'needs_work'],
    [2, 5, 'poor'],
    [0, 3, 'poor'],
  ])('%i of %i passed is %s', (passed, total, band) => {
    expect(scoreBand(passed, total)).toBe(band);
  });

  it('gives no band when every check was not applicable', () => {
    expect(scoreBand(0, 0)).toBeNull();
  });
});
