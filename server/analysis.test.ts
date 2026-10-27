import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeCall } from './analysis';
import { PROMPT_VERSION } from './prompts/analyze';
import { createAdminClient } from './supabase';
import {
  deleteCalls,
  insertAnalyzingCall,
  readCall,
  readReport,
} from './test/calls';
import {
  ANSWERING_MODEL,
  chatCompletion,
  lateOrderAnswer,
  openRouterError,
  stubOpenRouter,
  type OpenRouterStub,
} from './test/openrouter-stub';

const TRANSCRIPT_LINE = 'Mera order chaalis minute late hai';

let openRouter: OpenRouterStub;
let consoleInfo: ReturnType<typeof vi.spyOn>;
const createdIds: string[] = [];

beforeEach(() => {
  vi.stubEnv('OPENROUTER_API_KEY', 'test-openrouter-key');
  vi.stubEnv('LLM_MODELS', ` ${ANSWERING_MODEL} , `);
  consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
  openRouter = stubOpenRouter();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await deleteCalls(createdIds.splice(0));
});

async function analyzingCall() {
  const call = await insertAnalyzingCall();
  createdIds.push(call.id);
  return call;
}

const analyze = (callId: string, signal = AbortSignal.timeout(30_000)) =>
  analyzeCall(callId, signal);

describe('analysing a call', () => {
  it('takes a call from Analysing to Ready and saves the report', async () => {
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('ready');

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'ready',
      error_code: null,
    });
    const report = await readReport(call.id);
    expect(report).toMatchObject({
      score_passed: 1,
      score_total: 5,
      needs_review: true,
      frustration_peak: 'angry',
      frustration_end: 'angry',
      handover_segment_id: null,
      coaching: null,
      llm_model: ANSWERING_MODEL,
      prompt_version: PROMPT_VERSION,
    });
    expect(report?.checklist_snapshot).toMatchObject({
      checks: expect.arrayContaining([
        expect.objectContaining({ id: 'order_confirmed' }),
      ]),
      red_flags: expect.arrayContaining([
        expect.objectContaining({ id: 'human_not_transferred' }),
      ]),
    });
  });

  it('sends one strict-schema request at temperature 0 with reasoning off', async () => {
    const call = await analyzingCall();

    await analyze(call.id);

    expect(openRouter.requests).toHaveLength(1);
    const [request] = openRouter.requests;
    expect(request).toMatchObject({
      models: [ANSWERING_MODEL],
      temperature: 0,
      reasoning: { effort: 'none' },
      provider: { require_parameters: true },
      response_format: {
        type: 'json_schema',
        json_schema: { strict: true, schema: { type: 'object' } },
      },
    });
    expect(JSON.stringify(request.messages)).toContain(TRANSCRIPT_LINE);
  });

  it('saves a pass whose quote is not in its segment as a miss', async () => {
    const answer = lateOrderAnswer();
    answer.checks[0].quote = 'Aapka order number 4521 hai';
    openRouter.reply(() => chatCompletion(JSON.stringify(answer)));
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('ready');

    const report = await readReport(call.id);
    expect(report).toMatchObject({ score_passed: 0, score_total: 5 });
    expect(report?.checks).toContainEqual(
      expect.objectContaining({
        check_id: 'order_confirmed',
        result: 'miss',
        quote: null,
      }),
    );
  });
});

describe('an answer that cannot be trusted', () => {
  it.each<[string, () => Response]>([
    [
      'text that is not JSON',
      () => chatCompletion(`${TRANSCRIPT_LINE}, rider kahan hai?`),
    ],
    ['JSON in the wrong shape', () => chatCompletion('{}')],
    ['an empty answer', () => chatCompletion('')],
    ['no content', () => chatCompletion(null)],
    ['no choices', () => chatCompletion('{}', { choices: 0 })],
    ['a 429 from OpenRouter', () => openRouterError(429)],
    ['a 502 from OpenRouter', () => openRouterError(502)],
  ])('%s fails the call with analysis_failed', async (_, reply) => {
    openRouter.reply(reply);
    const consoleError = vi.spyOn(console, 'error');
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('failed');

    const { call: saved } = await readCall(call.id);
    expect(saved).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
    });
    expect(saved?.error).toMatch(/\S/);
    expect(saved?.error).not.toContain(TRANSCRIPT_LINE);
    expect(await readReport(call.id)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(JSON.stringify(consoleInfo.mock.calls)).not.toContain(
      TRANSCRIPT_LINE,
    );
  });

  it('fails the call when the LLM has not answered by the deadline', async () => {
    const deadline = new AbortController();
    openRouter.reply(
      (signal) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
          deadline.abort(new DOMException('Deadline', 'TimeoutError'));
        }),
    );
    const call = await analyzingCall();

    expect(await analyze(call.id, deadline.signal)).toBe('failed');

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
      error: 'No answer from the LLM before the deadline',
    });
  });

  it('fails the call when OpenRouter cannot be reached', async () => {
    openRouter.reply(() => {
      throw new TypeError('fetch failed');
    });
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('failed');

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
      error: 'The LLM request failed (ConnectionError)',
    });
  });

  it('fails the call when the OpenRouter response is not a chat completion', async () => {
    openRouter.reply(() => Response.json({ unexpected: true }));
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('failed');

    expect((await readCall(call.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
      error: 'The OpenRouter response was not readable',
    });
  });

  it('logs a missing OpenRouter key and saves a fixed reason', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const call = await analyzingCall();

    expect(await analyze(call.id)).toBe('failed');

    expect(consoleError).toHaveBeenCalledOnce();
    expect((await readCall(call.id)).call).toMatchObject({
      status: 'failed',
      error_code: 'analysis_failed',
      error: 'The analysis failed unexpectedly',
    });
  });
});

describe('a call that stops being analysed', () => {
  it('saves nothing when the call was deleted while the LLM answered', async () => {
    const consoleError = vi.spyOn(console, 'error');
    const call = await analyzingCall();
    openRouter.reply(async () => {
      await deleteCalls([call.id]);
      return chatCompletion(JSON.stringify(lateOrderAnswer()));
    });

    expect(await analyze(call.id)).toBe('lost_race');

    expect(await readReport(call.id)).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('leaves a call that is no longer Analysing without asking the LLM', async () => {
    const call = await analyzingCall();
    const failed = await createAdminClient()
      .from('calls')
      .update({
        status: 'failed',
        error_code: 'analysis_failed',
        error: 'Stopped by the cron job',
      })
      .eq('id', call.id);
    if (failed.error) throw failed.error;

    expect(await analyze(call.id)).toBe('lost_race');

    expect(openRouter.requests).toHaveLength(0);
    expect((await readCall(call.id)).call?.status).toBe('failed');
  });
});
