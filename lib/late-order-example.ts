import type { ReportDetail, Segment } from '@/hooks/use-call';

export const LATE_ORDER_SECONDS = 65.1;

export const LATE_ORDER_ASK = {
  quote: 'मुझे किसी इंसान से बात करनी है',
  translation: 'I want to talk to a person',
};

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
      quote: 'आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent explicitly states the order ID and status to confirm the context.',
      name: 'Order confirmed',
      rule: 'Says the order ID back to the customer to confirm which order the call is about',
    },
    {
      check_id: 'problem_understood',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent acknowledges the delay issue immediately upon taking over.',
      name: 'Problem understood',
      rule: 'Says back what went wrong with the order before the customer has to explain it again',
    },
    {
      check_id: 'frustration_acknowledged',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'मैं समझ सकता हूँ कि यह बहुत फ्रस्ट्रेटिंग है',
      reason:
        "The human agent validates the customer's feelings about the delay.",
      name: 'Frustration acknowledged',
      rule: 'Recognises the customer\'s frustration, for example "I understand this is frustrating"',
    },
    {
      check_id: 'solution_or_next_step',
      result: 'pass',
      segment_id: 11,
      time: 51.831,
      quote: 'वो 5 मिनट में पहुँच जाएगा और देरी के लिए आपको ₹50 का कूपन मिलेगा',
      reason:
        'The agent provides a specific delivery time and offers a coupon within company rules for late delivery.',
      name: 'Solution or next step',
      rule: "Offers a refund, replacement or clear delivery time within the company's rules",
    },
    {
      check_id: 'smooth_handover',
      result: 'pass',
      segment_id: 9,
      time: 39.65,
      quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
      reason:
        'The human agent demonstrates knowledge of the order details without asking the customer to repeat them.',
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
      quote: 'मुझे किसी इंसान से बात करनी है, प्लीज।',
      note: 'The AI agent ignored the request for a human at 0:27, repeating the same status update instead of transferring.',
      name: "Customer asked for a human and wasn't transferred",
    },
  ],
  fix_notes: [
    {
      segment_id: 6,
      title: 'Failure to Transfer on Request',
      ai_said:
        'your order is out for delivery and will reach you in 10 minutes is there anything else i can help you with',
      should_have: 'I am connecting you to a human agent now.',
      time: 27.808,
    },
  ],
  summary:
    'The customer called because their food order was delayed by an hour. The AI agent failed to transfer the call when first requested, causing frustration until the customer demanded it again. A human agent took over, confirmed the order details, apologized for the delay, provided a 5-minute ETA, and issued a ₹50 coupon.',
  coaching: {
    text: "राहुल, आपने हैंडओवर पर ऑर्डर आईडी और समस्या की पुष्टि करके बहुत अच्छा काम किया, जिससे ग्राहक को दोबारा जानकारी देने की जरूरत नहीं पड़ी। अगली बार आप शुरुआत में ही थोड़ा अधिक सहानुभूति दिखा सकते हैं, जैसे 'माफ़ कीजिए, हमारी सेवा में यह देरी स्वीकार्य नहीं है', ताकि ग्राहक तुरंत महसूस कर सके कि उनकी चिंता सुनी गई है।",
    english:
      "Rahul, you did a great job confirming the order ID and problem at handover, saving the customer from repeating information. Next time, you could show slightly more empathy right at the start, such as 'Sorry, this delay in our service is unacceptable,' so the customer immediately feels their concern is heard.",
    segment_id: 9,
    time: 39.65,
    quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
  },
  llm_model: 'qwen/qwen3.8-flash',
  prompt_version: 'analyze-v6',
  created_at: '2026-10-27T17:48:43.830Z',
  handover_check: {
    check_id: 'smooth_handover',
    result: 'pass',
    segment_id: 9,
    time: 39.65,
    quote: 'मैं देख सकता हूँ कि आपका ऑर्डर एफ डी 45721 घंटे से लेट है',
    reason:
      'The human agent demonstrates knowledge of the order details without asking the customer to repeat them.',
    name: 'Smooth handover',
    rule: 'The human agent shows they already know the problem when they take the call (Not needed when there is no handover)',
  },
};
