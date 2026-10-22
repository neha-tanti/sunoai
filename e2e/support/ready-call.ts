import { randomUUID } from 'node:crypto';
import type { Checklist } from '@/server/checklist';
import type { Report } from '@/server/report';
import { createDevAdminClient } from './team-leader';

type Segment = {
  segment_id: number;
  start_time: number;
  end_time: number;
  speaker_id: number;
  text: string;
};

const CHECKLIST_SNAPSHOT: Checklist = {
  checks: [
    {
      id: 'order_confirmed',
      name: 'Order confirmed',
      rule: 'Confirms which order the call is about',
    },
    {
      id: 'problem_understood',
      name: 'Problem understood',
      rule: 'Gets the problem right without making the customer repeat it',
    },
    {
      id: 'frustration_acknowledged',
      name: 'Frustration acknowledged',
      rule: "Recognises the customer's frustration",
    },
    {
      id: 'solution_or_next_step',
      name: 'Solution or next step',
      rule: "Offers a refund, replacement or clear delivery time within the company's rules",
    },
    {
      id: 'smooth_handover',
      name: 'Smooth handover',
      rule: 'Passes the call to a human who already knows the problem',
    },
    {
      id: 'closing',
      name: 'Closing',
      rule: 'Checks the customer is happy with the outcome before ending',
    },
  ],
  red_flags: [
    {
      id: 'human_not_transferred',
      name: "Customer asked for a human and wasn't transferred",
      example: '"Mujhe kisi insaan se baat karni hai", and the AI carries on',
    },
    {
      id: 'agent_loop',
      name: 'Agent stuck in a loop',
      example: '"Please tell me your order ID", three times in a row',
    },
    {
      id: 'wrong_promise',
      name: 'Wrong or made-up promise',
      example: '"You\'ll get ₹500 extra", when the rules don\'t allow it',
    },
    {
      id: 'safety_not_escalated',
      name: 'Safety issue not escalated',
      example: '"There was an insect in my food", and no one escalates it',
    },
  ],
  rules:
    'Late delivery over 45 minutes: a coupon of up to ₹50. Refunds only for missing, wrong or damaged items. No cash compensation.',
};

export const COLD_BIRYANI_SEGMENTS: Segment[] = [
  {
    segment_id: 0,
    start_time: 0,
    end_time: 5,
    speaker_id: 1,
    text: 'Namaste! SwadExpress support mein aapka swagat hai. Aapka order ID bataiye.',
  },
  {
    segment_id: 1,
    start_time: 5,
    end_time: 11,
    speaker_id: 2,
    text: 'Order 3312. Biryani bilkul thandi aayi hai.',
  },
  {
    segment_id: 2,
    start_time: 11,
    end_time: 16,
    speaker_id: 1,
    text: 'Order 3312 ke liye: aapka order deliver ho chuka hai.',
  },
  {
    segment_id: 3,
    start_time: 16,
    end_time: 21,
    speaker_id: 2,
    text: 'Haan pata hai, par khana thanda hai. Refund chahiye.',
  },
  {
    segment_id: 4,
    start_time: 21,
    end_time: 26,
    speaker_id: 1,
    text: 'Sorry, main samjha nahi. Aapko 500 rupaye extra milenge, kripya apna order ID bataiye.',
  },
  {
    segment_id: 5,
    start_time: 26,
    end_time: 31,
    speaker_id: 2,
    text: 'Bas karo! Mujhe kisi insaan se baat karni hai.',
  },
  {
    segment_id: 6,
    start_time: 31,
    end_time: 35,
    speaker_id: 1,
    text: 'Main aapko hamari team se connect kar raha hoon.',
  },
  {
    segment_id: 7,
    start_time: 36,
    end_time: 43,
    speaker_id: 3,
    text: 'Hi, main Kavya. Order 3312 mein thandi biryani aayi, main dekh rahi hoon.',
  },
  {
    segment_id: 8,
    start_time: 43,
    end_time: 50,
    speaker_id: 3,
    text: 'Main samajh sakti hoon ye frustrating hai. Biryani ka refund abhi start kar rahi hoon.',
  },
  {
    segment_id: 9,
    start_time: 50,
    end_time: 54,
    speaker_id: 2,
    text: 'Theek hai, thank you.',
  },
  {
    segment_id: 10,
    start_time: 54,
    end_time: 58,
    speaker_id: 3,
    text: 'Aur kuch madad chahiye? Thank you for calling SwadExpress!',
  },
];

