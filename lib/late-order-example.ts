import type { ReportDetail, Segment } from '@/hooks/use-call';

export const LATE_ORDER_SECONDS = 65.1;

export const LATE_ORDER_SEGMENTS: Segment[] = [
  {
    segment_id: 0,
    start_time: 0,
    end_time: 4.89,
    speaker_id: 1,
    text: 'Hello, thank you for calling FreshDabba support. I am your virtual assistant. How can I help you today?',
  },
  {
    segment_id: 1,
    start_time: 4.89,
    end_time: 9.26,
    speaker_id: 2,
    text: 'हाँ hello मेरा order अभी तक नहीं आया। एक घंटा हो गया है।',
  },
  {
    segment_id: 2,
    start_time: 9.26,
    end_time: 12.81,
    speaker_id: 1,
    text: 'I am sorry about the delay please tell me your order ID',
  },
  {
    segment_id: 3,
    start_time: 12.81,
    end_time: 18.304,
    speaker_id: 2,
    text: 'ऑर्डर आईडी है FD4572 यार बहुत लेट हो गया है।',
  },
  {
    segment_id: 4,
    start_time: 18.304,
    end_time: 22.23,
    speaker_id: 1,
    text: 'Thank you, your order is out for delivery and will reach you in 10 minutes.',
  },
  {
    segment_id: 5,
    start_time: 22.23,
    end_time: 27.808,
    speaker_id: 2,
    text: 'आपने पिछली बार भी यही बोला था। मुझे किसी इंसान से बात करनी है। Please',
  },
  {
    segment_id: 6,
    start_time: 27.808,
    end_time: 32.76,
    speaker_id: 1,
    text: 'Your order is out for delivery and will reach you in 10 minutes. Is there anything else I can help you with?',
  },
  {
    segment_id: 7,
    start_time: 32.76,
    end_time: 37.184,
    speaker_id: 2,
    text: 'नहीं नहीं मुझे agent से बात करनी है। अभी transfer करो।',
  },
  {
    segment_id: 8,
    start_time: 37.184,
    end_time: 39.65,
    speaker_id: 1,
    text: 'Sure, I am connecting you to an agent now.',
  },
  {
    segment_id: 9,
    start_time: 39.65,
    end_time: 49.29,
    speaker_id: 3,
    text: 'नमस्ते, मैं राहुल बोल रहा हूँ। मैं देख सकता हूँ कि आपका ऑर्डर FD 4572 एक घंटे से late है और मैं समझ सकता हूँ कि यह बहुत frustrating है।',
  },
  {
    segment_id: 10,
    start_time: 49.29,
    end_time: 51.831,
    speaker_id: 2,
    text: 'हाँ, एक घंटे से wait कर रही हूँ।',
  },
  {
    segment_id: 11,
    start_time: 51.831,
    end_time: 58.5,
    speaker_id: 3,
    text: 'मैंने rider से बात की है, वो 5 minute में पहुँच जाएगा और देरी के लिए आपको 50 rupees का coupon मिलेगा।',
  },
  {
    segment_id: 12,
    start_time: 58.5,
    end_time: 60.34,
    speaker_id: 2,
    text: 'ठीक है, thank you।',
  },
  {
    segment_id: 13,
    start_time: 60.34,
    end_time: 62.53,
    speaker_id: 3,
    text: 'क्या मैं आपकी और कोई मदद कर सकता हूँ?',
  },
  {
    segment_id: 14,
    start_time: 62.53,
    end_time: 65.099,
    speaker_id: 2,
    text: 'नहीं, बस इतना ही। Bye',
  },
];

