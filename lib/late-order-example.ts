import type { ReportDetail, Segment } from '@/hooks/use-call';

export const LATE_ORDER_SECONDS = 65.1;

export const LATE_ORDER_SEGMENTS: Segment[] = [
  {
    segment_id: 0,
    start_time: 0,
    end_time: 4.89,
    speaker_id: 1,
    text: 'hello thank you for calling fresh dabba support i am your virtual assistant how can i help you today',
  },
  {
    segment_id: 1,
    start_time: 4.89,
    end_time: 9.26,
    speaker_id: 2,
    text: 'हाँ हेलो, मेरा ऑर्डर अभी तक नहीं आया, एक घंटा हो गया है।',
  },
  {
    segment_id: 2,
    start_time: 9.26,
    end_time: 12.81,
    speaker_id: 1,
    text: 'i am sorry about the delay please tell me your order id',
  },
  {
    segment_id: 3,
    start_time: 12.81,
    end_time: 18.304,
    speaker_id: 2,
    text: 'ऑर्डर आई डी है एफ डी 4572 यार बहुत लेट हो गया है।',
  },
  {
    segment_id: 4,
    start_time: 18.304,
    end_time: 22.23,
    speaker_id: 1,
    text: 'thank you your order is out for delivery and will reach you in 10 minutes',
  },
  {
    segment_id: 5,
    start_time: 22.23,
    end_time: 27.808,
    speaker_id: 2,
    text: 'आपने पिछली बार भी यही बोला था, मुझे किसी इंसान से बात करनी है, प्लीज।',
  },
  {
    segment_id: 6,
    start_time: 27.808,
    end_time: 32.76,
    speaker_id: 1,
    text: 'your order is out for delivery and will reach you in 10 minutes is there anything else i can help you with',
  },
  {
    segment_id: 7,
    start_time: 32.76,
    end_time: 37.184,
    speaker_id: 2,
    text: 'नहीं नहीं मुझे एजेंट से बात करनी है अभी ट्रांसफर करो।',
  },
  {
    segment_id: 8,
    start_time: 37.184,
    end_time: 39.65,
    speaker_id: 1,
    text: 'sure i am connecting you to an agent now',
  },
  {
    segment_id: 9,
    start_time: 39.65,
    end_time: 49.29,
    speaker_id: 3,
    text: 'नमस्ते, मैं राहुल बोल रहा हूँ, मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है और मैं समझ सकता हूँ कि यह बहुत फ्रस्ट्रेटिंग है।',
  },
  {
    segment_id: 10,
    start_time: 49.29,
    end_time: 51.831,
    speaker_id: 2,
    text: 'हाँ एक घंटे से वेट कर रही हूँ।',
  },
  {
    segment_id: 11,
    start_time: 51.831,
    end_time: 58.5,
    speaker_id: 3,
    text: 'मैंने राइडर से बात की है, वो 5 मिनट में पहुँच जाएगा और देरी के लिए आपको ₹50 का कूपन मिलेगा।',
  },
  {
    segment_id: 12,
    start_time: 58.5,
    end_time: 60.34,
    speaker_id: 2,
    text: 'ठीक है, थैंक यू।',
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
    text: 'नहीं, बस इतना ही बाएं।',
  },
];

