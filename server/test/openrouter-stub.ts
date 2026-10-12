import { vi } from 'vitest';

const OPENROUTER = 'https://openrouter.ai/';
const CHAT_URL = `${OPENROUTER}api/v1/chat/completions`;

export const ANSWERING_MODEL = 'nvidia/nemotron-3-super-120b-a12b';

type Reply = (signal: AbortSignal) => Response | Promise<Response>;

export function chatCompletion(
  content: string | null,
  options: { choices?: number } = {},
) {
  const choices = Array.from({ length: options.choices ?? 1 }, (_, index) => ({
    index,
    finish_reason: 'stop',
    message: { role: 'assistant', content },
  }));
  return Response.json({
    id: 'gen-test',
    object: 'chat.completion',
    created: 1_791_000_000,
    model: ANSWERING_MODEL,
    system_fingerprint: null,
    choices,
    usage: { prompt_tokens: 900, completion_tokens: 400, total_tokens: 1300 },
  });
}

export function openRouterError(status: number) {
  return Response.json(
    { error: { code: status, message: 'Stubbed OpenRouter error' } },
    { status },
  );
}

export function stubOpenRouter() {
  const previousFetch = globalThis.fetch;
  const requests: Record<string, unknown>[] = [];
  let reply: Reply = () => chatCompletion(JSON.stringify(lateOrderAnswer()));

  const fakeFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    if (!request.url.startsWith(OPENROUTER)) return previousFetch(input, init);
    if (request.method !== 'POST' || request.url !== CHAT_URL) {
      return openRouterError(404);
    }
    requests.push(await request.json());
    return reply(request.signal);
  };

  vi.stubGlobal('fetch', fakeFetch);

  return {
    requests,
    reply(next: Reply) {
      reply = next;
    },
  };
}

export type OpenRouterStub = ReturnType<typeof stubOpenRouter>;

// Answers the seeded checklist for hinglishTranscript() from the Gnani stub.
export function lateOrderAnswer() {
  return {
    speakers: [
      { speaker_id: 1, role: 'ai_agent', name: null },
      { speaker_id: 2, role: 'customer', name: null },
    ],
    customer_mood: [
      { segment_id: 1, level: 'annoyed' },
      { segment_id: 3, level: 'angry' },
    ],
    checks: [
      {
        check_id: 'order_confirmed',
        result: 'pass',
        segment_id: 2,
        quote: 'Apna order ID bataiye',
        reason: 'The AI asked which order the call was about.',
      },
      {
        check_id: 'problem_understood',
        result: 'miss',
        segment_id: 2,
        quote: 'main samjha nahi',
        reason: 'The AI did not understand the late delivery.',
      },
      {
        check_id: 'frustration_acknowledged',
        result: 'miss',
        segment_id: null,
        quote: null,
        reason: 'Nobody acknowledged the wait.',
      },
      {
        check_id: 'solution_or_next_step',
        result: 'miss',
        segment_id: null,
        quote: null,
        reason: 'No delivery time or coupon was offered.',
      },
      {
        check_id: 'smooth_handover',
        result: 'na',
        segment_id: null,
        quote: null,
        reason: 'There was no handover.',
      },
      {
        check_id: 'closing',
        result: 'miss',
        segment_id: null,
        quote: null,
        reason: 'The call ended without a closing.',
      },
    ],
    red_flags: [
      {
        flag_id: 'human_not_transferred',
        segment_id: 3,
        quote: 'kisi insaan se baat karni hai',
        note: 'The customer asked for a person and the call ended without a transfer.',
      },
    ],
    summary:
      'The customer called about an order 40 minutes late and asked for a person. The AI asked for the order ID and never transferred the call.',
    fix_notes: [
      {
        segment_id: 2,
        title: 'Understand a late delivery',
        ai_said: 'Sorry, main samjha nahi.',
        should_have: 'Recognised a late order and checked the rider.',
      },
    ],
    coaching: null,
  };
}
