import { describe, expect, it } from 'vitest';
import { EXPECTED } from '../scripts/calls/late-order.mjs';
import { LATE_ORDER_REPORT as report } from './late-order-example';

describe('the published Late order report', () => {
  it('agrees with what the Late order call was written to expect', () => {
    expect({
      score: `${report.score_passed}/${report.score_total}`,
      needs_review: report.needs_review,
      frustration_peak: report.frustration_peak,
      checks: Object.fromEntries(
        report.checks.map((check) => [check.check_id, check.result]),
      ),
      handover: report.handover_segment_id,
      red_flags: report.red_flags.map((flag) => flag.flag_id),
    }).toEqual({
      score: EXPECTED.score,
      needs_review: EXPECTED.needs_review,
      frustration_peak: EXPECTED.frustration_peak,
      checks: EXPECTED.checks,
      handover: EXPECTED.segments.handover,
      red_flags: EXPECTED.segments.red_flags.map((flag) => flag.split('@')[0]),
    });
  });
});