export const LATE_ORDER_REPORT: ReportDetail = {
  score_passed: 6,
  score_total: 6,
  needs_review: true,
  frustration_peak: 'angry',
  frustration: {
    turn: {
      time: 32.76,
      segment_id: 7,
    },
    ranges: [
      {
        end: 12.81,
        level: 'calm',
        start: 0,
      },
      {
        end: 32.76,
        level: 'annoyed',
        start: 12.81,
      },
      {
        end: 49.29,
        level: 'angry',
        start: 32.76,
      },
      {
        end: 65.1,
        level: 'calm',
        start: 49.29,
      },
    ],
  },
  speakers: [
    {
      name: null,
      role: 'ai_agent',
      speaker_id: 1,
    },
    {
      name: null,
      role: 'customer',
      speaker_id: 2,
    },
    {
      name: 'Rahul',
      role: 'human_agent',
      speaker_id: 3,
    },
  ],
  handover_segment_id: 9,
  checks: [
    {
      time: 39.65,
      quote: 'आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent confirmed the order ID and status immediately after handover.',
      result: 'pass',
      check_id: 'order_confirmed',
      segment_id: 9,
      name: 'Order confirmed',
      rule: 'Confirms which order the call is about',
    },
    {
      time: 39.65,
      quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent acknowledged the delay without asking the customer to repeat details.',
      result: 'pass',
      check_id: 'problem_understood',
      segment_id: 9,
      name: 'Problem understood',
      rule: 'Gets the problem right without making the customer repeat it',
    },
    {
      time: 39.65,
      quote: 'मैं समझ सकता हूँ कि यह बहुत फ्रस्ट्रेटिंग है',
      reason:
        "The human agent explicitly validated the customer's frustration.",
      result: 'pass',
      check_id: 'frustration_acknowledged',
      segment_id: 9,
      name: 'Frustration acknowledged',
      rule: 'Recognises the customer\'s frustration, for example "I understand this is frustrating"',
    },
    {
      time: 51.831,
      quote: 'वो 5 मिनट में पहुँच जाएगा और देरी के लिए आपको ₹50 का कूपन मिलेगा',
      reason:
        'The agent provided a specific delivery time and offered a coupon within company rules for late delivery.',
      result: 'pass',
      check_id: 'solution_or_next_step',
      segment_id: 11,
      name: 'Solution or next step',
      rule: "Offers a refund, replacement or clear delivery time within the company's rules",
    },
    {
      time: 39.65,
      quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent had access to the order details and did not ask the customer to repeat them.',
      result: 'pass',
      check_id: 'smooth_handover',
      segment_id: 9,
      name: 'Smooth handover',
      rule: 'Passes the call to a human who already knows the problem (Not needed when there is no handover)',
    },
    {
      time: 60.34,
      quote: 'क्या मैं आपकी और कोई मदद कर सकता हूँ?',
      reason:
        'The agent checked if there was anything else needed before ending the call.',
      result: 'pass',
      check_id: 'closing',
      segment_id: 13,
      name: 'Closing',
      rule: 'Checks the customer is happy with the outcome before ending',
    },
  ],
  red_flags: [
    {
      note: "The AI agent ignored the customer's request for a human at 0:22 and repeated the same scripted response instead of transferring immediately.",
      time: 27.808,
      quote:
        'your order is out for delivery and will reach you in 10 minutes is there anything else i can help you with',
      flag_id: 'human_not_transferred',
      segment_id: 6,
      name: "Customer asked for a human and wasn't transferred",
    },
  ],
  fix_notes: [
    {
      time: 27.808,
      title: 'Failure to Transfer on First Request',
      ai_said:
        'your order is out for delivery and will reach you in 10 minutes is there anything else i can help you with',
      segment_id: 6,
      should_have:
        'I understand you want to speak to a person. Connecting you now.',
    },
  ],
  summary:
    'The customer called about an order delayed by one hour. The AI agent failed to transfer the call when first asked, causing frustration until the customer demanded it again. The human agent Rahul took over, confirmed the delay, offered a ₹50 coupon and a 5-minute ETA, and closed the call successfully.',
  coaching: {
    text: "राहुल, आपने सही समय पर ₹50 का कूपन दिया जो कंपनी के नियमों के अनुसार था, यह अच्छा रहा। अगली बार जब ग्राहक पहले से ही नाराज़ हो, तो थोड़ा और सहानुभूति दिखाएं, जैसे 'मुझे पता है एक घंटा वेट करना आसान नहीं था' कहकर शुरुआत करें। इससे ग्राहक को लगेगा कि आप उनकी तकलीफ को वास्तव में महसूस कर रहे हैं।",
    time: 51.831,
    quote:
      'मैंने राइडर से बात की है, वो 5 मिनट में पहुँच जाएगा और देरी के लिए आपको ₹50 का कूपन मिलेगा।',
    english:
      "Rahul, offering the ₹50 coupon at the right time as per company rules was good. Next time, when the customer is already upset, show a bit more empathy by starting with something like 'I know waiting for an hour wasn't easy.' This makes the customer feel that you truly acknowledge their trouble.",
    segment_id: 11,
  },
  llm_model: 'qwen/qwen3.8-flash',
  prompt_version: 'analyze-v4',
  created_at: '2026-10-25T09:48:26.120117+00:00',
  handover_check: {
    time: 39.65,
    quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
    reason:
      'The human agent had access to the order details and did not ask the customer to repeat them.',
    result: 'pass',
    check_id: 'smooth_handover',
    segment_id: 9,
    name: 'Smooth handover',
    rule: 'Passes the call to a human who already knows the problem (Not needed when there is no handover)',
  },
};
