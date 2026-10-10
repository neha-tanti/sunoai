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

The analysis (checklist, red flags, frustration, fix notes) comes from a free open-weight model on OpenRouter. Our own code checks every quote and counts the score.

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

You need Node 24 (see `.nvmrc`) and pnpm 10. Docker is needed only to run Supabase locally.

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
| `pnpm test:e2e` | Playwright end-to-end tests (`e2e/*.spec.ts`); starts `pnpm dev` if it isn't running |
| `pnpm format` | Prettier |

**Supabase locally.** `pnpm supabase start` runs Postgres, Auth and Storage in Docker and prints the local URL and keys. Put the URL in `NEXT_PUBLIC_SUPABASE_URL`, the publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and the secret key in `SUPABASE_SECRET_KEY`. `pnpm supabase stop` stops it.

`.env.local` is also read by the hand-run spike scripts in `scripts/spike/`. Never commit it.

## Repository layout

```
app/          Next.js pages and the /api route that mounts Hono
server/       Server-only code: the Hono app (server/app.ts), Gnani and LLM wrappers, API tests
components/   React components, including shadcn/ui parts in components/ui
hooks/        TanStack Query hooks
lib/          Code the browser may import: the typed Hono client and shared helpers
e2e/          Playwright tests
supabase/     Supabase CLI config
scripts/      Hand-run scripts (the Gnani and LLM spike)
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
