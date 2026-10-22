# Spike: Gnani speaker labels and free LLMs

Issues: [#1](https://github.com/neha-tanti/sunoai/issues/1), run 10 October 2026 (LLM half), and [#13](https://github.com/neha-tanti/sunoai/issues/13), run 21 October 2026 (Gnani half).

`nvidia/nemotron-3-super-120b-a12b:free` with reasoning turned off gave the same valid report three times out of three in about 10 seconds, after four prompt drafts, and `dots-studio/dots-3-note-preview:free` is a working but weaker fallback. Gnani Batch then labelled every segment of the voiced call with the right speaker, and the paid Nemotron that SunoAI uses gave the same report on Gnani's transcripts as on the perfect one.

| Question | Answer |
| --- | --- |
| Can Gnani Batch tell an AI voice, a human agent and a customer apart? | Yes: 3 speaker ids, 15 of 15 segments right, with and without denoise |
| Can a free OpenRouter model handle Hinglish and return valid JSON with exact quotes? | Yes: Nemotron with reasoning off and prompt v4. Dots also works, less accurately |
| Do Gnani's transcription errors change the report? | No: same score, flags, handover and peak as on the perfect transcript |

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

OpenRouter, 10 October: 24 successful free requests (15 Nemotron, 3 Dots and 6 through the two lists), all at $0, plus 10 failed requests that didn't count. Gnani: none until the 21 October runs (see Spend below).

## Gnani results

`make-call.mjs` voiced the script with Timbre into a 65.1-second WAV, and Gnani Batch (`gnani-prisma-v2.5`, `hi-IN,en-IN`, `num_speakers: 3`) transcribed it once without and once with `with_denoise`. Wall time is from the job's `created_at` to `completed_at`.

| Run | Speaker ids found | Speaker accuracy | Transcript accuracy | Language detected | Wall time | Credits |
| --- | --- | --- | --- | --- | --- | --- |
| Without denoise | 3 | 15/15 | 15 segments, one per script line; 3 errors (below) | `hi-IN` | 5.7 s | Not recorded |
| With denoise | 3 | 15/15 | 15 segments, one per script line; 2 errors (below) | `hi-IN` | 9.3 s | Not recorded |

The credit balance wasn't noted before and after each job, so credits per minute, with and without denoise, are still open in the TRD.

Transcription errors:

- Both runs heard "FD 4572, ek ghante" as "एफ डी 45721 घंटे": the order id swallowed the "one".
- Both runs heard the closing "bye" as "बाएं" ("left").
- Without denoise, "FreshDabba" came out as "freshdubba"; with denoise it was right.

Both transcripts then went through `analyze.mjs` with prompt v4 and the `LLM_MODELS` SunoAI runs with, the paid `nvidia/nemotron-3-super-120b-a12b`, 3 runs each:

| Transcript | Answered by | Score per run | Flags per run | Handover per run | Peak per run | Turn per run | Quotes rejected | Time per run |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Without denoise | Nemotron, 3 of 3 | 6/6, 6/6, 6/6 | segments 5 and 7, in all 3 | 9, 9, 9 | angry, angry, angry | 5, 5, 5 | 0 | 8–10 s |
| With denoise | Nemotron, 3 of 3 | 6/6, 6/6, 6/6 | segments 5 and 7, in all 3 | 9, 9, 9 | angry, angry, angry | 5, 5, 5 | 0 | 54–69 s |

Gnani's segments line up one to one with the script's lines, so segment ids compare directly with `EXPECTED`.

### Findings

- **Speaker labels are reliable on this call.** Gnani gave the AI agent, the customer and the human agent one id each, with no merged voices, so the TRD's handover rule (the first segment from the speaker labelled `human_agent`) found segment 9 in all 6 runs. No TRD change is needed for it.
- **Transcription errors didn't change the report.** Both transcripts gave exactly the chosen setup's result on the perfect transcript, including its two known misses: the extra `human_not_transferred` flag at segment 7 and the turn at 5 instead of 7. No quote was rejected, so the mixed-script errors didn't break the exact-quote rule.
- **Denoise is cheap in time.** On this clean audio it fixed one word and added 3.6 seconds, about 6% of the call's length. It stays on by default for noisy phone audio; its credit cost wasn't recorded.
- **Gnani's job files endpoint sometimes answers 429.** `GET /stt/v3/batch/jobs/{id}/files` returned `RATE_LIMITED` with no `Retry-After` for a few minutes after two jobs finished together, even for single requests, while the job status endpoint kept answering. It cleared on its own. SunoAI treats a Gnani 429 as busy and lets the next cron run retry, but it failed a call after 5 busy answers, which a few minutes of this would use up. The limit is now 30, about half an hour of cron runs (see the TRD's failure table), and the spike's `gnani()` helper retries a 429 too.
- **The free Nemotron was down.** On 21 October its only provider answered 404 for every request, with 0% uptime on OpenRouter. 6 runs of the old free list (`LLM_MODELS=nvidia/nemotron-3-super-120b-a12b:free,dots-studio/dots-3-note-preview:free`) were all answered by Dots; their reports weren't kept, since that list is no longer SunoAI's. SunoAI uses the paid version, which three providers served at 100% uptime.
- **The denoise transcript's runs were slow on OpenRouter's side**, 54–69 seconds against 8–10 for the other, with the same model and a near-identical prompt. That is still inside the 280-second deadline.

