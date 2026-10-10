# Testing Rules - Core Philosophy

> This file sets what SunoAI tests and the principles every test follows.

## Scope

A test earns its place only when it pins behaviour a team leader would see, or a rule the report's trustworthiness depends on. SunoAI has exactly four kinds:

| Kind              | Tool                                                                                               | Pins                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**          | Vitest                                                                                             | The pure logic behind a report: score bands, quote matching, segment id to time, building frustration ranges from per-segment moods, the handover from speaker roles, the LLM output schema, parsing Gnani's transcript JSON |
| **API**           | Vitest with Hono's `app.request()`; Gnani and OpenRouter stubbed at the network boundary, against a local Supabase | Every route, status changes, the webhook and cron job arriving together (only one finishes the call), the daily LLM limit                                           |
| **End to end**    | Playwright, external services mocked                                                               | Sign in, upload, see the report, play coaching, edit the checklist, delete a call                                                                                   |
| **Real services** | A script run by hand                                                                               | The test calls through real Gnani and the LLM, compared with expected results written down before the run                                                           |

Unit and API tests run under `pnpm test`; end-to-end tests run under `pnpm test:e2e`. The real-services script is run by hand and is part of neither command.

- Expected results for each test call are written down first: score, Needs review, red flags, peak frustration and the line where it turned.
- LLM checks run at temperature 0, and the same call is checked 3 times to confirm the score doesn't change.
- Fixtures use made-up transcripts. Test recordings stay in a private folder and are never committed (see `security-and-data.md`).

## What We Don't Test

- **No snapshot tests.** No `toMatchSnapshot` / `toMatchInlineSnapshot`, and no frozen output fixtures compared with `toEqual`. Assert the property that matters — a score band, a dropped quote, a status change — not the exact output.
- **No component or hook tests of their own.** The UI is covered by the Playwright flows that use it.
- **No real services in automated tests.** `pnpm test` and `pnpm test:e2e` never reach Gnani, OpenRouter or Supabase; only the hand-run script does.

## Core Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT (made-up data) →  SYSTEM UNDER TEST  → OUTPUT (expected) │
│                                                                 │
│  Tests validate: "Does the output match what we expect?"        │
│  Tests DO NOT focus on: internal method calls, line coverage    │
└─────────────────────────────────────────────────────────────────┘
```

**Given input X, expect output Y** — a made-up transcript in, a checked report out; a request in, a response and a status change out; a user action in Playwright, a visible result out.

## Principles

1. **Result validation over code coverage** — 90% coverage with bad assertions is worse than 60% coverage with good assertions
2. **Realistic inputs over placeholder data** — Use made-up transcripts that read like real calls (Hinglish lines, a customer asking for a person, an order id spoken as words), the seeded checklist, and genuine user flows; never real recordings or personal data
3. **Partial matching over exact equality** — Assert on the fields you care about, not every byte
4. **Determinism is non-negotiable** — If a test can fail randomly, it's broken
5. **Stub external services, not SunoAI** — Replace Gnani and OpenRouter at the network boundary and run Supabase locally (Supabase CLI); never mock SunoAI's own functions
6. **Test behavior, not implementation** — Tests shouldn't break when you refactor internals
7. **One reason to fail** — Each test should fail for exactly one reason

## Assertion Patterns

### Partial Matching (Preferred)

```typescript
// Good - assert on what matters
expect(report).toMatchObject({
  needs_review: true,
  score_passed: 4,
  score_total: 5,
});

// Bad - exact matching breaks on irrelevant changes
expect(report).toEqual(fullExpectedReport);
```

### Properties Over Exact Wording

```typescript
// Good - pins the behaviour: every red flag that survives quotes its segment
for (const flag of report.red_flags) {
  expect(normalize(segmentText(flag.segment_id))).toContain(
    normalize(flag.quote)
  );
}

// Bad - pins today's output: any prompt or model change fails the test
expect(report.summary).toBe('The customer called about a late order...');
```

### Error Assertions

```typescript
// Good - checks the diagnostic, not just that something threw
expect(() => parseGnaniTranscript({ full_transcript: 'hello' })).toThrow(
  /segments/
);
```

## Anti-Patterns to Avoid

- Tests that pass but don't actually verify behavior
- Snapshots, or frozen fixtures that stand in for one
- Mocking internal implementation details
- Exact equality when partial matching or a property check would suffice
- Tests that depend on execution order
- Flaky tests with `retry` or `timeout` workarounds
- `skip` or `only` committed to codebase
- Magic numbers in assertions without explanation

## Running Tests

```bash
pnpm test               # Vitest: unit and API tests
pnpm test:e2e           # Playwright end-to-end tests
```

## Do Not

- Add a test outside the four kinds in [Scope](#scope)
- Take snapshots
- Focus on line coverage over result correctness
- Use `foo`/`bar` placeholder data
- Put real recordings or real personal data in fixtures
- Mock SunoAI's own functions
- Write flaky tests and add retries
- Commit `skip` or `only`
- Assert on unstable values (timestamps, random IDs)
