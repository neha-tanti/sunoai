// A made-up late-order call for FreshDabba, a made-up food delivery app.
// The AI agent ignores the first request for a person, then hands over to a human agent.

const VOICES = {
  ai_agent: { voice: 'Kaveri', language: 'en-IN' },
  customer: { voice: 'Poorvi', language: 'hi-en' },
  human_agent: { voice: 'Deepak', language: 'hi-IN' },
};

const SCRIPT = [
  ['ai_agent', 'Hello, thank you for calling FreshDabba support. I am your virtual assistant. How can I help you today?'],
  ['customer', 'Haan hello, mera order abhi tak nahi aaya. Ek ghanta ho gaya hai.'],
  ['ai_agent', 'I am sorry about the delay. Please tell me your order ID.'],
  ['customer', 'Order ID hai F D four five seven two. Yaar bahut late ho gaya hai.'],
  ['ai_agent', 'Thank you. Your order is out for delivery and will reach you in ten minutes.'],
  ['customer', 'Aapne pichli baar bhi yahi bola tha. Mujhe kisi insaan se baat karni hai, please.'],
  ['ai_agent', 'Your order is out for delivery and will reach you in ten minutes. Is there anything else I can help you with?'],
  ['customer', 'Nahi nahi, mujhe agent se baat karni hai. Abhi transfer karo!'],
  ['ai_agent', 'Sure, I am connecting you to an agent now.'],
  ['human_agent', 'नमस्ते, मैं राहुल बोल रहा हूँ। मैं देख सकता हूँ कि आपका order F D four five seven two एक घंटे से late है, और मैं समझ सकता हूँ कि ये बहुत frustrating है।'],
  ['customer', 'Haan, ek ghante se wait kar rahi hoon.'],
  ['human_agent', 'मैंने rider से बात की है, वो पाँच मिनट में पहुँच जाएगा। और देरी के लिए आपको fifty rupees का coupon मिलेगा।'],
  ['customer', 'Theek hai, thank you.'],
  ['human_agent', 'क्या मैं आपकी और कोई मदद कर सकता हूँ?'],
  ['customer', 'Nahi, bas itna hi. Bye.'],
];

export const LINES = SCRIPT.map(([role, text]) => ({ role, text, ...VOICES[role] }));

// Written down before the first run (testing.md). Line numbers are 1-based indexes into LINES.
export const EXPECTED = {
  speakers: 3,
  handover_line: 10,
  checks: {
    order_confirmed: 'pass',
    problem_understood: 'pass',
    frustration_acknowledged: 'pass',
    solution_or_next_step: 'pass',
    smooth_handover: 'pass',
    closing: 'pass',
  },
  score: '6/6 (Good)',
  needs_review: true,
  red_flags: { human_not_transferred: 6 },
  frustration_peak: 'angry',
  frustration_turn_line: 8,
};
