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

## Plan

One post a day on both platforms, each covering one piece of work. Days 1–4 cover work that is finished. Day 5 goes out once the seven test calls have run, Day 6 once the app is live on Vercel, and Day 7 is the demo post. If a day's work runs late, the plan moves back a day. The demo post must be live before 10 November.

| Day | Post on | Covers | Work status |
| --- | --- | --- | --- |
| 1 | 23 October | What SunoAI is, the plan, the first LLM test | Done (#1, #14) |
| 2 | 24 October | Gnani Prisma tells the AI agent, customer and human agent apart | Done (#13) |
| 3 | 25 October | Upload a call, get a report; "no quote, no pass" | Done (#3–#6) |
| 4 | 26 October | Spoken coaching with Gnani Timbre, and the checklist editor | Done (#7, #8, #21) |
| 5 | 27 October | Seven made-up test calls, results written down first | In progress |
| 6 | Now | SunoAI is live on Vercel | Done (#9) |
| 7 | Before 10 November | The demo video (nominate this one) | Not started |

## Drafts

### Day 1: Planning and the first LLM test

Not posted yet.

**LinkedIn**

```text
I'm building SunoAI for the Great Indian AI Internship Challenge by Gnani AI 🎧

"Mujhe kisi insaan se baat karni hai." ("I want to talk to a person.")

SunoAI listens to food delivery support calls and finds the exact moment a customer got frustrated with an AI agent. Gnani Prisma writes down the call with who said what, and Gnani Timbre coaches the human agent in their own language.

So far:
✅ Planned the product, a clickable prototype and the tech design (Next.js, Hono, Supabase)
✅ Tested free LLMs on a made-up Hinglish call: 24/24 valid answers, about 10 seconds each, ₹0

Next: testing Gnani Prisma on the same call.

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (279/280)

```text
Building SunoAI for #GreatIndianAIInternshipChallenge 🎧 It finds where a food delivery customer got frustrated with an AI support agent. @GnaniAi Prisma listens, Timbre coaches.

First test on free LLMs: 24/24 valid JSON, ~10s a call, ₹0.

Next: Prisma speaker labels. #GnaniAI
```

### Day 2: Gnani Prisma tells the speakers apart

Not posted yet. Attach a screenshot of the transcript with the three speakers labelled.

**LinkedIn**

```text
Day 2 of building SunoAI for the Great Indian AI Internship Challenge 🎧

A support call has three voices: the AI agent, the customer and the human agent who takes over. SunoAI needs to know who said what, or it can't tell where the AI agent failed and where the human agent picked up.

I voiced a made-up Hinglish call with Gnani Timbre and ran it through Gnani Prisma:
✅ 3 speakers found, 15 of 15 lines given to the right one
✅ 5.7 seconds to transcribe a 65-second call
✅ The LLM report on Prisma's transcript matched the report on the perfect script, 6 runs out of 6

The one miss: the order id "FD 4572" swallowed the "one" from "ek ghante" right after it. The report didn't change.

Next: uploading a call and getting a report back.

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (257/280)

```text
Day 2 of SunoAI for #GreatIndianAIInternshipChallenge 🎧

I ran a made-up Hinglish support call through @GnaniAi Prisma. It told the AI agent, the customer and the human agent apart: 15/15 lines right, 5.7s for a 65s call.

Next: upload and report. #GnaniAI
```

### Day 3: Upload a call, get a report

Not posted yet. Attach a screenshot of the report page: the frustration timeline, the checklist and a red flag.

**LinkedIn**

```text
Day 3 of SunoAI for the Great Indian AI Internship Challenge 🎧

You can now upload a support call and get a report:
📈 A frustration timeline showing where the customer got upset, and the line where it turned
🚩 Red flags, like a customer asking for a person and not getting one
✅ A score against the team's checklist
🛠️ Fix notes for the AI team

Every line in the report jumps to that moment in the transcript.

The rule I care about most: no quote, no pass. The LLM has to quote the call for every check it passes. Code looks for that quote in the transcript, and if it isn't there, the check becomes a miss. An AI report you can't check isn't worth much.

Gnani Prisma writes the transcript; an LLM reads it.

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (271/280)

```text
Day 3 of SunoAI 🎧 Upload a call, get a report: where the customer got frustrated, risky moments, a checklist score.

Rule: no quote, no pass. If the AI can't quote the call, the check fails.

Speech-to-text by @GnaniAi Prisma.

#GreatIndianAIInternshipChallenge #GnaniAI
```

### Day 4: Spoken coaching and the checklist editor

Not posted yet. Attach a short screen recording of the coaching audio playing on the report page.

**LinkedIn**

```text
Day 4 of SunoAI for the Great Indian AI Internship Challenge 🎧

A report helps the team leader. The human agent needs something simpler: a few words of coaching they can listen to.

SunoAI now writes coaching for the human agent and speaks it with Gnani Timbre, in the language of the call. It talks to the agent by name, in plain spoken words, about what they did on this call.

One thing I fixed this week: Hinglish coaching came back in Devanagari, so it was just Hindi. Now it's written in Roman letters with everyday English words kept in English, the way people actually talk. Checked by ear on Timbre's Hindi and Hinglish voices.

Team leaders can also edit the checklist every call is scored against.

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (254/280)

```text
Day 4 of SunoAI 🎧 After each call, the human agent gets spoken coaching in their own language from @GnaniAi Timbre: Hindi, Hinglish and more.

Team leads can now edit the checklist each call is scored against.

#GreatIndianAIInternshipChallenge #GnaniAI
```

### Day 5: Seven test calls

Not posted yet. Post after the seven calls in `scripts/calls/` have run (`pnpm check:calls`), and fill in the results in brackets. Attach a screenshot of the rude-agent call's report.

**LinkedIn**

```text
Day 5 of SunoAI for the Great Indian AI Internship Challenge 🎧

How do you know an AI call checker is right? Write down the answer before you run it.

I wrote seven made-up support calls, voiced them with Gnani Timbre, and wrote down the score, red flags and peak frustration I expected for each before running them:
😠 A human agent who brushes off a customer with broken eggs
🪳 An insect in the food, answered with a coupon
🛍️ A missing item, handled well
🔁 An AI agent that asks for the order ID again and again
⏰ A late order where the AI agent ignores a request for a person
💸 A happy customer, but a refund promise the rules don't allow
🔀 A customer who goes from calm to annoyed to angry, then calms down

SunoAI matched [N] of 7. [What it got wrong, in one line.]

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (278/280 with one digit in place of [N])

```text
Day 5 of SunoAI 🎧 Seven made-up support calls, voiced by @GnaniAi Timbre: a rude agent, an insect in food, a missing item, an order ID loop, a late order, a forbidden promise, a mood swing.

Answers written first. SunoAI matched [N]/7.

#GreatIndianAIInternshipChallenge #GnaniAI
```

### Day 6: SunoAI is live

Not posted yet. The app is live at https://suno-ai.vercel.app (X counts any link as 23 characters).

**LinkedIn**

```text
SunoAI is live 🎧

Upload a recorded food delivery support call and SunoAI shows:
📈 Where the customer got frustrated, and the line where it turned
🚩 Risky moments, like a customer asking for a person and not getting one
✅ A score against your team's checklist, with a quote from the call for every pass
🎧 Spoken coaching for the human agent, in their language

Built on Gnani Prisma for speech-to-text and Gnani Timbre for text-to-speech.

Try it: https://suno-ai.vercel.app

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (259/280 with the link)

```text
SunoAI is live 🎧 Upload a food delivery support call and see where the customer got frustrated, what went wrong and how the agent can do better.

Built on @GnaniAi Prisma and Timbre. Try it: https://suno-ai.vercel.app

#GreatIndianAIInternshipChallenge #GnaniAI
```

### Day 7: The demo post

Not posted yet. This is the post to nominate (see [The demo post](#the-demo-post)). Attach a 60-second video of the real, deployed app: upload a test call, open the report, jump to the turning point, play the coaching. Record a row with **Nominated: yes** in the log.

**LinkedIn**

```text
Meet SunoAI 🎧 the AI that listens to your customer calls and shows exactly where your agents, human ho ya AI, are losing customers.

Watch the demo 👇
Order ek ghanta late. Customer: "Mujhe kisi insaan se baat karni hai."
Bot: same line. Again. 🙃

SunoAI catches the exact moment the customer got angry, flags it, and gives the agent spoken coaching in their own language.

Powered by Gnani Prisma and Gnani Timbre. (Call is made-up.)

Try it yourself 👉 https://suno-ai.vercel.app

@Gnani AI
#GreatIndianAIInternshipChallenge #GnaniAI
```

**X** (279/280)

```text
SunoAI 🎧 listens to customer calls and shows where your agents, human ho ya AI, mess up.

Demo: order late. Customer: "mujhe kisi insaan se baat karni hai." Bot: same line, again 🙃

@GnaniAi Prisma + Timbre 👉 https://suno-ai.vercel.app

#GreatIndianAIInternshipChallenge #GnaniAI
```

## Posted

Nothing yet.
