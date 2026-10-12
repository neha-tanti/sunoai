import 'server-only';
import { OpenRouterError } from '@openrouter/sdk/models/errors';
import { loadChecklist } from './checklist';
import { requestAnalysis } from './llm';
import { failCall } from './pipeline';
import {
  buildMessages,
  llmAnswerSchema,
  PROMPT_VERSION,
} from './prompts/analyze';
import { buildReport } from './report';
import { createAdminClient } from './supabase';

export type AnalysisOutcome = 'ready' | 'failed' | 'lost_race';

type Analysis = { outcome: AnalysisOutcome; detail: string };

class AnalysisFailure extends Error {}

export async function analyzeCall(
  callId: string,
  signal: AbortSignal,
): Promise<AnalysisOutcome> {
  const startedAt = performance.now();
  const { outcome, detail } = await analyze(callId, signal).catch(
    async (err: unknown): Promise<Analysis> => ({
      outcome: await handleError(callId, err),
      detail: err instanceof AnalysisFailure ? err.message : 'error',
    }),
  );
  const ms = Math.round(performance.now() - startedAt);
  console.info(
    `Analysis for call ${callId}: ${outcome} in ${ms} ms (${detail})`,
  );
  return outcome;
}

async function analyze(callId: string, signal: AbortSignal): Promise<Analysis> {
  const supabase = createAdminClient();
  const [call, segments, checklist] = await Promise.all([
    supabase
      .from('calls')
      .select('coaching_lang, duration_seconds')
      .eq('id', callId)
      .eq('status', 'analyzing')
      .maybeSingle(),
    supabase
      .from('transcript_segments')
      .select('segment_id, start_time, end_time, speaker_id, text')
      .eq('call_id', callId)
      .order('segment_id'),
    loadChecklist(),
  ]);
  if (call.error) throw call.error;
  if (segments.error) throw segments.error;
  if (!call.data) return { outcome: 'lost_race', detail: 'not analysing' };

  const llm = await askLlm(
    buildMessages(segments.data, checklist, call.data.coaching_lang),
    signal,
  );
  const { report, rejected } = buildReport({
    answer: parseAnswer(llm.content),
    segments: segments.data,
    checklist,
    durationSeconds: call.data.duration_seconds ?? 0,
  });

  const saved = await supabase.rpc('save_report', {
    p_call_id: callId,
    p_report: {
      ...report,
      llm_model: llm.model,
      prompt_version: PROMPT_VERSION,
      checklist_snapshot: checklist,
    },
  });
  if (saved.error) throw saved.error;
  return {
    outcome: saved.data ? 'ready' : 'lost_race',
    detail: `${llm.model}, ${rejected.passes} passes and ${rejected.red_flags} red flags without a quote`,
  };
}

async function askLlm(
  messages: ReturnType<typeof buildMessages>,
  signal: AbortSignal,
) {
  try {
    return await requestAnalysis(messages, signal);
  } catch (err) {
    if (signal.aborted) {
      throw new AnalysisFailure('No answer from the LLM before the deadline');
    }
    if (err instanceof OpenRouterError) {
      throw new AnalysisFailure(`OpenRouter answered ${err.statusCode}`);
    }
    const name = err instanceof Error ? err.name : 'unknown error';
    throw new AnalysisFailure(`The LLM request failed (${name})`);
  }
}

function parseAnswer(content: string | null) {
  if (content === null) throw new AnalysisFailure('The LLM gave no answer');

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new AnalysisFailure('The LLM answer was not valid JSON');
  }
  const parsed = llmAnswerSchema.safeParse(json);
  if (!parsed.success) {
    throw new AnalysisFailure('The LLM answer did not match the schema');
  }
  return parsed.data;
}

function handleError(callId: string, err: unknown) {
  if (err instanceof AnalysisFailure) {
    return failCall(callId, 'analyzing', {
      code: 'analysis_failed',
      reason: err.message,
    });
  }

  console.error(`Analysing call ${callId} failed`, err);
  return failCall(callId, 'analyzing', {
    code: 'analysis_failed',
    reason: err instanceof Error ? err.message : 'Saving the report failed',
  });
}