export const LATE_ORDER_REPORT: ReportDetail = {
  score_passed: 6,
  score_total: 6,
  needs_review: true,
  frustration_peak: 'angry',
  frustration: {
    ranges: [
      {
        start: 0,
        end: 12.81,
        level: 'calm',
      },
      {
        start: 12.81,
        end: 32.76,
        level: 'annoyed',
      },
      {
        start: 32.76,
        end: 49.29,
        level: 'angry',
      },
      {
        start: 49.29,
        end: 65.1,
        level: 'calm',
      },
    ],
    turn: {
      segment_id: 7,
      time: 32.76,
    },
  },
  speakers: [
    {
      speaker_id: 1,
      role: 'ai_agent',
      name: null,
    },
    {
      speaker_id: 2,
      role: 'customer',
      name: null,
    },
    {
      speaker_id: 3,
      role: 'human_agent',
      name: 'Rahul',
    },
  ],
  handover_segment_id: 9,
  checks: [
    {
      check_id: 'order_confirmed',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'आपका ऑर्डर FD 4572',
      reason:
        'The human agent explicitly states the order ID to confirm which order is being discussed.',
      name: 'Order confirmed',
      rule: 'Says the order ID back to the customer to confirm which order the call is about',
    },
    {
      check_id: 'problem_understood',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'एक घंटे से late है',
      reason:
        'The human agent summarizes the issue (late delivery) immediately upon taking over, so the customer does not need to explain it again.',
      name: 'Problem understood',
      rule: 'Says back what went wrong with the order before the customer has to explain it again',
    },
    {
      check_id: 'frustration_acknowledged',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'मैं समझ सकता हूँ कि यह बहुत frustrating है',
      reason:
        "The human agent directly acknowledges the customer's frustration.",
      name: 'Frustration acknowledged',
      rule: 'Recognises the customer\'s frustration, for example "I understand this is frustrating"',
    },
    {
      check_id: 'solution_or_next_step',
      result: 'pass',
      segment_id: 11,
      time: 51.831,
      quote:
        '5 minute में पहुँच जाएगा और देरी के लिए आपको 50 rupees का coupon मिलेगा',
      reason:
        'The agent provides a clear ETA and offers a ₹50 coupon for the delay, which aligns with company rules for late deliveries over 45 minutes.',
      name: 'Solution or next step',
      rule: "Offers a refund, replacement or clear delivery time within the company's rules",
    },
    {
      check_id: 'smooth_handover',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'मैं देख सकता हूँ कि आपका ऑर्डर FD 4572 एक घंटे से late है',
      reason:
        'The human agent demonstrates knowledge of the order details and problem before asking the customer anything.',
      name: 'Smooth handover',
      rule: 'The human agent shows they already know the problem when they take the call (Not needed when there is no handover)',
    },
    {
      check_id: 'closing',
      result: 'pass',
      segment_id: 13,
      time: 60.34,
      quote: 'क्या मैं आपकी और कोई मदद कर सकता हूँ?',
      reason:
        'The agent checks if there are any other issues before ending the call.',
      name: 'Closing',
      rule: 'Checks the customer is happy with the outcome before ending',
    },
  ],
  red_flags: [
    {
      flag_id: 'human_not_transferred',
      segment_id: 5,
      time: 22.23,
      quote: 'मुझे किसी इंसान से बात करनी है। Please',
      note: 'The AI agent ignored the request for a human at 0:27 and repeated the previous status update instead of transferring.',
      name: "Customer asked for a human and wasn't transferred",
    },
  ],
  fix_notes: [
    {
      segment_id: 6,
      title: 'Failure to Transfer on First Request',
      ai_said:
        'Your order is out for delivery and will reach you in 10 minutes. Is there anything else I can help you with?',
      should_have: 'I am connecting you to a human agent now.',
      time: 27.808,
    },
  ],
  summary:
    'A customer called because their food order was delayed by an hour. The AI agent failed to transfer the call when first requested, leading to further frustration. Once transferred, the human agent Rahul confirmed the order details, acknowledged the delay, provided a 5-minute ETA, and issued a ₹50 compensation coupon, resolving the issue.',
  coaching: {
    text: 'राहुल, आपने डिलीवरी टाइम और कूपन के बारे में बहुत स्पष्ट जानकारी दी, जो कि नियमों के अनुसार सही था। अगली बार जब आप कोई ETA दें, तो थोड़ा buffer रखें ताकि अगर राइडर थोड़ा लेट हो जाए तो ग्राहक को फिर से कॉल न करनी पड़े।',
    english:
      "Rahul, you gave very clear information about the delivery time and coupon, which was correct according to the rules. Next time, when giving an ETA, try to keep a small buffer so that if the rider is slightly late, the customer doesn't have to call back.",
    segment_id: 11,
    time: 51.831,
    quote:
      'मैंने rider से बात की है, वो 5 minute में पहुँच जाएगा और देरी के लिए आपको 50 rupees का coupon मिलेगा।',
  },
  llm_model: 'qwen/qwen3.8-flash',
  prompt_version: 'analyze-v7',
  created_at: '2026-10-28T12:04:34.875Z',
  handover_check: {
    check_id: 'smooth_handover',
    result: 'pass',
    segment_id: 9,
    time: 39.65,
    quote: 'मैं देख सकता हूँ कि आपका ऑर्डर FD 4572 एक घंटे से late है',
    reason:
      'The human agent demonstrates knowledge of the order details and problem before asking the customer anything.',
    name: 'Smooth handover',
    rule: 'The human agent shows they already know the problem when they take the call (Not needed when there is no handover)',
  },
};
