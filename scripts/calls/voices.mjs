const VOICES = {
  ai_agent: { voice: 'Kaveri', language: 'en-IN' },
  customer: { voice: 'Poorvi', language: 'hi-en' },
  human_agent: { voice: 'Deepak', language: 'hi-IN' },
};

export function toLines(script) {
  return script.map(([role, text]) => ({ role, text, ...VOICES[role] }));
}
