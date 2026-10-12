import 'server-only';
import { analyzeCall } from './analysis';
import { finishTranscription, type TranscribingCall } from './transcription';

export const DEADLINE_MS = 280_000;

export async function finishCall(call: TranscribingCall, signal: AbortSignal) {
  const outcome = await finishTranscription(call, signal);
  if (outcome !== 'analyzing') return outcome;
  return analyzeCall(call.id, signal);
}
