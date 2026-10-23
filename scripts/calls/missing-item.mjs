// A made-up quick-commerce call for ZipKart, a made-up app: an item is missing from the bag.
// The AI agent hands over to a human agent who already knows the problem and refunds within the rules.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, welcome to ZipKart support. I am your virtual assistant. How can I help you today?',
  ],
  ['customer', 'Hi, mera order aa gaya, but usme Amul butter missing hai.'],
  [
    'ai_agent',
    'I am sorry about that. Could you please tell me your order ID?',
  ],
  ['customer', 'Haan, Z K one two eight nine.'],
  [
    'ai_agent',
    'Thank you. I can see order Z K one two eight nine. For a refund on a missing item, I am connecting you to an agent who can help right away.',
  ],
  [
    'human_agent',
    'नमस्ते, मैं अमित बोल रहा हूँ। मैं देख रहा हूँ कि आपके order Z K one two eight nine में Amul butter missing है। Sorry, आपको ये परेशानी हुई।',
  ],
  ['customer', 'Haan, wahi. Breakfast ke liye chahiye tha.'],
  [
    'human_agent',
    'मैं समझ सकता हूँ। क्या आप app में bag की एक photo भेज सकते हैं? फिर मैं butter का पूरा refund कर दूँगा।',
  ],
  ['customer', 'Haan, abhi bhej diya.'],
  [
    'human_agent',
    'Photo मिल गई। Fifty five rupees का refund दो दिन में आपके account में आ जाएगा। क्या आप इस solution से खुश हैं?',
  ],
  ['customer', 'Haan, bilkul. Thank you, bahut jaldi ho gaya.'],
  ['human_agent', 'धन्यवाद, आपका दिन अच्छा हो।'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '6/6',
  needs_review: false,
  frustration_peak: 'calm',
  checks: {
    order_confirmed: 'pass',
    problem_understood: 'pass',
    frustration_acknowledged: 'pass',
    solution_or_next_step: 'pass',
    smooth_handover: 'pass',
    closing: 'pass',
  },
  segments: {
    red_flags: [],
    handover: 5,
    frustration_turn: null,
  },
};
