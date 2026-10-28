import { describe, expect, it } from 'vitest';
import { coachingLanguage } from '@/lib/call-upload';
import type { Checklist } from './checklist';
import type { TranscriptSegment } from './gnani';
import type { LlmAnswer } from './prompts/analyze';
import { buildReport, quoteFound } from './report';

const AI = 1;
const CUSTOMER = 2;
const HUMAN = 3;

const lines: [number, string][] = [
  [AI, 'Namaste, FreshDabba support mein aapka swagat hai.'],
  [CUSTOMER, 'Mera biryani order chaalis minute late hai.'],
  [AI, 'Sorry, main samjha nahi. Apna order ID bataiye.'],
  [CUSTOMER, 'Mujhe kisi insaan se baat karni hai, please!'],
  [AI, 'Order ID bataiye please.'],
  [
    HUMAN,
    'Main Arjun bol raha hoon. Main samajh sakta hoon aap pareshaan hain.',
  ],
  [CUSTOMER, 'Theek hai, bas jaldi bhejiye.'],
];

const segments: TranscriptSegment[] = lines.map(([speaker, text], i) => ({
  segment_id: i,
  start_time: i * 5,
  end_time: i * 5 + 4.5,
  speaker_id: speaker,
  text,
}));

const checklist: Checklist = {
  checks: [
    {
      id: 'order_confirmed',
      name: 'Order confirmed',
      rule: 'Confirms the order',
    },
    {
      id: 'frustration_acknowledged',
      name: 'Frustration acknowledged',
      rule: 'Recognises frustration',
    },
    {
      id: 'smooth_handover',
      name: 'Smooth handover',
      rule: 'Passes the call on (na without a handover)',
    },
  ],
  red_flags: [
    {
      id: 'human_not_transferred',
      name: 'Not transferred',
      example: '"insaan se baat"',
    },
    { id: 'agent_loop', name: 'Loop', example: 'order ID three times' },
  ],
  rules: 'Late delivery over 45 minutes: a coupon of up to ₹50.',
};

const speakers: LlmAnswer['speakers'] = [
  { speaker_id: AI, role: 'ai_agent', name: null },
  { speaker_id: CUSTOMER, role: 'customer', name: null },
  { speaker_id: HUMAN, role: 'human_agent', name: 'Arjun' },
];

function answer(overrides: Partial<LlmAnswer> = {}): LlmAnswer {
  return {
    speakers,
    customer_mood: [
      { segment_id: 1, level: 'annoyed' },
      { segment_id: 3, level: 'angry' },
      { segment_id: 6, level: 'calm' },
    ],
    checks: [
      {
        check_id: 'order_confirmed',
        result: 'miss',
        segment_id: 2,
        quote: 'Apna order ID bataiye',
        reason: 'Asked but never confirmed.',
      },
      {
        check_id: 'frustration_acknowledged',
        result: 'pass',
        segment_id: 5,
        quote: 'aap pareshaan hain',
        reason: 'Arjun acknowledged it.',
      },
      {
        check_id: 'smooth_handover',
        result: 'pass',
        segment_id: 5,
        quote: 'Main Arjun bol raha hoon',
        reason: 'Handed over.',
      },
    ],
    red_flags: [
      {
        flag_id: 'human_not_transferred',
        segment_id: 4,
        quote: 'Order ID bataiye please',
        note: 'Asked for the ID instead of transferring.',
      },
    ],
    summary:
      'A late biryani order; the customer asked for a person and got one.',
    fix_notes: [
      {
        segment_id: 4,
        title: 'Transfer on request',
        ai_said: 'Order ID bataiye please.',
        should_have: 'Transfer to a person.',
      },
    ],
    coaching: {
      segment_id: 5,
      quote: 'aap pareshaan hain',
      text: 'Arjun, aapne customer ki pareshani maani, yeh achha tha.',
      english: 'Arjun, you recognised the customer was upset, that was good.',
    },
    ...overrides,
  };
}

const build = (
  overrides: Partial<LlmAnswer> = {},
  { durationSeconds = 35, coachingLang = 'hi-en' } = {},
) =>
  buildReport({
    answer: answer(overrides),
    segments,
    checklist,
    durationSeconds,
    coachingLanguage: coachingLanguage(coachingLang),
  });

