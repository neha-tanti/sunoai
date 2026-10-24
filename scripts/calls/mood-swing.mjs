// A made-up wrong-item call for BasketNow, a made-up quick-commerce app: the customer goes from calm to annoyed to angry.
// The AI agent brushes the customer off until they demand a person, then the human agent calms them down and refunds within the rules.

import { toLines } from './voices.mjs';

export const LINES = toLines([
  [
    'ai_agent',
    'Hello, welcome to BasketNow support. I am your virtual assistant. How can I help you today?',
  ],
  ['customer', 'Hi, mera order aaya hai, but usme milk ki jagah curd aa gaya.'],
  ['ai_agent', 'I am sorry about that. Please tell me your order ID.'],
  ['customer', 'S B three seven one five.'],
  [
    'ai_agent',
    'Thank you. I can see order S B three seven one five. Milk is out of stock today, so I cannot send a replacement. You can return the curd from the app.',
  ],
  [
    'customer',
    'Par mujhe kal subah ke liye milk chahiye tha. Har baar kuch na kuch galat aata hai, ye theek nahi hai.',
  ],
  ['ai_agent', 'I understand. You can return the curd from the app.'],
  [
    'customer',
    'Aap sun bhi rahe ho? Return nahi chahiye mujhe! Kisi agent se baat karao, abhi!',
  ],
  ['ai_agent', 'Sure, I am connecting you to an agent now.'],
  [
    'human_agent',
    'नमस्ते, मैं अर्जुन बोल रहा हूँ। मैं देख रहा हूँ कि आपके order S B three seven one five में milk की जगह curd आया है। Sorry, मैं समझ सकता हूँ कि ये बहुत frustrating है।',
  ],
  ['customer', 'Haan. Mujhe bas milk ka paisa wapas chahiye.'],
  [
    'human_agent',
    'बिल्कुल। आप app में curd की एक photo भेज दीजिए, फिर मैं milk का पूरा refund कर दूँगा।',
  ],
  ['customer', 'Theek hai, bhej diya.'],
  [
    'human_agent',
    'Photo मिल गई। Forty rupees का refund दो दिन में आपके account में आ जाएगा। क्या आप इस solution से खुश हैं?',
  ],
  ['customer', 'Haan, theek hai. Thank you, aapne achhe se samjha.'],
  ['human_agent', 'धन्यवाद, आपका दिन अच्छा हो।'],
]);

// Written down before the first run (testing.md).
export const EXPECTED = {
  score: '6/6',
  needs_review: false,
  frustration_peak: 'angry',
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
    handover: 9,
    frustration_turn: 7,
    moods: {
      1: 'calm',
      3: 'calm',
      5: 'annoyed',
      7: 'angry',
      10: 'calm',
      12: 'calm',
      14: 'calm',
    },
  },
};
