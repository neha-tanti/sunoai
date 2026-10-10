# Spike: Gnani speaker labels and free LLMs

Issue: [#1](https://github.com/neha-tanti/sunoai/issues/1). Started 10 October 2026.

The LLM half is done: `nvidia/nemotron-3-super-120b-a12b:free` with reasoning turned off gives the same valid report three times out of three in about 10 seconds, after four prompt drafts. The Gnani half (speaker labels and transcript accuracy) is waiting for a Gnani API key.

| Question | Answer so far |
| --- | --- |
| Can Gnani Batch tell an AI voice, a human agent and a customer apart? | Not run yet: the Gnani account's email verification is pending |
| Can a free OpenRouter model handle Hinglish and return valid JSON with exact quotes? | Yes, Nemotron with reasoning off and prompt v4. Gemma was unavailable for the whole spike |

## The test call

One synthetic call, written in `scripts/spike/call-script.mjs`: a late order on FreshDabba, a made-up food delivery app. An AI agent (Timbre voice Kaveri, `en-IN`) answers, the customer (Poorvi, `hi-en`) speaks Hinglish, and a human agent (Deepak, `hi-IN`) takes over. The AI ignores "Mujhe kisi insaan se baat karni hai, please" and repeats its answer, then transfers when the customer insists.

Expected results, written down before the first run (segment ids start at 0, so line N is segment N−1):

| Field | Expected |
| --- | --- |
| Speakers | 3 |
| Handover | Segment 9, the human agent's first line |
| Checks | All 6 pass, score 6/6 (Good) |
| Needs review | Yes |
| Red flags | `human_not_transferred` at segment 5 |
| Peak frustration | Angry, turning at segment 7 ("Abhi transfer karo!") |

## LLM results

Every LLM run so far used `transcript-script.json`: the call script in Gnani's transcript shape with correct speaker ids, so these results show the model on a perfect transcript. Each configuration ran 3 times at temperature 0 with the checks from the TRD applied in code: Zod-style shape check, the exact-quote rule, the score and Needs review.

| Prompt | Model setup | JSON valid | Score per run | Red flag found | Quotes rejected | Time per run |
| --- | --- | --- | --- | --- | --- | --- |
| v1 | Nemotron, strict schema, reasoning on | 3/3 | 3/6, 4/6, 4/6 | 1 of 3 runs | 0 | 42–70 s |
| v2 | Nemotron, strict schema, reasoning on | 3/3 | 5/6, 2/6, 3/6 | 3 of 3 | 6 | 38–58 s |
| v2 | Nemotron, strict schema, reasoning off | 3/3 | 6/6, 6/6, 6/6 | 3 of 3 | 0 | 10–13 s |
| v3 | Nemotron, strict schema, reasoning off | 3/3 | 6/6, 4/6, 6/6 | 3 of 3, plus false flags in one run | 2 | 8–22 s |
| v4 | Nemotron, strict schema, reasoning off | 3/3 | 6/6, 6/6, 6/6 | 3 of 3 | 0 | 10–11 s |
| v1–v4 | Gemma, JSON mode | — | — | — | — | 429 on all 7 attempts |

### What each prompt change fixed

- **v1 → v2.** The model graded checks against the AI agent only, so the human agent's order confirmation and apology were missed. It also didn't flag the ignored request for a person because the AI transferred later. v2 says checks pass when either agent does them, and that `human_not_transferred` applies even when a transfer comes later.
- **v2 → v3.** With reasoning off, the model pointed `handover_segment_id` at the AI's "connecting you" line and marked the wrong segments angry, even when told exactly what to pick. v3 drops both fields: the model labels speakers and gives a mood for each customer segment, and code works out the handover (first segment from the `human_agent` speaker), the peak and the turn.
- **v3 → v4.** The model added red flags it had judged "Not applicable", each with a real quote, which the quote rule can't catch. It also kept rewriting "two" as "दो" inside Devanagari lines. v4 asks for the shortest phrase that proves the point, copied character for character with no transliteration, and only red flags that happened.

### Findings

- **Nemotron's strict schema is reliable.** 15 of 15 answers were valid JSON with every key, no code fences and no unknown ids.
- **Reasoning makes Nemotron slower and less stable.** With reasoning on, it spent 2,600–4,800 reasoning tokens per call, took up to 70 seconds (over Vercel's 60-second limit) and its score moved between runs. With reasoning off it answered in about 10 seconds.
- **Temperature 0 alone does not make the score repeatable.** Scores varied in every setup until prompt v4. The 3-run check in `testing.md` caught each case and must stay part of the test-call runs.
- **The quote rule is essential.** It rejected 8 quotes where the model had changed a word in a mixed-script line. Every one was a pass that would otherwise have counted.
- **The quote rule doesn't catch every wrong answer.** A red flag can quote real words and still be wrong. Prompt v4 and the 3-run check are the guards against that.
- **Hinglish was handled well.** The model understood the Hinglish and Hindi lines, and the Hindi coaching was natural and specific. The weak spot was copying mixed-script text exactly, not understanding it.
- **Gemma's free endpoint was unavailable.** All 7 requests, made between about 14:57 and 15:07 IST on 10 October, returned 429 "temporarily rate-limited upstream" from Google AI Studio's shared free pool, so its quality is untested. OpenRouter's response was `limit_source: upstream_provider_shared_pool`; it is not clear whether these failures count towards the 50-a-day limit.
- **Remaining differences from the expected results (v4):**
  - The model also flagged segment 7, the customer's second request. The AI did transfer straight after it, so that flag is debatable. Needs review is correct either way.
  - It puts the frustration turn at segment 5, the first request for a person, not segment 7. Segment 5 does show anger ("Aapne pichli baar bhi yahi bola tha"), so the expected value was arguably too strict.

### Credits used

OpenRouter: 15 Nemotron requests and 7 failed Gemma requests on 10 October, all at $0. Gnani: none yet.

## Gnani results

Waiting for the Gnani API key. To be filled in for each run (with and without `with_denoise`):

| Run | Speaker ids found | Speaker accuracy | Transcript accuracy | Language detected | Wall time | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| Without denoise | | | | | | |
| With denoise | | | | | | |

After the Gnani runs, both real transcripts go through `analyze.mjs` with prompt v4 to see how transcription errors and speaker mix-ups change the report.

## Decision: `LLM_MODELS`

```
LLM_MODELS=nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free
```

Nemotron first, with reasoning turned off. Gemma stays as the fallback only because nothing better has been tested; it was never available during the spike.

## Changes the TRD needs

1. **LLM analysis, Model:** put Nemotron first. Send OpenRouter's `reasoning: { enabled: false }` and a strict `json_schema` `response_format`; confirm the `@openrouter/sdk` names for both.
2. **LLM analysis, What comes back:** replace `handover` with nothing and `frustration` with `customer_mood`, a level (`calm`, `annoyed`, `angry`) for each customer segment id.
3. **LLM analysis, Rules enforced in code:** add that code sets the handover to the first segment from the speaker labelled `human_agent`, and builds the frustration ranges, peak and turn (the first segment at the peak level) from `customer_mood`. Rule 6's "frustration ranges are sorted and gap-filled" becomes building them from per-segment moods.
4. **LLM analysis, prompt:** record the prompt rules that changed the results: checks pass when either agent does them; `human_not_transferred` applies even when a transfer comes later; quotes are the shortest phrase, copied exactly, never transliterated; only red flags that happened are listed.
5. **Risks:** Gemma's free endpoint can be rate-limited upstream for at least 10 minutes at a time. Since `LLM_MODELS` has only two models, one busy upstream leaves one model. Consider adding OpenRouter credits before demo day.

## Running the spike

Put `GNANI_API_KEY` and `OPENROUTER_API_KEY` in `.env.local`. Output goes to `test-calls/spike/`, which git ignores.

```bash
node --env-file=.env.local scripts/spike/make-call.mjs              # Timbre: call.wav and timeline.json
node --env-file=.env.local scripts/spike/transcribe.mjs             # Gnani Batch without denoise
node --env-file=.env.local scripts/spike/transcribe.mjs --denoise   # Gnani Batch with denoise
node --env-file=.env.local scripts/spike/analyze.mjs --transcript transcript-call-raw.json
node scripts/spike/script-transcript.mjs                            # the script as a perfect transcript, no Gnani needed
```

`analyze.mjs` takes `--runs` (default 3) and `--only` to run one model setup, for example `--only noreason`.