const checkOf = (report: ReturnType<typeof build>['report'], id: string) =>
  report.checks.find((check) => check.check_id === id);

describe('quoteFound', () => {
  it('ignores case, punctuation and spacing', () => {
    expect(
      quoteFound(
        'Mujhe kisi insaan se baat karni hai, please!',
        'INSAAN   se baat karni hai please',
      ),
    ).toBe(true);
  });

  it('matches Devanagari across a danda and a zero-width joiner', () => {
    expect(
      quoteFound('मुझे इंसान से बात करनी है। प्लीज़', 'इंसान से बात करनी है'),
    ).toBe(true);
    expect(quoteFound('क्‍या आप सुन रहे हैं', 'क्या आप')).toBe(true);
  });

  it.each([
    ['an empty quote', ''],
    ['an ellipsis', '...'],
    ['a lone exclamation mark', '!'],
    ['a word the segment does not contain', 'refund'],
    ['part of a word', 'insa'],
  ])('rejects %s', (_, quote) => {
    expect(
      quoteFound('Mujhe kisi insaan se baat karni hai, please!', quote),
    ).toBe(false);
  });
});

describe('buildReport', () => {
  it('turns segment ids into the segment start times', () => {
    const { report } = build();

    expect(checkOf(report, 'frustration_acknowledged')).toMatchObject({
      segment_id: 5,
      time: 25,
    });
    expect(report.red_flags[0]).toMatchObject({ segment_id: 4, time: 20 });
    expect(report.fix_notes[0]).toMatchObject({ segment_id: 4, time: 20 });
  });

  describe('segment numbers in the written text', () => {
    it('names the time of a segment the model mentions by number', () => {
      const { report } = build({
        red_flags: [
          {
            flag_id: 'human_not_transferred',
            segment_id: 4,
            quote: 'Order ID bataiye please',
            note: 'The customer asked for a person in segment 3, and the AI asked for the ID again in segments 2 and 4.',
          },
        ],
        summary: 'Segment 5 is where Arjun took over.',
      });

      expect(report.red_flags[0].note).toBe(
        'The customer asked for a person at 0:15, and the AI asked for the ID again at 0:10 and 0:20.',
      );
      expect(report.summary).toBe('The line at 0:25 is where Arjun took over.');
    });

    it('also rewrites check reasons, fix notes and the English coaching', () => {
      const base = answer();
      const { report } = build({
        checks: base.checks.map((check) => ({
          ...check,
          reason: 'Not confirmed (segments 2, 4).',
        })),
        fix_notes: [
          { ...base.fix_notes[0], should_have: 'Transfer at segment 3.' },
        ],
        coaching: {
          ...base.coaching,
          english: 'Arjun, in segment 5 you did well.',
        },
      });

      expect(checkOf(report, 'order_confirmed')?.reason).toBe(
        'Not confirmed (the lines at 0:10, 0:20).',
      );
      expect(report.fix_notes[0].should_have).toBe('Transfer at 0:15.');
      expect(report.coaching?.english).toBe('Arjun, at 0:25 you did well.');
    });

    it('names the times at both ends of a range of segments', () => {
      const { report } = build({
        summary: 'The AI looped in segments 2-4 and again in segments 2 to 4.',
      });

      expect(report.summary).toBe(
        'The AI looped at 0:10-0:20 and again at 0:10 to 0:20.',
      );
    });

    it('rewrites the spoken English coaching the same as its English version', () => {
      const { report } = build(
        {
          coaching: {
            ...answer().coaching,
            text: 'Arjun, in segment 5 you did well.',
            english: 'Arjun, in segment 5 you did well.',
          },
        },
        { coachingLang: 'en-IN' },
      );

      expect(report.coaching?.text).toBe('Arjun, at 0:25 you did well.');
      expect(report.coaching?.text).toBe(report.coaching?.english);
    });

    it('leaves a segment number that is not in the transcript as written', () => {
      const { report } = build({
        summary: 'The customer hung up after segment 40.',
      });

      expect(report.summary).toBe('The customer hung up after segment 40.');
    });

    it('leaves a mention as written when one of its segments is not in the transcript', () => {
      const { report } = build({
        summary: 'The customer asked for a person in segments 3, 40.',
      });

      expect(report.summary).toBe(
        'The customer asked for a person in segments 3, 40.',
      );
    });
  });

  describe('checks', () => {
    it('saves a pass whose quote is not in its segment as a miss, without the quote', () => {
      const { report, rejected } = build({
        checks: [
          {
            check_id: 'frustration_acknowledged',
            result: 'pass',
            segment_id: 2,
            quote: 'aap pareshaan hain',
            reason: 'Wrong line.',
          },
        ],
      });

      expect(checkOf(report, 'frustration_acknowledged')).toMatchObject({
        result: 'miss',
        segment_id: null,
        time: null,
        quote: null,
      });
      expect(rejected.passes).toBe(1);
    });

    it.each([
      ['an empty quote', ''],
      ['an ellipsis', '…'],
      ['no quote', null],
    ])('saves a pass with %s as a miss', (_, quote) => {
      const { report } = build({
        checks: [
          {
            check_id: 'order_confirmed',
            result: 'pass',
            segment_id: 2,
            quote,
            reason: 'Confirmed.',
          },
        ],
      });

      expect(checkOf(report, 'order_confirmed')?.result).toBe('miss');
    });

    it('drops the quote of a miss that is not in its segment but keeps the miss', () => {
      const { report } = build({
        checks: [
          {
            check_id: 'order_confirmed',
            result: 'miss',
            segment_id: 99,
            quote: 'order number',
            reason: 'Never confirmed.',
          },
        ],
      });

      expect(checkOf(report, 'order_confirmed')).toMatchObject({
        result: 'miss',
        quote: null,
        segment_id: null,
      });
    });

    it('counts a check the model left out as a miss', () => {
      const { report } = build({ checks: [] });

      expect(report.checks.map((check) => check.result)).toEqual([
        'miss',
        'miss',
        'miss',
      ]);
      expect(report).toMatchObject({ score_passed: 0, score_total: 3 });
    });

    it('drops unknown check ids', () => {
      const { report } = build({
        checks: [
          {
            check_id: 'made_up_check',
            result: 'pass',
            segment_id: 5,
            quote: 'aap pareshaan hain',
            reason: '',
          },
        ],
      });

      expect(report.checks.map((check) => check.check_id)).toEqual(
        checklist.checks.map((check) => check.id),
      );
    });

    it('keeps the first answer for a check id given more than once, so the score never exceeds the checks', () => {
      const pass = answer().checks[1];
      const { report } = build({
        checks: [pass, { ...pass, result: 'miss' }, pass],
      });

      expect(checkOf(report, 'frustration_acknowledged')?.result).toBe('pass');
      expect(report).toMatchObject({ score_passed: 1, score_total: 3 });
    });
  });

  describe('score', () => {
    it('divides passed checks by the checks not marked na', () => {
      const { report } = build({
        checks: [
          ...answer().checks.slice(0, 2),
          {
            check_id: 'smooth_handover',
            result: 'na',
            segment_id: null,
            quote: null,
            reason: 'No handover.',
          },
        ],
      });

      expect(report).toMatchObject({ score_passed: 1, score_total: 2 });
    });

    it('leaves Smooth handover out when the call never reaches a human agent, even if the model marks it missed', () => {
      const { report } = build({
        speakers: speakers.map((s) =>
          s.speaker_id === HUMAN ? { ...s, role: 'ai_agent' } : s,
        ),
        checks: [
          ...answer().checks.slice(0, 2),
          {
            check_id: 'smooth_handover',
            result: 'miss',
            segment_id: null,
            quote: null,
            reason: 'Never transferred to a person.',
          },
        ],
      });

      expect(checkOf(report, 'smooth_handover')?.result).toBe('na');
      expect(report).toMatchObject({ score_passed: 1, score_total: 2 });
    });
  });

  describe('red flags', () => {
    it('keeps a flag whose quote is in its segment and marks the call for review', () => {
      const { report } = build();

      expect(report.needs_review).toBe(true);
      expect(report.red_flags).toEqual([
        expect.objectContaining({
          flag_id: 'human_not_transferred',
          quote: 'Order ID bataiye please',
        }),
      ]);
    });

    it.each([
      [
        'a quote from another segment',
        { segment_id: 2, quote: 'Order ID bataiye please' },
      ],
      ['a punctuation-only quote', { segment_id: 4, quote: '?!' }],
      [
        'an unknown segment',
        { segment_id: 42, quote: 'Order ID bataiye please' },
      ],
    ])(
      'drops a flag with %s, and the call no longer needs review',
      (_, flag) => {
        const { report, rejected } = build({
          red_flags: [{ flag_id: 'human_not_transferred', note: '', ...flag }],
        });

        expect(report.red_flags).toEqual([]);
        expect(report.needs_review).toBe(false);
        expect(rejected.red_flags).toBe(1);
      },
    );

    it('keeps the first quoted flag for a flag id given more than once', () => {
      const repeated = answer().red_flags[0];
      const { report, rejected } = build({
        red_flags: [
          { ...repeated, segment_id: 2, quote: 'insaan se baat' },
          repeated,
          { ...repeated, segment_id: 3, quote: 'insaan se baat karni hai' },
        ],
      });

      expect(report.red_flags).toEqual([
        expect.objectContaining({
          flag_id: 'human_not_transferred',
          segment_id: 4,
        }),
      ]);
      expect(rejected.red_flags).toBe(1);
    });

    it('drops unknown flag ids', () => {
      const { report } = build({
        red_flags: [
          {
            flag_id: 'rude_agent',
            segment_id: 4,
            quote: 'Order ID bataiye please',
            note: '',
          },
        ],
      });

      expect(report.red_flags).toEqual([]);
    });
  });

  describe('handover and coaching', () => {
    it('is the first segment from the speaker labelled human_agent', () => {
      expect(build().report.handover_segment_id).toBe(5);
    });

    it('is null without a human agent, and so is the coaching', () => {
      const { report } = build({
        speakers: speakers.map((s) =>
          s.speaker_id === HUMAN ? { ...s, role: 'ai_agent' } : s,
        ),
      });

      expect(report).toMatchObject({
        handover_segment_id: null,
        coaching: null,
      });
    });

    it('is null when the human agent label points at a speaker who never speaks', () => {
      const { report } = build({
        speakers: [
          ...speakers.filter((s) => s.speaker_id !== HUMAN),
          { speaker_id: 7, role: 'human_agent', name: null },
        ],
      });

      expect(report.handover_segment_id).toBeNull();
      expect(report.speakers.map((s) => s.speaker_id)).not.toContain(7);
    });

    const devanagari = {
      segment_id: 5,
      quote: 'aap pareshaan hain',
      text: 'आपने customer को अच्छे से सुना।',
      english: 'You listened to the customer well.',
    };

    it('keeps coaching that quotes the human agent, linked to their line', () => {
      const { report, rejected } = build();

      expect(report.coaching).toMatchObject({
        text: 'Arjun, aapne customer ki pareshani maani, yeh achha tha.',
        segment_id: 5,
        time: 25,
        quote: 'aap pareshaan hain',
      });
      expect(rejected.coaching).toBeNull();
    });

    it('drops coaching about a line the human agent did not say', () => {
      const { report, rejected } = build({
        coaching: {
          ...answer().coaching,
          segment_id: 3,
          quote: 'kisi insaan se baat karni hai',
        },
      });

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBe('coaching without a human agent quote');
    });

    it('drops coaching whose quote is not in the line it points at', () => {
      const { report, rejected } = build({
        coaching: { ...answer().coaching, quote: 'yeh toh normal hai' },
      });

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBe('coaching without a human agent quote');
    });

    it.each([
      {
        field: 'every field',
        coaching: { segment_id: 0, quote: '', text: '', english: '' },
      },
      {
        field: 'the text',
        coaching: {
          segment_id: 5,
          quote: 'aap pareshaan hain',
          text: '  ',
          english: 'You listened well.',
        },
      },
      {
        field: 'the English',
        coaching: {
          segment_id: 5,
          quote: 'aap pareshaan hain',
          text: 'Aapne achhe se suna.',
          english: '',
        },
      },
    ])(
      'drops coaching that leaves $field empty when a human agent took part',
      ({ coaching }) => {
        const { report, rejected } = build({ coaching });

        expect(report.coaching).toBeNull();
        expect(rejected.coaching).toBe('empty coaching');
      },
    );

    it('does not count empty coaching as dropped when there is no human agent', () => {
      const { report, rejected } = build({
        speakers: speakers.map((s) =>
          s.speaker_id === HUMAN ? { ...s, role: 'ai_agent' } : s,
        ),
        coaching: { segment_id: 0, quote: '', text: '', english: '' },
      });

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBeNull();
    });

    it('drops Hinglish coaching written in Devanagari, which the hi-en voice would misread', () => {
      const { report, rejected } = build(
        { coaching: devanagari },
        { coachingLang: 'hi-en' },
      );

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBe('coaching in another script');
    });

    it('drops Hindi coaching with a word from another script, which the hi-IN voice would misread', () => {
      const { report, rejected } = build(
        {
          coaching: {
            ...devanagari,
            text: 'आपने ग्राहक की नाराज़गी को 承认 किया।',
          },
        },
        { coachingLang: 'hi-IN' },
      );

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBe('coaching in another script');
    });

    it('does not count Devanagari Hinglish coaching as dropped when there is no human agent', () => {
      const { report, rejected } = build(
        {
          speakers: speakers.map((s) =>
            s.speaker_id === HUMAN ? { ...s, role: 'ai_agent' } : s,
          ),
          coaching: devanagari,
        },
        { coachingLang: 'hi-en' },
      );

      expect(report.coaching).toBeNull();
      expect(rejected.coaching).toBeNull();
    });

    it('keeps Devanagari coaching when the coaching language is Hindi', () => {
      const { report } = build(
        { coaching: devanagari },
        { coachingLang: 'hi-IN' },
      );

      expect(report.coaching).toMatchObject({ text: devanagari.text });
    });
  });

  describe('frustration', () => {
    it('holds each mood from its segment to the customer’s next one, calm before the first', () => {
      const { report } = build();

      expect(report.frustration.ranges).toEqual([
        { start: 0, end: 5, level: 'calm' },
        { start: 5, end: 15, level: 'annoyed' },
        { start: 15, end: 30, level: 'angry' },
        { start: 30, end: 35, level: 'calm' },
      ]);
      expect(report.frustration_peak).toBe('angry');
      expect(report.frustration_end).toBe('calm');
      expect(report.frustration.turn).toEqual({ segment_id: 3, time: 15 });
    });

    it('runs to the later of the call length and the last segment', () => {
      const lastRangeEnd = (durationSeconds: number) =>
        build({}, { durationSeconds }).report.frustration.ranges.at(-1)?.end;

      expect(lastRangeEnd(60)).toBe(60);
      expect(lastRangeEnd(10)).toBe(34.5);
    });

    it('carries the previous mood into a customer segment without one', () => {
      const { report } = build({
        customer_mood: [{ segment_id: 1, level: 'annoyed' }],
      });

      expect(report.frustration.ranges).toEqual([
        { start: 0, end: 5, level: 'calm' },
        { start: 5, end: 35, level: 'annoyed' },
      ]);
      expect(report.frustration_end).toBe('annoyed');
      expect(report.frustration.turn).toEqual({ segment_id: 1, time: 5 });
    });

    it('ignores moods given to segments the customer did not speak', () => {
      const { report } = build({
        customer_mood: [
          { segment_id: 2, level: 'angry' },
          { segment_id: 99, level: 'angry' },
        ],
      });

      expect(report.frustration_peak).toBe('calm');
      expect(report.frustration.turn).toBeNull();
    });

    it('takes moods from every speaker labelled customer', () => {
      const { report } = build({
        speakers: [
          ...speakers.filter((s) => s.speaker_id !== HUMAN),
          { speaker_id: HUMAN, role: 'customer', name: null },
        ],
        customer_mood: [{ segment_id: 5, level: 'angry' }],
      });

      expect(report.frustration.turn).toEqual({ segment_id: 5, time: 25 });
    });

    it('is one calm range when no speaker is the customer', () => {
      const { report } = build({
        speakers: speakers.filter((s) => s.role !== 'customer'),
      });

      expect(report.frustration).toEqual({
        ranges: [{ start: 0, end: 35, level: 'calm' }],
        turn: null,
      });
      expect(report.frustration_peak).toBe('calm');
      expect(report.frustration_end).toBe('calm');
    });
  });
});
