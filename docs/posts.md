# Posts

Progress posts about SunoAI on LinkedIn and X for the [Great Indian AI Internship Challenge](https://www.gnani.ai/internship). When a post goes live, add a row to the log with its link, and move its draft into Posted.

## Rules for every post

- **Tag Gnani AI.** On LinkedIn, type `@Gnani` and pick the **Gnani AI** company page. On X, use **@GnaniAi**.
- **Use both hashtags, spelled exactly:** `#GreatIndianAIInternshipChallenge` and `#GnaniAI`.
- **Say what SunoAI does and which Gnani technology it uses** (Prisma for speech-to-text, Timbre for text-to-speech).
- **On X, stay within 280 characters.** Most emojis count as 2.
- **Synthetic data only.** No real calls, phone numbers, Aadhaar, PAN, payment details, API keys or `.env` files in the text, screenshots or videos.
- **Grow engagement honestly.** No bought likes, bots, paid promotion or engagement swaps; Gnani can disqualify entries for them.

## The demo post

This is the post that decides shortlisting. Progress posts build an audience for it.

- Shortlisting counts verified reactions, comments and reshares on the post you **nominate in your submission**: one per platform, recorded by the closing cutoff.
- It shows the **real app working in a video** (the best 60-second demo wins the Demo Day Drop award), and explains what SunoAI does and the Gnani technology used. Never use the prototype as the demo.
- It must be **live before you submit**.
- The Crowd Favourite award is decided by public votes on LinkedIn and X using both hashtags.
- **Deadline: 10 November 2026, 11:59 PM IST.**

## Log

| Date posted | Platform | What it covers | Link | Nominated |
| --- | --- | --- | --- | --- |
| – | – | Nothing posted yet | – | – |

## Drafts

### Planning and the first LLM test (9–10 October 2026)

Not posted yet.

**LinkedIn**

```text
I'm building SunoAI for the Great Indian AI Internship Challenge by Gnani AI 🎧

"Mujhe kisi insaan se baat karni hai."
("I want to talk to a person.")

Almost every food delivery customer has said this to an AI support agent. SunoAI finds the exact moment a support call goes wrong.

What it will do:
🎧 Listen to a support call where an AI agent hands over to a human
😤 Show where the customer got frustrated, and why
🚩 Flag risky moments, like a customer asking for a person and not getting one
🛠️ Give the AI team fix notes, and coach the human agent in their own language
Every result quotes the exact words from the call as proof.

How I planned it, before writing any app code:
1️⃣ A product document: the problem, the users, the checklist and red flags
2️⃣ A clickable prototype, to see the report before building it
3️⃣ A technical design: Next.js, TanStack Query, shadcn/ui, Hono and Supabase
4️⃣ Gnani Prisma to listen (speech-to-text with speaker labels and timestamps) and Gnani Timbre to speak the coaching
5️⃣ GitHub issues, built one at a time

First test: the AI "brain" 🧪
I wrote a made-up Hinglish support call and ran it through free open-weight models on OpenRouter, 3 times for each setup.
• It took 4 prompt versions to get right
• 24 out of 24 answers came back as valid JSON
• My "no quote, no pass" rule caught 10 quotes where the model had changed a word
• Turning the model's reasoning off took it from up to 70 seconds per call to about 10
• Letting my code, not the model, decide the handover made it right in every run since

Cost so far: ₹0.

Next: running the same call through Gnani Prisma. Can it tell the AI voice, the human agent and the customer apart?

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (279/280)

```text
Building SunoAI for #GreatIndianAIInternshipChallenge 🎧 It finds where a food delivery customer got frustrated with an AI support agent. @GnaniAi Prisma listens, Timbre coaches.

First test on free LLMs: 24/24 valid JSON, ~10s a call, ₹0.

Next: Prisma speaker labels. #GnaniAI
```

## Posted

Nothing yet.
