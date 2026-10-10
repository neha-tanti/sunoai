---
name: implement-test-guide
description: Implement tests with production-quality coverage. Use when implementing test suites, adding test coverage, or building testing infrastructure.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
  - WebSearch
  - WebFetch
user-invocable: false
---

# Implement Test

## Purpose

Implement tests with a focus on result validation over code coverage. Works with any codebase, any testing framework, using the "given input → expect output" philosophy.

## When to Use

- Implementing tests for new or existing code
- Adding coverage to code that falls inside `.claude/rules/testing.md` § Scope

## Context Sources

This skill works with multiple input types:

| Source           | Detection                 | How to Extract                                                |
| ---------------- | ------------------------- | ------------------------------------------------------------- |
| **Testing plan** | `.md` file with test plan | Read the file content                                         |
| **GitHub issue** | `#123` pattern in input   | `gh issue view 123 --json number,title,body,labels,state,url` |
| **Source code**  | File path to code to test | Read the source file                                          |
| **Conversation** | Requirements in chat      | Parse from conversation history                               |

## Testing Patterns by Target

SunoAI tests only four kinds of thing — see `.claude/rules/testing.md` § Scope and `docs/TRD.md` § Testing. The app is not scaffolded yet, so the paths below are the ones the TRD names. Based on what you're testing:

| Target                       | Detect By                                                                                                                                       | Testing Approach                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Pure rules                   | Code with no I/O: score bands, quote matching, segment id → time, building frustration ranges from per-segment moods, the handover from speaker roles, the LLM output schema, parsing Gnani's transcript | Vitest unit tests — given input, expect output                                                                                |
| API routes                   | The Hono app mounted at `app/api/[[...route]]/route.ts`                                                                                         | Vitest API tests through Hono's `app.request()`, Gnani / OpenRouter stubbed at the network boundary, local Supabase                |
| User flows                   | Pages under `app/` (`/login`, `/`, `/calls`, `/calls/[id]`, `/checklist`)                                                                       | Playwright end to end, external services mocked                                                                               |
| Real Gnani and LLM behaviour | The 6 test calls                                                                                                                                | The hand-run real-services script, compared with expected results written down first; never in `pnpm test` or `pnpm test:e2e` |
| Components and hooks         | React components (`UploadDropzone`, `TranscriptView`, …), TanStack Query hooks                                                                  | No tests of their own — covered by the Playwright flow that uses them; stop and tell the user                                 |

## Base Rules

Always load and follow:

| Rule                                                                 | Purpose                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [code-quality.md](../../rules/code-quality.md)                       | Governing principle: favor simplicity over cleverness; index to per-rule files          |
| [testing.md](../../rules/testing.md)                                 | The four test kinds and their philosophy: behaviour over coverage, no snapshots         |
| [ripple-effect.md](../../rules/ripple-effect.md)                     | Test additions must leave helpers, fixtures, and adjacent tests consistently updated    |
| [guard-clauses.md](../../rules/guard-clauses.md)                     | Keep the assertion path at column 0; exit early on setup failures                       |
| [logging-proportionality.md](../../rules/logging-proportionality.md) | One dense canonical log line beats ten incremental ones                                 |
| [code-comments.md](../../rules/code-comments.md)                     | Comment only non-obvious logic; no rationale blocks; TODOs require tracked issues       |
| [project-stage.md](../../rules/project-stage.md)                     | Pre-production: no backcompat, no shims, no feature flags — change code in place        |
| [security-and-data.md](../../rules/security-and-data.md)             | Synthetic test data only: no real recorded calls, no personal data, secrets server-only |
| [github.md](../../rules/github.md)                                   | PR title/body templates, branch naming, commit format, `Closes #N`                      |

MANDATORY: verify every third-party API (Vitest, Playwright, Hono, Supabase, Zod, OpenRouter, Gnani at docs.gnani.ai) against its official docs with WebFetch / WebSearch — do not guess from memory.

## Implementation Process

### Phase 1: Understand What to Test

1. **Identify the target:**

   ```
   If testing plan provided → Read and understand requirements
   If source file provided → Read and understand the code
   If GitHub issue (#123) → Fetch issue via gh issue view
   Otherwise → Clarify with user what needs tests
   ```

2. **Understand the code behavior:**
   - What are the inputs?
   - What are the expected outputs?
   - What are the error cases?
   - What are the edge cases?

3. **Identify existing test patterns:**
   - How does this codebase test similar code?
   - What test utilities exist?
   - What's the test file naming convention?

### Phase 2: Design Test Strategy

1. **Pick the kind** from the Testing Patterns by Target table above. If the
   code is not one of the four kinds, it gets no test — stop and tell the
   user. There is no snapshot tier to fall back on.

2. **Design inputs:**
   - Use made-up data that reads like real calls — transcripts in Gnani's
     real segment shape (`segment_id`, `start_time`, `end_time`, `text`,
     `speaker_id`) with Hinglish lines, a customer asking for a person, an
     order id spoken as words; the seeded checklist; genuine user flows
   - Never a real recorded call, phone number, address, or payment detail
   - Cover happy path, errors, edge cases — for routes, include the TRD's
     failure table (Gnani 429 / 5xx, failed jobs, empty transcript, bad LLM
     JSON twice, daily limit) and the webhook and cron arriving together

