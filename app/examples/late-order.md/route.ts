import { callLanguage } from '@/lib/call-upload';
import { exampleCall } from '@/lib/examples';
import {
  LATE_ORDER_SECONDS,
  LATE_ORDER_REPORT as report,
  LATE_ORDER_SEGMENTS as segments,
} from '@/lib/late-order-example';
import {
  findSpeaker,
  formatTime,
  MOOD_LABEL,
  RESULT_LABEL,
  SCORE_BAND_LABEL,
  speakerLabel,
} from '@/lib/report-labels';
import { scoreBand, scorePercent } from '@/lib/score-band';
import { SITE_URL } from '@/lib/site';

export function GET() {
  return new Response(lateOrderMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

function lateOrderMarkdown() {
  const percent = scorePercent(report.score_passed, report.score_total);
  if (percent === null) throw new Error('The Late order report has no checks');
  const example = exampleCall('late-order');
  const languages = example.call_langs
    .map((code) => callLanguage(code).label)
    .join(' + ');
  const handover = segments.find(
    (segment) => segment.segment_id === report.handover_segment_id,
  );
  const speaker = (speakerId: number) => speakerLabel(report.speakers, speakerId);

  return [
    `# Example report: ${example.title}`,
    '',
    `> A made-up food delivery support call, voiced with Gnani Timbre and checked by SunoAI. ${formatTime(LATE_ORDER_SECONDS)} long, in ${languages}. Open it in the app: ${SITE_URL} (Try an example call, then Late order).`,
    '',
    `- **Review:** ${report.needs_review ? `Needs review, red flags: ${report.red_flags.length}` : 'No red flags'}`,
    `- **Checklist score:** ${report.score_passed} / ${report.score_total} (${percent}%, ${SCORE_BAND_LABEL[scoreBand(percent)]}). Red flags are counted apart from the score.`,
    `- **Peak frustration:** ${MOOD_LABEL[report.frustration_peak]}${report.frustration.turn ? `, turned at ${formatTime(report.frustration.turn.time)}` : ''}`,
    `- **Handover:** ${handover ? `AI to ${findSpeaker(report.speakers, handover.speaker_id)?.name ?? 'a human agent'} at ${formatTime(handover.start_time)}` : 'No handover'}`,
    '',
    '## Summary',
    '',
    report.summary,
    '',
    '## How the customer felt',
    '',
    ...report.frustration.ranges.map(
      (range) =>
        `- ${MOOD_LABEL[range.level]} from ${formatTime(range.start)} to ${formatTime(range.end)}`,
    ),
    '',
    '## Red flags',
    '',
    ...report.red_flags.map(
      (flag) =>
        `- **${flag.name}** (${formatTime(flag.time)}): "${flag.quote}". ${flag.note}`,
    ),
    '',
    '## Agent checklist',
    '',
    'No quote, no pass: a check passes only with a quote found in the transcript.',
    '',
    ...report.checks.map((check) =>
      [
        `- **${check.name}:** ${RESULT_LABEL[check.result]}.`,
        check.time !== null && check.quote
          ? ` ${formatTime(check.time)} "${check.quote}".`
          : '',
        ` ${check.reason}`,
      ].join(''),
    ),
    '',
    '## AI fix notes',
    '',
    ...report.fix_notes.map(
      (note, index) =>
        `${index + 1}. **${note.title}** (${formatTime(note.time)}). The AI said "${note.ai_said}". It should have said: ${note.should_have}`,
    ),
    '',
    '## Coaching for the human agent',
    '',
    ...(report.coaching
      ? [
          `${formatTime(report.coaching.time)} "${report.coaching.quote}"`,
          '',
          `> ${report.coaching.text}`,
          '',
          `In English: ${report.coaching.english}`,
        ]
      : ['No coaching for this call.']),
    '',
    '## Transcript',
    '',
    'Who said what is a best guess from speaker separation.',
    '',
    ...segments.map(
      (segment) =>
        `- ${formatTime(segment.start_time)} **${speaker(segment.speaker_id)}:** ${segment.text}`,
    ),
    '',
  ].join('\n');
}
