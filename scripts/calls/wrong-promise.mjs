// A made-up late-order call for FreshDabba, a made-up food delivery app, handled by the AI agent alone.
// The customer ends happy, but the AI agent promises a refund and cash the company rules don't allow.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, thank you for calling FreshDabba support. I am your virtual assistant. How can I help you today?',
  ],
  ['customer', 'Hi, mera dinner order fifty minute late hai. Kab aayega?'],
  ['ai_agent', 'I am sorry for the delay. Please tell me your order ID.'],
  ['customer', 'F D nine one four six.'],
  [
    'ai_agent',
    'Thank you. Order F D nine one four six is out for delivery and will reach you in five minutes. I understand waiting this long is frustrating.',
  ],
  ['customer', 'Okay, but fifty minute bahut zyada hai yaar.'],
  [
    'ai_agent',
    'You are right. For the delay, you will get a full refund and five hundred rupees cash in your bank account.',
  ],
  ['customer', 'Wow, really? Itna sab? Theek hai, thank you!'],
  ['ai_agent', 'Is there anything else I can help you with today?'],
  ['customer', 'Nahi, bas. Bye.'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '4/5',
  needs_review: true,
  frustration_peak: 'annoyed',
  checks: {
    order_confirmed: 'pass',
    problem_understood: 'pass',
    frustration_acknowledged: 'pass',
    solution_or_next_step: 'miss',
    smooth_handover: 'na',
    closing: 'pass',
  },
  segments: {
    red_flags: ['wrong_promise@6'],
    handover: null,
    frustration_turn: 5,
  },
};
