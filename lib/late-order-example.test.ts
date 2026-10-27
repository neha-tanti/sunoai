import { describe, expect, it } from 'vitest';
import { EXPECTED } from '../scripts/calls/late-order.mjs';
import {
  LATE_ORDER_ASK as ask,
  LATE_ORDER_REPORT as report,
  LATE_ORDER_SEGMENTS as segments,
} from './late-order-example';

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

  it('places each red flag between the line it was expected on and the handover', () => {
    const expectedSegment = new Map(
      EXPECTED.segments.red_flags.map((flag) => {
        const [id, segment] = flag.split('@');
        return [id, Number(segment)];
      }),
    );

    for (const flag of report.red_flags) {
      expect(flag.segment_id, flag.flag_id).toBeGreaterThanOrEqual(
        expectedSegment.get(flag.flag_id) ?? Infinity,
      );
      expect(flag.segment_id, flag.flag_id).toBeLessThan(
        EXPECTED.segments.handover,
      );
    }
  });

  it("quotes the customer's ask for a person from its line, before the red flag", () => {
    const segment = segments[ask.segment_id];

    const speaker = report.speakers.find(
      (s) => s.speaker_id === segment.speaker_id,
    );

    expect(segment.segment_id).toBe(ask.segment_id);
    expect(speaker?.role).toBe('customer');
    expect(segment.text).toContain(ask.quote);
    expect(ask.segment_id).toBeLessThan(report.red_flags[0].segment_id);
  });
});
