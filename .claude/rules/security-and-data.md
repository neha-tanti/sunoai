# Security and Data

API keys stay on the server, the browser reaches nothing but Hono and Supabase's sign-in and signed uploads, and no call content leaves the server through an error response or a log line. Every call SunoAI checks for the challenge is synthetic, and nothing the LLM returns counts until code has checked it.

## Rules

- **Secrets are server-only.** The Gnani key (`GNANI_API_KEY`), the OpenRouter key (`OPENROUTER_API_KEY`), the Supabase secret / service-role key (`SUPABASE_SECRET_KEY`), the webhook token (`GNANI_WEBHOOK_TOKEN`) and the cron secret (`CRON_SECRET`) are never in browser code, never prefixed `NEXT_PUBLIC_`, and never committed. `.env*` files stay out of git; only `.env.example`, with placeholder values, is committed.
- **The browser talks only to Hono**, plus Supabase for sign-in and signed uploads (`uploadToSignedUrl`). Gnani, OpenRouter and the database are reached only from Hono.
- **Page routes run as the signed-in user.** They use the user's Supabase session, so row-level security applies. Only the webhook (`POST /api/webhooks/gnani`) and cron (`POST /api/jobs/poll`) routes use the secret / service-role key.
- **Storage buckets are private.** Files are shared only through short-lived signed URLs: 2 hours for Gnani to read a recording, 10 minutes for the page to play coaching audio.
- **Upstream errors stay on the server.** Never return Gnani, OpenRouter or Supabase error details to the client; log them server-side and return `{ "error": { "code", "message" } }` with a message a person can act on.
- **Logs hold ids, statuses and timings only.** No transcript text, quotes or audio URLs.
- **Test and demo data is synthetic.** Gnani's challenge rules forbid real customers, phone numbers, addresses, account numbers, Aadhaar, PAN, payment details and real recorded calls. Test calls are made with Gnani Timbre where possible, otherwise our own acted recordings; names, order numbers and app names are made up. Test recordings are never committed.
- **The webhook is verified twice.** Compare the callback URL's `token` with `GNANI_WEBHOOK_TOKEN` in constant time, then re-read the job status from Gnani before trusting the payload. The cron route checks the `x-cron-secret` header against `CRON_SECRET` the same way.
- **LLM output is never trusted directly.** Validate it with Zod, and enforce "no quote, no pass" and the score calculation in code: a pass without a quote found in its segment becomes a miss, a red flag without one is dropped, and the score is passed checks divided by checks not marked `na`.

## Enforcement

Review only — there is no automated scan. Reject at review a secret reachable from browser code, call content in a log line or error response, a real recording or real personal data in the repo, or LLM output used without the Zod and quote checks.