### Spend

Gnani, 21 October: about 3 minutes of audio, credits not recorded. That was one 65-second Timbre call, one test sentence, and two 65-second Batch jobs. OpenRouter: the 6 paid Nemotron runs cost $0.011, plus 12 free requests (6 to Dots, 6 failed on the free Nemotron).

## Decision: `LLM_MODELS`

```
LLM_MODELS=nvidia/nemotron-3-super-120b-a12b
```

The spike first chose the free Nemotron with Dots as a fallback. No third free model passed: Apodex rejects the strict schema, Gemma supports only JSON mode, and the remaining candidate (`liquid/lfm-2.5-2.6b:free`) is a 2.6B model that can't turn reasoning off. SunoAI then moved to the paid Nemotron, which has no daily limit and no free-tier queue. Dots has no paid version, so the list has one model (see the TRD's LLM analysis). The Gnani runs confirmed the choice: the free Nemotron was down, and the paid one answered every request.

## Changes made to the TRD

1. **LLM analysis, Model:** Nemotron then Dots, with a strict `json_schema`, `reasoning: { enabled: false }` and `provider: { require_parameters: true }`. Every listed model must accept the strict schema and be tried through the spike first, and the fallback's effect on reports is stated.
2. **LLM analysis, What comes back:** drops `handover`, and replaces `frustration` with `customer_mood`, a level (`calm`, `annoyed`, `angry`) for each customer segment id.
3. **LLM analysis, Rules enforced in code:** code sets the handover to the first segment from the speaker labelled `human_agent`. It builds frustration from customer moods only: a customer segment with no mood keeps the previous one, each mood holds until the customer's next segment, the turn is the first segment at the peak or null when the peak is calm, and ranges and turn are stored in `reports.frustration`. The unit test scope in the TRD and `testing.md` names both rules.
4. **LLM analysis, prompt:** records the prompt rules that changed the results: checks pass when either agent does them; `human_not_transferred` applies even when a transfer comes later; quotes are the shortest phrase, copied exactly, never transliterated; only red flags that happened are listed.
5. **LLM analysis, rule 1, API and limits:** no LLM retry, since all 24 strict-schema answers were valid. Functions run up to 300 seconds, the Hobby maximum, and every function that runs the analysis cancels its Gnani and LLM requests at a 280-second deadline. Check again gets its own route, `POST /api/calls/:id/analyze`, which accepts only analysis failures. The webhook, cron and Check again routes respond at once and run the work in Next.js `after()`. The cron route fails calls left in Analysing and finishes at most one call per run, oldest first. An OpenRouter 429 shows the limit message only when `remaining` is 0.
6. **Auth, security and privacy:** the daily guard refuses a check when OpenRouter's `free_model_daily_requests.remaining` is 0, instead of counting requests itself. `LLM_DAILY_LIMIT` is gone, and the limit message says checking resumes at 5:30 am (midnight UTC).
7. **Risks:** a busy primary model means the weaker fallback writes some reports; the report saves which model answered, and Check again reruns the analysis. 10 OpenRouter credits are bought before demo day, raising the daily limit to 1,000.
8. **#13, Gnani:** the denoise row gives its measured cost, about 6% of the call's length; the Risks row keeps denoise on by default; the failure table raises the Gnani busy limit from 5 to 30 answers and notes the job files endpoint's 429s; the poll route tries calls with the fewest busy answers first, then the oldest; the credits and rate-limit questions record what the spike saw.

Items 1, 6 and 7 describe the free models chosen in #1. SunoAI has since moved to the paid Nemotron alone (see [Decision](#decision-llm_models)).

## Running the spike

Put `GNANI_API_KEY`, `OPENROUTER_API_KEY` and `LLM_MODELS` in `.env.local`. Output goes to `test-calls/spike/`, which git ignores.

```bash
node --env-file=.env.local scripts/spike/make-call.mjs              # Timbre: call.wav and timeline.json
node --env-file=.env.local scripts/spike/transcribe.mjs             # Gnani Batch without denoise
node --env-file=.env.local scripts/spike/transcribe.mjs --denoise   # Gnani Batch with denoise
node --env-file=.env.local scripts/spike/analyze.mjs --transcript transcript-call-raw.json
node scripts/spike/script-transcript.mjs                            # the script as a perfect transcript, no Gnani needed
```

`analyze.mjs` takes `--runs` (default 3) and `--only` to run one setup: `nemotron`, `apodex`, `dots` (the free models) or `llm-models` (the list in `LLM_MODELS`). `transcribe.mjs --job <id>` fetches and scores a job that already ran, without sending the audio again, and names its transcript after the job id.
