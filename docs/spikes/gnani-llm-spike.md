# Spike: Gnani speaker labels and free LLMs

Issue: [#1](https://github.com/neha-tanti/sunoai/issues/1). Run 10 October 2026.

The LLM half is done: `nvidia/nemotron-3-super-120b-a12b:free` with reasoning turned off gave the same valid report three times out of three in about 10 seconds, after four prompt drafts, and `dots-studio/dots-3-note-preview:free` is a working but weaker fallback. The Gnani half (speaker labels and transcript accuracy) is waiting for a Gnani API key and is tracked in [#13](https://github.com/neha-tanti/sunoai/issues/13).

| Question | Answer so far |
| --- | --- |
| Can Gnani Batch tell an AI voice, a human agent and a customer apart? | Not run yet: there is no Gnani API key |
| Can a free OpenRouter model handle Hinglish and return valid JSON with exact quotes? | Yes: Nemotron with reasoning off and prompt v4. Dots also works, less accurately |

## The test call

One synthetic call, written in `scripts/spike/call-script.mjs`: a late order on FreshDabba, a made-up food delivery app. An AI agent (Timbre voice Kaveri, `en-IN`) answers, the customer (Poorvi, `hi-en`) speaks Hinglish, and a human agent (Deepak, `hi-IN`) takes over. The AI ignores "Mujhe kisi insaan se baat karni hai, please" and repeats its answer, then transfers when the customer insists.

Expected results, written down before the first run as `EXPECTED` in `call-script.mjs` (segment N is script line N + 1). `analyze.mjs` lists every difference from them for each run.

| Field | Expected |
| --- | --- |
| Checks | All 6 pass, score 6/6 (Good) |
| Needs review | Yes |
| Red flags | `human_not_transferred` at segment 5, and no others |
| Handover | Segment 9, the human agent's first line |
| Peak frustration | Angry, turning at segment 7 ("Abhi transfer karo!") |

## LLM results

Every LLM run used `transcript-script.json`: the call script in Gnani's transcript shape with correct speaker ids, so these results show each model on a perfect transcript. Each setup ran 3 times at temperature 0. Code then applied the TRD's rules: a check that every top-level key is present, the exact-quote rule, the score and Needs review.

In v1 and v2 the model chose the handover and the turn. From v3 on, code works them out (see below).

| Prompt | Setup | JSON valid | Score per run | Flag at segment 5 | Handover per run | Turn per run | Quotes rejected | Time per run |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| v1 | Nemotron, reasoning on | 3/3 | 3/6, 4/6, 4/6 | 1 of 3 | 8, 8, 8 | 7, 7, 7 | 0 | 42–70 s |
| v2 | Nemotron, reasoning on | 3/3 | 5/6, 2/6, 3/6 | 2 of 3 | 9, 9, 9 | 7, 7, 7 | 6 | 38–58 s |
| v2 | Nemotron, reasoning off | 3/3 | 6/6, 6/6, 6/6 | 2 of 3 | 8, 8, 8 | 10, 10, 10 | 0 | 10–13 s |
| v3 | Nemotron, reasoning off | 3/3 | 6/6, 4/6, 6/6 | 3 of 3 | 9, 9, 9 | 5, 1, 1 | 2 | 8–22 s |
| v4 | Nemotron, reasoning off | 3/3 | 6/6, 6/6, 6/6 | 3 of 3 | 9, 9, 9 | 5, 5, 5 | 0 | 10–11 s |
| v4 | Dots, reasoning off | 3/3 | 6/6, 6/6, 5/6 | 3 of 3 | 9, 9, 9 | 1, 1, 1 | 0 | 12–13 s |
| v4 | List of Nemotron, Apodex, Dots; answered by Dots, Nemotron, Dots | 3/3 | 5/6, 6/6, 4/6 | 3 of 3 | 9, 9, 9 | 1, 5, 1 | 2 | 7–28 s |
| v4 | Decided `LLM_MODELS`: Nemotron, Dots; answered by Dots, Nemotron, Nemotron | 3/3 | 6/6, 6/6, 6/6 | 3 of 3 | 9, 9, 9 | 1, 5, 5 | 0 | 7–26.5 s |
| v4 | Apodex, reasoning off | — | — | — | — | — | — | 400 on all 3: rejects `json_schema` |
| v1–v4 | Gemma, JSON mode | — | — | — | — | — | — | 429 on all 7 |

All setups used a strict `json_schema`, except Gemma, which supports only JSON mode. The Dots, Apodex and both list rows used the request shape `server/llm.ts` will use: one request with a `models` list and shared settings. Only the decided `LLM_MODELS` row also sent `provider: { require_parameters: true }`, as `server/llm.ts` will.

### What each prompt change fixed

- **v1 → v2.** The model graded checks against the AI agent only, so the human agent's order confirmation and apology were missed. It also didn't flag the ignored request for a person because the AI transferred later. v2 says checks pass when either agent does them, and that `human_not_transferred` applies even when a transfer comes later.
- **v2 → v3.** With reasoning off, the model pointed the handover at the AI's "connecting you" line (segment 8) and put the turn at segment 10, where the customer is calming down, even when told exactly what to pick. v3 drops both fields: the model labels speakers and gives a mood for each customer segment, and code works out the handover, peak and turn. The handover has been right in every run since.
- **v3 → v4.** The model added red flags it had judged "Not applicable", each with a real quote, which the quote rule can't catch. It also kept rewriting "two" as "दो" inside Devanagari lines. v4 asks for the shortest phrase that proves the point, copied character for character with no transliteration, and only red flags that happened.

### Findings

- **The strict schema is reliable.** All 24 answers from Nemotron and Dots were valid JSON with every top-level key, no code fences and no unknown ids.
- **Reasoning makes Nemotron slower and less stable.** With reasoning on, it spent 2,600–4,800 reasoning tokens per call, took up to 70 seconds and its score moved between runs. With reasoning off it answered in about 10 seconds.
- **Temperature 0 alone does not make the report repeatable.** With reasoning on, the score changed in both prompts. With reasoning off, the score was stable in v2 and v4 but not in v3, and v2's red flag still moved. The 3-run check in `testing.md` caught each case and must stay part of the test-call runs.
- **The quote rule is essential.** It rejected 10 quotes where the model had changed a word in a mixed-script line. Each was a pass that would otherwise have counted.
- **The quote rule doesn't catch every wrong answer.** A red flag can quote real words and still be wrong. Prompt v4 and the 3-run check are the guards against that.
- **Hinglish was handled well.** Both models understood the Hinglish and Hindi lines, and Nemotron's Hindi coaching was natural and specific. The weak spot was copying mixed-script text exactly, not understanding it.
- **Fallback happens often, and it changes the report.** With the decided list, Nemotron was unavailable for 1 of 3 requests, and the fallback answer took 26.5 seconds against about 7. With the earlier list that also held Apodex, it was 2 of 3. Across its 6 answers Dots scored 4/6 to 6/6, rated the customer only "annoyed" every time, and added an "agent stuck in a loop" flag in 5 of them for an answer repeated twice, not three times.
- **A model's listed parameters can't be trusted.** OpenRouter lists `structured_outputs` for Apodex, but its provider rejects `json_schema`. Both Gemma 4 free models list only JSON mode, so neither can be in a list that sends a strict schema. Gemma was also rate-limited upstream for every request between about 14:57 and 15:07 IST.
- **Failed requests don't count toward the daily limit.** OpenRouter's `GET /api/v1/key` showed `free_model_daily_requests.used` at 15 after 15 successful requests and 7 Gemma 429s. It showed 21 after 6 more successful requests and 3 Apodex 400s, and 24 after the last 3.
- **Misses against the expected results for the chosen setup (Nemotron, v4)**, the same in all 3 runs:
  - An extra `human_not_transferred` flag at segment 7, the customer's second request, which the AI did answer with a transfer.
  - The turn at segment 5 instead of 7, because the model rated the first request for a person as angry.

### Requests used

OpenRouter, 10 October: 24 successful free requests (15 Nemotron, 3 Dots and 6 through the two lists), all at $0, plus 10 failed requests that didn't count. Gnani: none yet.

## Gnani results

Waiting for the Gnani API key ([#13](https://github.com/neha-tanti/sunoai/issues/13)). To be filled in for each run (with and without `with_denoise`):

| Run | Speaker ids found | Speaker accuracy | Transcript accuracy | Language detected | Wall time | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| Without denoise | | | | | | |
| With denoise | | | | | | |

After the Gnani runs, both real transcripts go through `analyze.mjs` with prompt v4. That shows how transcription errors and speaker mix-ups change the report, and whether the handover rule holds on real speaker ids.

## Decision: `LLM_MODELS`

```
LLM_MODELS=nvidia/nemotron-3-super-120b-a12b:free,dots-studio/dots-3-note-preview:free
```

Nemotron first and Dots second, both with a strict schema and reasoning turned off. No third free model passed: Apodex rejects the strict schema, Gemma supports only JSON mode, and the remaining candidate (`liquid/lfm-2.5-2.6b:free`) is a 2.6B model that can't turn reasoning off.

## Changes made to the TRD

1. **LLM analysis, Model:** Nemotron then Dots, with a strict `json_schema`, `reasoning: { enabled: false }` and `provider: { require_parameters: true }`. Every listed model must accept the strict schema and be tried through the spike first, and the fallback's effect on reports is stated.
2. **LLM analysis, What comes back:** drops `handover`, and replaces `frustration` with `customer_mood`, a level (`calm`, `annoyed`, `angry`) for each customer segment id.
3. **LLM analysis, Rules enforced in code:** code sets the handover to the first segment from the speaker labelled `human_agent`. It builds frustration from customer moods only: a customer segment with no mood keeps the previous one, each mood holds until the customer's next segment, the turn is the first segment at the peak or null when the peak is calm, and ranges and turn are stored in `reports.frustration`. The unit test scope in the TRD and `testing.md` names both rules.
4. **LLM analysis, prompt:** records the prompt rules that changed the results: checks pass when either agent does them; `human_not_transferred` applies even when a transfer comes later; quotes are the shortest phrase, copied exactly, never transliterated; only red flags that happened are listed.
5. **LLM analysis, rule 1, API and limits:** no LLM retry, since all 24 strict-schema answers were valid. Functions run up to 300 seconds, the Hobby maximum, and every function that runs the analysis cancels its Gnani and LLM requests at a 280-second deadline. Check again gets its own route, `POST /api/calls/:id/analyze`, which accepts only analysis failures. The webhook, cron and Check again routes respond at once and run the work in Next.js `after()`. The cron route fails calls left in Analysing and finishes at most one call per run, oldest first. An OpenRouter 429 shows the limit message only when `remaining` is 0.
6. **Auth, security and privacy:** the daily guard refuses a check when OpenRouter's `free_model_daily_requests.remaining` is 0, instead of counting requests itself. `LLM_DAILY_LIMIT` is gone, and the limit message says checking resumes at 5:30 am (midnight UTC).
7. **Risks:** a busy primary model means the weaker fallback writes some reports; the report saves which model answered, and Check again reruns the analysis. 10 OpenRouter credits are bought before demo day, raising the daily limit to 1,000.

## Running the spike

Put `GNANI_API_KEY` and `OPENROUTER_API_KEY` in `.env.local`. Output goes to `test-calls/spike/`, which git ignores.

```bash
node --env-file=.env.local scripts/spike/make-call.mjs              # Timbre: call.wav and timeline.json
node --env-file=.env.local scripts/spike/transcribe.mjs             # Gnani Batch without denoise
node --env-file=.env.local scripts/spike/transcribe.mjs --denoise   # Gnani Batch with denoise
node --env-file=.env.local scripts/spike/analyze.mjs --transcript transcript-call-raw.json
node scripts/spike/script-transcript.mjs                            # the script as a perfect transcript, no Gnani needed
```

`analyze.mjs` takes `--runs` (default 3) and `--only` to run one setup: `nemotron`, `apodex`, `dots` or `llm-models`.
