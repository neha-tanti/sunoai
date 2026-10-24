import 'server-only';
import {
  HTTPClientError,
  OpenRouterError,
  ResponseValidationError,
  SDKValidationError,
} from '@openrouter/sdk/models/errors';
import { coachingLanguage } from '@/lib/call-upload';
import type { TablesInsert } from '@/lib/database.types';
import { type Checklist, loadChecklist } from './checklist';
import { loggableError } from './errors';
import { failCall } from './fail-call';
import type { TranscriptSegment } from './gnani';
import { requestAnalysis } from './llm';
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
  const [call, segments, { checklist }] = await Promise.all([
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

  const { model, report, rejected } = await runAnalysis(
    {
      segments: segments.data,
      checklist,
      coachingLang: call.data.coaching_lang,
      durationSeconds: call.data.duration_seconds ?? 0,
    },
    signal,
  );

  const saved = await supabase.rpc('save_report', {
    p_call_id: callId,
    p_report: {
      ...report,
      llm_model: model,
      prompt_version: PROMPT_VERSION,
      checklist_snapshot: checklist,
    } satisfies Omit<
      TablesInsert<'reports'>,
      'call_id' | 'created_at' | 'coaching_audio_path'
    >,
  });
  if (saved.error) throw saved.error;
  return {
    outcome: saved.data ? 'ready' : 'lost_race',
    detail: `${model}, ${rejected.passes} passes and ${rejected.red_flags} red flags without a quote${rejected.coaching ? `, ${rejected.coaching} dropped` : ''}`,
  };
}

export async function runAnalysis(
  input: {
    segments: TranscriptSegment[];
    checklist: Checklist;
    coachingLang: string;
    durationSeconds: number;
  },
  signal: AbortSignal,
) {
  const language = coachingLanguage(input.coachingLang);
  const llm = await askLlm(
    buildMessages(input.segments, input.checklist, language),
    signal,
  );
  const answer = parseAnswer(llm.content);
  const { report, rejected } = buildReport({
    answer,
    segments: input.segments,
    checklist: input.checklist,
    durationSeconds: input.durationSeconds,
    coachingLanguage: language,
  });
  return { model: llm.model, answer, report, rejected };
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
    if (err instanceof ResponseValidationError) {
      throw new AnalysisFailure('The OpenRouter response was not readable');
    }
    if (err instanceof OpenRouterError) {
      throw new AnalysisFailure(`OpenRouter answered ${err.statusCode}`);
    }
    if (err instanceof HTTPClientError || err instanceof SDKValidationError) {
      throw new AnalysisFailure(`The LLM request failed (${err.name})`);
    }
    throw err;
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
  if (!(err instanceof AnalysisFailure)) {
    console.error(`Analysing call ${callId} failed: ${loggableError(err)}`);
  }
  return failCall(callId, 'analyzing', {
    code: 'analysis_failed',
    reason:
      err instanceof AnalysisFailure
        ? err.message
        : 'The analysis failed unexpectedly',
  });
}
