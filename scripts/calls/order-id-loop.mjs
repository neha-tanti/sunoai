// A made-up wrong-order call for TiffinGo, a made-up food delivery app.
// The AI agent asks for the order ID again and again, then the human agent makes the customer repeat the problem.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, thank you for calling TiffinGo. I am your virtual assistant. How can I help you?',
  ],
  [
    'customer',
    'Hello, maine paneer thali order ki thi, but galat order aa gaya, chicken wala.',
  ],
  ['ai_agent', 'I am sorry to hear that. Please tell me your order ID.'],
  ['customer', 'T G seven three zero one.'],
  ['ai_agent', 'Sorry, I did not understand. Please tell me your order ID.'],
  ['customer', 'T G seven three zero one. T G, seven, three, zero, one.'],
  ['ai_agent', 'Sorry, I did not understand. Please tell me your order ID.'],
  [
    'customer',
    'Arey yaar! Teen baar bata diya. Main vegetarian hoon, aur aapka bot sun hi nahi raha!',
  ],
  ['ai_agent', 'Sorry, I did not understand. Please tell me your order ID.'],
  ['customer', 'Bas karo! Kisi insaan se baat karao abhi!'],
  ['ai_agent', 'Sure, I am connecting you to an agent now.'],
  [
    'human_agent',
    'नमस्ते, मैं विकास बोल रहा हूँ। बताइए, क्या problem है? और आपका order ID क्या है?',
  ],
  [
    'customer',
    'Phir se? T G seven three zero one. Mujhe veg thali chahiye thi, chicken aa gaya.',
  ],
  [
    'human_agent',
    'माफ़ कीजिए, order T G seven three zero one मिल गया। मैं समझ सकता हूँ कि ये बहुत बुरा लगा। Photo भेजिए, मैं पूरा refund करवा देता हूँ।',
  ],
  ['customer', 'Theek hai, bhej rahi hoon.'],
  [
    'human_agent',
    'Photo मिल गई, refund शुरू हो गया है। क्या मैं आपकी और कोई मदद कर सकता हूँ?',
  ],
  ['customer', 'Nahi. Bye.'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '4/6',
  needs_review: true,
  frustration_peak: 'angry',
  checks: {
    order_confirmed: 'pass',
    problem_understood: 'miss',
    frustration_acknowledged: 'pass',
    solution_or_next_step: 'pass',
    smooth_handover: 'miss',
    closing: 'pass',
  },
  segments: {
    red_flags: ['agent_loop@8'],
    handover: 11,
    frustration_turn: 7,
  },
};