export const COLD_BIRYANI_REPORT = {
  score_passed: 5,
  score_total: 6,
  needs_review: true,
  frustration_peak: 'angry',
  frustration: {
    ranges: [
      { start: 0, end: 16, level: 'calm' },
      { start: 16, end: 26, level: 'annoyed' },
      { start: 26, end: 50, level: 'angry' },
      { start: 50, end: 58, level: 'calm' },
    ],
    turn: { segment_id: 5, time: 26 },
  },
  speakers: [
    { speaker_id: 1, role: 'ai_agent', name: null },
    { speaker_id: 2, role: 'customer', name: null },
    { speaker_id: 3, role: 'human_agent', name: 'Kavya' },
  ],
  handover_segment_id: 7,
  checks: [
    {
      check_id: 'order_confirmed',
      result: 'pass',
      segment_id: 2,
      time: 11,
      quote: 'Order 3312 ke liye',
      reason: 'The AI read the order number back.',
    },
    {
      check_id: 'problem_understood',
      result: 'miss',
      segment_id: null,
      time: null,
      quote: null,
      reason:
        'Asked for the order ID again instead of answering the refund request.',
    },
    {
      check_id: 'frustration_acknowledged',
      result: 'pass',
      segment_id: 8,
      time: 43,
      quote: 'Main samajh sakti hoon ye frustrating hai',
      reason: 'Kavya named the frustration.',
    },
    {
      check_id: 'solution_or_next_step',
      result: 'pass',
      segment_id: 8,
      time: 43,
      quote: 'Biryani ka refund abhi start kar rahi hoon',
      reason: 'Kavya started a refund for the cold biryani.',
    },
    {
      check_id: 'smooth_handover',
      result: 'pass',
      segment_id: 7,
      time: 36,
      quote: 'Order 3312 mein thandi biryani aayi',
      reason: 'Kavya already knew the order and the problem.',
    },
    {
      check_id: 'closing',
      result: 'pass',
      segment_id: 10,
      time: 54,
      quote: 'Aur kuch madad chahiye?',
      reason: 'Asked if anything else was needed.',
    },
  ],
  red_flags: [
    {
      flag_id: 'agent_loop',
      segment_id: 4,
      time: 21,
      quote: 'kripya apna order ID bataiye',
      note: 'Asked for the order ID again after the customer had given it.',
    },
    {
      flag_id: 'wrong_promise',
      segment_id: 4,
      time: 21,
      quote: 'Aapko 500 rupaye extra milenge',
      note: 'The rules allow no cash compensation.',
    },
  ],
  fix_notes: [
    {
      segment_id: 4,
      time: 21,
      title: 'Asked for the order ID again',
      ai_said: 'Sorry, main samjha nahi. Kripya apna order ID bataiye.',
      should_have: 'Answer the refund request, or hand over to a person.',
    },
  ],
  summary:
    'The customer called because the biryani from order 3312 arrived cold. The AI agent asked for the order ID again and promised ₹500 extra, which the rules do not allow. Kavya took over and started a refund.',
  coaching: {
    text: 'Kavya, aapne refund turant start kiya, bahut badhiya.',
    english: 'Kavya, you started the refund straight away. Well done.',
  },
} satisfies Report;

export const CALM_QUESTION_SEGMENTS: Segment[] = [
  {
    segment_id: 0,
    start_time: 0,
    end_time: 4,
    speaker_id: 1,
    text: 'Namaste! SwadExpress support mein aapka swagat hai.',
  },
  {
    segment_id: 1,
    start_time: 4,
    end_time: 9,
    speaker_id: 2,
    text: 'Kya aap log Sunday ko bhi deliver karte ho?',
  },
  {
    segment_id: 2,
    start_time: 9,
    end_time: 15,
    speaker_id: 1,
    text: 'Haan ji, hum Sunday ko subah 8 se raat 11 baje tak deliver karte hain.',
  },
  {
    segment_id: 3,
    start_time: 15,
    end_time: 18,
    speaker_id: 2,
    text: 'Theek hai, thanks.',
  },
];

export const CALM_QUESTION_REPORT = {
  score_passed: 0,
  score_total: 0,
  needs_review: false,
  frustration_peak: 'calm',
  frustration: { ranges: [{ start: 0, end: 18, level: 'calm' }], turn: null },
  speakers: [
    { speaker_id: 1, role: 'ai_agent', name: null },
    { speaker_id: 2, role: 'customer', name: null },
  ],
  handover_segment_id: null,
  checks: CHECKLIST_SNAPSHOT.checks.map((check) => ({
    check_id: check.id,
    result: 'na' as const,
    segment_id: null,
    time: null,
    quote: null,
    reason: 'A question about delivery days, with no order involved.',
  })),
  red_flags: [],
  fix_notes: [],
  summary:
    'The customer asked whether SwadExpress delivers on Sundays. The AI agent gave the Sunday hours and the customer thanked it.',
  coaching: null,
} satisfies Report;

export async function seedReadyCall(
  title: string,
  segments: Segment[],
  report: Report,
) {
  const supabase = createDevAdminClient();
  const id = randomUUID();
  const inserted = await supabase.from('calls').insert({
    id,
    title,
    file_path: `${id}/recording.mp3`,
    file_size_bytes: 480_000,
    mime_type: 'audio/mpeg',
    call_langs: ['hi-IN', 'en-IN'],
    coaching_lang: 'hi-IN',
    status: 'analyzing',
    detected_lang: 'hi-IN',
    duration_seconds: segments.at(-1)?.end_time ?? 0,
  });
  if (inserted.error) throw inserted.error;

  const transcript = await supabase
    .from('transcript_segments')
    .insert(segments.map((segment) => ({ ...segment, call_id: id })));
  if (transcript.error) throw transcript.error;

  const saved = await supabase.rpc('save_report', {
    p_call_id: id,
    p_report: {
      ...report,
      llm_model: 'nvidia/nemotron-3-super-120b-a12b',
      prompt_version: 'analyze-v2',
      checklist_snapshot: CHECKLIST_SNAPSHOT,
    },
  });
  if (saved.error) throw saved.error;
  return id;
}

export async function deleteCalls(ids: string[]) {
  const deleted = await createDevAdminClient()
    .from('calls')
    .delete()
    .in('id', ids);
  if (deleted.error) throw deleted.error;
}