3. **Stub external services, not SunoAI:**
   - Stub Gnani and OpenRouter at the network boundary — intercept
     the HTTP request, return a fixture response. Run Supabase locally
     (Supabase CLI) so database rules, like the conditional status update,
     are really exercised
   - In Playwright, `page.route()` only sees requests the browser makes
     (Supabase sign-in and the signed upload); calls Hono makes to Gnani and
     OpenRouter need the server-side stub
   - Never mock SunoAI's own functions

### Phase 3: Implement Tests

1. **Work through systematically:**
   - Set up test file and imports
   - Create the synthetic inputs the assertions need
   - Implement happy path tests
   - Implement error case tests
   - Implement edge case tests

2. **Follow testing principles:**
   - Assert on results, not implementation
   - Use partial matching for complex objects
   - One assertion focus per test
   - Descriptive test names

3. **Test file structure:**

   Unit (Vitest):

   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('ModuleName', () => {
     describe('functionName', () => {
       it('returns expected output for valid input', () => {
         // Arrange
         const input = createFixture();

         // Act
         const result = functionName(input);

         // Assert
         expect(result.success).toBe(true);
         expect(result.data).toMatchObject({
           expectedField: 'value',
         });
       });

       it('returns error for invalid input', () => {
         // Error case test
       });
     });
   });
   ```

   API (Vitest through Hono's `app.request()`):

   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('POST /api/calls', () => {
     it('rejects a file type Gnani cannot read', async () => {
       const res = await app.request('/api/calls', {
         method: 'POST',
         body: JSON.stringify(createCallInput({ mimeType: 'image/png' })),
         headers: new Headers({ 'Content-Type': 'application/json' }),
       });

       expect(res.status).toBe(400);
       expect(await res.json()).toMatchObject({
         error: { code: expect.any(String) },
       });
     });
   });
   ```

   End to end (Playwright):

   ```typescript
   import { test, expect } from '@playwright/test';

   test('shows Needs review when a red flag is found', async ({ page }) => {
     await page.goto('/calls/{fixture-call-id}');

     await expect(page.getByText('Needs review')).toBeVisible();
   });
   ```

### Phase 4: Verify Tests

1. **Run tests:**

   ```bash
   pnpm test                    # All Vitest tests (unit + API)
   pnpm test path/to/test.ts   # Specific file
   pnpm test:e2e                # Playwright end to end
   ```

2. **Verify quality:**
   - [ ] Tests actually fail when code is broken
   - [ ] Tests are deterministic (run multiple times)
   - [ ] No flaky behavior
   - [ ] Error cases covered

3. **Check test output:**
   - Clear failure messages
   - Easy to understand what failed and why

## Output Format

After test implementation is complete:

````markdown
## Tests Implemented

### Target

{What was tested - module/route/flow}

### Test Files

| File                     | Tests | Description                   |
| ------------------------ | ----- | ----------------------------- |
| `path/to/module.test.ts` | 5     | Unit tests for core functions |

### Coverage

| Scenario    | Tests | Status |
| ----------- | ----- | ------ |
| Happy path  | 3     | ✅     |
| Error cases | 2     | ✅     |
| Edge cases  | 2     | ✅     |

### Key Test Patterns

{Notable patterns used - synthetic fixtures, network-boundary stubs, assertions, Playwright flow}

### Verification

```bash
pnpm test path/to/tests
```

- [ ] All tests passing
- [ ] Tests are deterministic
- [ ] Error cases covered

### Next Steps

{Any follow-up items or notes}
````

## Assertion Patterns Reference

### Partial Object Matching

```typescript
// Good - checks relevant fields
expect(result).toMatchObject({
  status: 'ready',
  report: { needs_review: true },
});

// Good - custom helper for domain objects
expectCheckResult(report, 'order-confirmed', 'pass');
```

### Array Assertions

```typescript
// Good - checks contents without order dependency
expect(result.items).toContain('expected-item');
expect(result.items).toHaveLength(3);

// Good - checks structure
expect(result.items).toEqual(
  expect.arrayContaining([expect.objectContaining({ id: 'item-1' })])
);
```

### Error Assertions

```typescript
// Good - checks error type and message
await expect(doThing()).rejects.toThrow('specific error');

// Good - checks error shape
const result = await doThing();
expect(result.success).toBe(false);
expect(result.error.code).toBe('VALIDATION_ERROR');

// Good - checks an API error response
expect(res.status).toBe(401);
expect(await res.json()).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
```

## Common Testing Frameworks

| Framework  | Use Case         | Import Pattern                                                        |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| Vitest     | Unit tests       | `import { describe, it, expect } from 'vitest'`                       |
| Vitest     | API tests        | `import { describe, it, expect } from 'vitest'`, then `app.request()` |
| Playwright | End-to-end tests | `import { test, expect } from '@playwright/test'`                     |

## Principles to Follow

1. **Result validation over coverage** — Good assertions matter more than line count
2. **Realistic, made-up inputs** — Made-up data that reads like real calls; never real recordings or personal data
3. **Partial matching** — Assert on what matters, not everything
4. **Stub external services, not SunoAI** — Stub Gnani and OpenRouter at the network boundary and run Supabase locally; never mock SunoAI's own functions
5. **Determinism** — Tests must produce same result every time
6. **One focus per test** — Each test should have one reason to fail
7. **Readable tests** — Test code is documentation
