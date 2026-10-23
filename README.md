# SunoAI

SunoAI checks food delivery and quick-commerce support calls. It shows where the customer got frustrated, what the AI agent got wrong, and how the human agent did, with the exact words from the call as proof.

Built for Gnani AI's [Great Indian AI Internship Challenge 2026](https://www.gnani.ai/internship).

> **Status:** pre-production. The app is scaffolded with every tool in place; features are being built.

## What it does

A team leader uploads a call recording and gets a report:

- **Needs review** at the top when a red flag is found, such as a customer asking for a person and not being transferred
- **Score** from the team's own checklist, with a quote from the call behind every result
- **Frustration** across the call: calm, annoyed or angry, and the line where it turned
- **Summary** and a **transcript** split between the AI agent, the human agent and the customer
- **AI fix notes** for the team that runs the AI agent
- **Spoken coaching** for the human agent, in their own language

It works in Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, English and Hinglish.

## Docs

| Document | What it covers |
| --- | --- |
| [Product Document](docs/PRD.md) | Problem, users, features, checklist and red flags, languages, success measures, decisions |
| [Technical Requirements](docs/TRD.md) | Architecture, call pipeline, Gnani and LLM integration, data model, API, frontend, security, testing, deployment |
| [Prototype](https://claude.ai/artifact/MtyZJxoHXg5a61X6216nTk) | Clickable visual reference with made-up sample calls |
| [Posts](docs/posts.md) | Progress posts on LinkedIn and X: the rules every post follows, a log of what's live, and drafts |

## How Gnani AI is used

| Gnani model | What SunoAI uses it for |
| --- | --- |
| Prisma v2.5, Batch speech-to-text | Writing down every call, with speaker labels, timestamps and noise removal |
| Timbre v2.5, text-to-speech | Speaking coaching to the human agent in their language |

The analysis (checklist, red flags, frustration, fix notes) comes from Qwen 3.8 Flash on OpenRouter. Our own code checks every quote and counts the score.

## Stack

| Part | Choice |
| --- | --- |
| Frontend | Next.js (App Router), TanStack Query, shadcn/ui |
| Backend | Hono inside a Next.js route handler, on Vercel |
| Data | Supabase: Postgres, Auth, Storage and Cron |
| Validation | Zod |
| Tests | Vitest and Playwright |
| Package manager | pnpm |

## Getting started

You need Node 24 (see `.nvmrc`), pnpm 10 and a Supabase project for development. There is no local Supabase, so Docker isn't needed.

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

The home page shows the answer from `GET /api/health`, fetched through the typed Hono client.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the app at http://localhost:3000 |
| `pnpm build` | Builds the app for production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |
| `pnpm test` | Vitest unit and API tests (`*.test.ts`) |
| `pnpm test:e2e` | Playwright end-to-end tests (`e2e/*.spec.ts`); builds and starts the app unless one is already running on port 3000 |
| `pnpm check:calls` | Runs the six test calls in `scripts/calls/` through the real LLM and lists every difference from their expected results (see the TRD's [Testing](docs/TRD.md#testing)) |
| `pnpm format` | Prettier |

**Supabase.** Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). From its **API Keys** page, put the project URL in `NEXT_PUBLIC_SUPABASE_URL`, the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the secret key in `SUPABASE_SECRET_KEY`. Then link the CLI with `pnpm supabase login` and `pnpm supabase link --project-ref <ref>`; `pnpm supabase db push` applies the migrations in `supabase/migrations`, and `pnpm supabase config push` applies the auth settings in `supabase/config.toml` (sign-up on, email confirmation off). To rebuild the dev project with the seed, run `pnpm supabase db reset --linked`; it also deletes every account, so sign up again at `/signup` afterwards. After a schema change, run `pnpm db:types` to regenerate `lib/database.types.ts`.

**Test project.** API tests run against a second Supabase project, never the dev one. Create it, then put its URL and keys in `.env.test.local` under the same three names as above, plus `SUPABASE_TEST_DB_URL`: the **Session pooler** connection string from the project's **Connect** dialog, with the password filled in and percent-encoded. Apply the auth settings once with `pnpm supabase config push --project-ref <test ref>`, and run `pnpm db:reset:test` after every new migration. `pnpm test` reads only `.env.test.local`, and stops with a clear message if the file is missing or points at the dev project.

**End-to-end tests.** `pnpm test:e2e` runs against a production build (`pnpm build && pnpm start`), so it uses the dev project from `.env.local`. Stop `pnpm dev` first, or the tests reuse it. The tests under `e2e/signed-in/` create a team leader for the run, sign in, and delete the account and any calls they seeded when they finish. They never reach Gnani.

**Webhook locally.** Gnani can't reach `localhost`, so its webhook doesn't fire in development. To finish a call stuck in Transcribing, call the poll route by hand: `curl -X POST http://localhost:3000/api/jobs/poll -H "x-cron-secret: $CRON_SECRET"`.

`.env.local` is also read by the hand-run scripts in `scripts/` (the test calls and the spike). Never commit it.

## Repository layout

```
app/          Next.js pages and the /api route that mounts Hono
server/       Server-only code: the Hono app (server/app.ts), Gnani and LLM wrappers, API tests
components/   React components, including shadcn/ui parts in components/ui
hooks/        TanStack Query hooks
lib/          Code the browser may import: the typed Hono client and shared helpers
e2e/          Playwright tests
supabase/     Supabase CLI config
scripts/      Hand-run scripts: the six test calls, voicing them, checking them and the Gnani and LLM spike
docs/         PRD, TRD and spike write-ups
.claude/      Claude Code agents, commands, skills, rules and settings
AGENTS.md     Instructions for coding agents working in this repo
```

## Data and privacy

Every call used for testing and the demo is synthetic or acted, with made-up names, order numbers and app names. The repo never contains real customer calls, phone numbers, addresses, Aadhaar, PAN or payment details. See [`.claude/rules/security-and-data.md`](.claude/rules/security-and-data.md).

## Working with Claude Code

This repo ships a Claude Code setup in `.claude/`:

- **Agents:** `principal-architect`, `sde2`, `tester`, `devops`
- **Commands:** `/implement`, `/implement-test`, `/pr-review`, `/pr-fix`, `/analyze-deps`, `/ui-audit`
- **Rules:** start at [`.claude/rules/code-quality.md`](.claude/rules/code-quality.md)

Coding agents should read [`AGENTS.md`](AGENTS.md) first.
