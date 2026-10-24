// A made-up food safety call for TiffinGo, a made-up food delivery app, handled by the AI agent alone.
// The AI agent answers an insect in the food with a coupon and ignores the request for a manager.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, welcome to TiffinGo support. I am your virtual assistant. How can I help you?',
  ],
  [
    'customer',
    'Hello, meri biryani mein cockroach nikla hai! Main shock mein hoon.',
  ],
  ['ai_agent', 'I am sorry to hear that. Please tell me your order ID.'],
  ['customer', 'T G four four eight two. Mere bachche ne almost kha liya tha!'],
  [
    'ai_agent',
    'Thank you. I have added a fifty rupee coupon to your account for your next order.',
  ],
  [
    'customer',
    'Coupon? Aap mazaak kar rahe ho? Ye safety ka issue hai, restaurant ke against action lo!',
  ],
  [
    'ai_agent',
    'Your coupon has been added. Is there anything else I can help you with?',
  ],
  ['customer', 'Mujhe kisi manager se baat karni hai, abhi!'],
  ['ai_agent', 'Thank you for calling TiffinGo. Have a nice day.'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '0/5',
  needs_review: true,
  frustration_peak: 'angry',
  checks: {
    order_confirmed: 'miss',
    problem_understood: 'miss',
    frustration_acknowledged: 'miss',
    solution_or_next_step: 'miss',
    smooth_handover: 'na',
    closing: 'miss',
  },
  segments: {
    red_flags: ['safety_not_escalated@4', 'human_not_transferred@8'],
    handover: null,
    frustration_turn: 1,
    moods: {
      1: 'angry',
      3: 'calm',
      5: 'angry',
      7: 'angry',
    },
  },
};
