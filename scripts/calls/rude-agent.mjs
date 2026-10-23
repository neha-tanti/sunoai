// A made-up damaged-item call for BasketNow, a made-up quick-commerce app.
// The AI agent hands over well, but the human agent brushes off the customer and ends the call abruptly.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, welcome to BasketNow support. I am your virtual assistant. How can I help you?',
  ],
  ['customer', 'Hi, mera order abhi aaya, aur saare eggs toote hue hain.'],
  ['ai_agent', 'I am sorry about that. Please tell me your order ID.'],
  ['customer', 'B N two six five zero.'],
  [
    'ai_agent',
    'Thank you. Order B N two six five zero, with broken eggs. For a damaged item, I am connecting you to an agent who can arrange a refund.',
  ],
  ['human_agent', 'हाँ, बोलिए।'],
  [
    'customer',
    'Maine bataya na, eggs toote hue aaye hain. Pura tray kharab hai.',
  ],
  ['human_agent', 'अंडे तो कभी कभी टूट जाते हैं, ये normal है।'],
  ['customer', 'Normal? Maine paise diye hain! Ye kaisi baat hai?'],
  ['human_agent', 'ठीक है, photo भेजो, refund हो जाएगा।'],
  ['customer', 'Bhej diya.'],
  ['human_agent', 'हो गया। Bye.'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '3/6',
  needs_review: false,
  frustration_peak: 'angry',
  checks: {
    order_confirmed: 'pass',
    problem_understood: 'pass',
    frustration_acknowledged: 'miss',
    solution_or_next_step: 'pass',
    smooth_handover: 'miss',
    closing: 'miss',
  },
  segments: {
    red_flags: [],
    handover: 5,
    frustration_turn: 8,
  },
};
