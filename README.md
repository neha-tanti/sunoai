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

There is no sign-up: **Try it** on the homepage opens the app, and visitors without a recording can check one of three made-up example calls.

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
| Prisma v3.0, Batch speech-to-text | Writing down every call, with speaker labels, timestamps and noise removal |
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
| `pnpm dev:test` | Runs the app on the Supabase test project, to try a branch's code or migration |
| `pnpm build` | Builds the app for production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |
| `pnpm test` | Vitest unit and API tests (`*.test.ts`) |
| `pnpm test:e2e` | Playwright end-to-end tests (`e2e/*.spec.ts`); builds and starts the app on the test project |
| `pnpm check:calls` | Runs the seven test calls in `scripts/calls/` through the real LLM and lists every difference from their expected results (see the TRD's [Testing](docs/TRD.md#testing)) |
| `pnpm format` | Prettier |

**Supabase.** Create a project at [supabase.com/dashboard](https://supabase.com/dashboard). From its **API Keys** page, put the project URL in `NEXT_PUBLIC_SUPABASE_URL`, the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the secret key in `SUPABASE_SECRET_KEY`. Then link the CLI with `pnpm supabase login` and `pnpm supabase link --project-ref <ref>`; `pnpm supabase db push` applies the migrations in `supabase/migrations`, and `pnpm supabase config push` applies the auth settings in `supabase/config.toml` (anonymous sign-ins on, email confirmation off). This project is also production, so it only ever gets `db push`, never `db reset`: push a migration only once its PR merges, and write it to work with the code already on `main`. After a schema change, run `pnpm db:types` to regenerate `lib/database.types.ts`.

**Test project.** API and end-to-end tests run against a second Supabase project, never the dev/production one. Create it, then put its URL and keys in `.env.test.local` under the same three names as above, plus `SUPABASE_TEST_DB_URL`: the **Session pooler** connection string from the project's **Connect** dialog, with the password filled in and percent-encoded. Apply the auth settings once with `pnpm supabase config push --project-ref <test ref>`, and run `pnpm db:reset:test` after every new migration. `pnpm test`, `pnpm test:e2e` and `pnpm dev:test` stop with a clear message if `.env.test.local` is missing or points at the dev/production project.

**Deploying.** Production is one Vercel project on the dev Supabase project; the TRD's [Deployment and environment variables](docs/TRD.md#deployment-and-environment-variables) lists what it needs.

1. Create the Vercel project from this GitHub repository, with Fluid compute on. Give Production and Preview every variable in `.env.example`: the dev project's Supabase keys, the same `GNANI_API_KEY` as `.env.local`, a fresh `GNANI_WEBHOOK_TOKEN` and `CRON_SECRET`, and `APP_URL` set to the production domain (`https://<project>.vercel.app`, no trailing slash).
2. Once the production deployment is live, add the two secrets the cron job reads in the project's SQL editor: `select vault.create_secret('<APP_URL>', 'app_url');` and `select vault.create_secret('<CRON_SECRET>', 'cron_secret');`. Change one later with `select vault.update_secret((select id from vault.secrets where name = 'cron_secret'), '<new value>');`, and change `CRON_SECRET` in Vercel at the same time.
3. Check that `curl -X POST <APP_URL>/api/jobs/poll` answers `401` from the API, not Vercel's login page. Within a few minutes, `select status, return_message from cron.job_run_details order by start_time desc limit 3` should show `succeeded`, and `select status_code, timed_out, error_msg from net._http_response order by created desc limit 3` should show `202` and no timeouts.
4. Put the example calls the check page offers in the private `examples` bucket: voice them with `node --env-file=.env.local scripts/make-call.mjs --call <name>` if `test-calls/calls/` doesn't have them yet, then run `pnpm tsx --env-file=.env.local scripts/upload-examples.mts`.

**End-to-end tests.** `pnpm test:e2e` builds and starts the app (`pnpm build && pnpm start`) on the test project from `.env.test.local`, so run `pnpm db:reset:test` first after a new migration, and stop `pnpm dev` first, since the tests need port 3000. That build has the test project's URL compiled in, so run `pnpm build` again before a plain `pnpm start`. The tests under `e2e/signed-in/` create a team leader for the run, sign in, and delete the account and any calls they seeded when they finish. They never reach Gnani.

**Webhook locally.** Gnani can't reach `localhost`, so its webhook doesn't fire in development. Under `pnpm dev`, production's cron job finishes local calls instead, a minute or two after Gnani does, with `main`'s code and its own `GNANI_API_KEY`: a call made with a different key is failed, and one left in Analysing for over 5 minutes is failed too. To run a call through your branch's code or schema, use `pnpm dev:test`, which runs the app on the test project (after `pnpm db:reset:test`). Nothing polls there, so once a call has been in Transcribing for over a minute, finish it by hand: `curl -X POST http://localhost:3000/api/jobs/poll -H "x-cron-secret: $CRON_SECRET"`.

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
scripts/      Hand-run scripts: the seven test calls, voicing them, checking them and the Gnani and LLM spike
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
