# Agent Instructions

SunoAI checks recorded food delivery and quick-commerce support calls. It shows where the customer got frustrated, flags risky moments, scores the call against the team's checklist, gives the AI team fix notes and gives the human agent spoken coaching. It is built on Gnani AI's speech models for the Great Indian AI Internship Challenge 2026.

## Read first

| What | Where |
| --- | --- |
| What we're building and why | [`docs/PRD.md`](docs/PRD.md) |
| How it's built: stack, pipeline, Gnani and LLM integration, data model, API | [`docs/TRD.md`](docs/TRD.md) |
| Repo conventions | [`.claude/rules/`](.claude/rules/) |

Repo conventions live in `.claude/rules/`. That directory is the source of truth — read the relevant file before changing code in its area rather than inferring a convention from nearby code.

Start at [`.claude/rules/code-quality.md`](.claude/rules/code-quality.md): it is the governing principle and indexes every per-rule file. The ones to know before any change:

| Area | Rule |
| --- | --- |
| Secrets, data and the challenge's data rules | [`security-and-data.md`](.claude/rules/security-and-data.md) |
| Testing scope and philosophy | [`testing.md`](.claude/rules/testing.md) |
| Branches, commits, PRs, reviews | [`github.md`](.claude/rules/github.md) |

## Library APIs

There is no docs MCP server for this repo. For any library-specific code, check the official docs with WebFetch or WebSearch instead of relying on memory, because these libraries change quickly:

| Library | Docs |
| --- | --- |
| Next.js | https://nextjs.org/docs |
| TanStack Query | https://tanstack.com/query/latest/docs |
| shadcn/ui | https://ui.shadcn.com/docs |
| Hono | https://hono.dev/docs |
| Supabase | https://supabase.com/docs |
| Zod | https://zod.dev |
| Vitest | https://vitest.dev |
| Playwright | https://playwright.dev/docs/intro |
| OpenRouter | https://openrouter.ai/docs |
| Gnani AI | https://docs.gnani.ai |

## Status

Pre-production. The PRD and TRD are written; the app is not scaffolded yet. The planned commands are:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Claude-specific workflow assets — agents, commands, skills and permissions — live in `.claude/`. Other agents should read a `.claude/commands/*.md` or `.claude/skills/*/SKILL.md` for process guidance rather than trying to execute it.
