# SunoAI Product Document

Last updated: 9 October 2026

## Summary

SunoAI checks food delivery and quick-commerce support calls, shows where the customer got frustrated, and helps fix both the AI agent and the human agent.

On these calls an AI voice agent answers first and hands over to a human when needed. A team leader uploads a call, and SunoAI writes down every word, checks it against the team's own checklist, and shows a short report: the score, red flags, and how frustrated the customer got and when. Every result quotes the exact words from the call as proof.

The report then gives the AI team fix notes for what the AI got wrong, and gives the human agent spoken coaching in their own language.

## Problem

In food delivery and quick commerce, customers often get frustrated with the AI agent long before they reach a person, and nobody checks why.

- **The AI gets stuck.** It repeats the same answer or keeps saying it didn't understand, often when the customer switches to Hinglish.
- **No way out.** Customers ask for a person and stay with the AI.
- **Wrong promises.** The AI can promise a refund, compensation or delivery time that the company's rules don't allow.
- **Safety issues slip through.** An insect in the food, food poisoning or a rider complaint should reach a person straight away.
- **Humans inherit angry customers.** By the handover the customer is already upset, and often has to explain everything again.
- **Checking is slow and late.** Team leaders listen to calls one by one, and feedback reaches agents days later, usually in English.

## Users

The team leader uses SunoAI every day and passes what it finds to two groups: the AI team and the human agents.

| User | Who they are | What they need | What SunoAI gives them |
| --- | --- | --- | --- |
| Team leader (primary) | Runs the support team for a food delivery or quick-commerce app, and checks calls | A quick, trustworthy view of how a call went and where it went wrong | Score, red flags, frustration, summary and a checklist with proof |
| AI team (secondary) | Sets up and improves the company's AI voice agent | Exactly where the AI frustrated a customer | Fix notes, each tied to a moment in the call |
| Human agent (secondary) | Takes over calls from the AI, in Hindi, Hinglish or a regional language | Short, kind, specific feedback they can use on the next call | Spoken coaching in their own language, played by the team leader |

Customers never use SunoAI, but they get faster help and fewer dead ends.

## Goals and non-goals

SunoAI points the team leader to what went wrong on a call; it never replaces their judgement.

**Goals**

- A team leader understands how a call went within 10 seconds of opening the report.
- The report shows where the customer got frustrated, and why.
- Every result is backed by the exact words from the call.
- The same call always gets the same score.
- Calls that need a person's attention stand out at once.
- The AI team gets fix notes, and the human agent hears coaching in their own language.
- It works on real phone audio: noisy lines, speakerphone and mixed languages.

**Non-goals**

- Ranking or punishing agents automatically.
- Changing the AI agent by itself. SunoAI suggests fixes; the AI team decides.
- Recording calls. SunoAI only reads recordings the team already has.
- Checking calls live, while they happen.
- Calls longer than 30 minutes, in the first version.

## User journey

A team leader goes from a recording to fix notes and a coached agent without listening to the whole call.

**Team leader: checking a call**

1. Opens SunoAI and uploads a call recording.
2. Picks the language of the call and the human agent's language for coaching.
3. Taps "Check this call" and waits while the page shows progress: transcribing, then analysing.
4. Reads the report: "Needs review" and red flags first, then the score, frustration, summary, checklist and transcript.
5. Passes the fix notes to the AI team.
6. Plays the coaching to the human agent, for example during a one-to-one.
7. Sees the call added to Recent calls, with the team's average score.

**Team leader: setting the rules (once, then whenever they change)**

1. Opens the checklist editor.
2. Adds, changes or removes checks and red flags.
3. Writes the company's refund and compensation rules, so SunoAI can spot wrong promises.

**Human agent**

1. Hears the coaching in their own language: one thing done well, one thing to improve.
2. Looks at the checklist to see the exact words behind each result.
3. Uses the tip on the next call.

**AI team**

1. Reads each fix note: what the AI said, the customer's words, and what should have happened.
2. Changes the AI agent, then checks a new call to see the fix work.

## Features

The report puts what needs attention first, then the detail behind it; the checklist editor lets each team set its own rules.

| Part | What it shows | What it must do |
| --- | --- | --- |
| Upload | A call recording up to 30 minutes and 50 MB | Say clearly when a file is too long, too big or the wrong type |
| Needs review | A big label at the top when any red flag is found | Appear whatever the score |
| Red flags | Each problem found, in red | Quote the words that raised the flag, and say whether the AI or the human was speaking |
| Score | Passed checks out of the checks that apply | Counted by fixed rules, never estimated; shown in colour and in words |
| Frustration | Calm, annoyed or angry, and the moment it changed | Quote the line where the customer's mood turned |
| Summary | Why the customer called, what happened and how it ended, in 2 or 3 sentences | Stay short and factual |
| Agent checklist | Each check marked Passed, Missed or Not needed | A quote as proof for every Passed; no quote means Missed |
| Transcript | Every word, as a chat between AI agent, human agent and customer | Mark the handover; say clearly that who-said-what is a best guess |
| AI fix notes | What the AI got wrong, the customer's words and what should have happened | One note per problem, written for the AI team |
| Human coaching | One thing done well and one to improve | Spoken in the agent's language, friendly, 2 or 3 sentences, played by the team leader |
| Checklist editor | The team's checks, red flags, and refund and compensation rules | Let team leaders add, change and remove them |
| Recent calls | The last 10 checked calls with score, frustration and "Needs review" | Show the team's average score |

## Checklist and red flags

SunoAI starts with 6 checks and 4 red flags for food delivery and quick commerce, and team leaders can change all of them in the checklist editor.

| # | Check | Passes when the agent… |
| --- | --- | --- |
| 1 | Order confirmed | Confirms which order the call is about |
| 2 | Problem understood | Gets the problem right without making the customer repeat it |
| 3 | Frustration acknowledged | Recognises the customer's frustration, for example "I understand this is frustrating" |
| 4 | Solution or next step | Offers a refund, replacement or clear delivery time within the company's rules |
| 5 | Smooth handover | Passes the call to a human who already knows the problem (Not needed when there is no handover) |
| 6 | Closing | Checks the customer is happy with the outcome before ending |

| Red flag | Example |
| --- | --- |
| Customer asked for a human and wasn't transferred | "Mujhe kisi insaan se baat karni hai", and the AI carries on |
| Agent stuck in a loop | "Sorry, I didn't understand. Please tell me your order ID", three times in a row |
| Wrong or made-up promise | "You'll get a full refund and ₹500 extra", when the rules don't allow it |
| Safety issue not escalated | "There was an insect in my food", and the call isn't passed to a person |

**Scoring rules**

- The score is passed checks out of the checks that apply; a check marked Not needed doesn't count.
- A check passes only when a quote from the call proves it.
- 80% or more is Good (green), 50–79% is Needs work (amber), under 50% is Poor (red).
- Any red flag adds a "Needs review" label at the top, whatever the score. The score itself stays the same.
- Wrong promises are judged against the refund and compensation rules the team writes in the checklist editor.

## Languages

Calls and coaching both work in 11 language options: Hindi, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, English and Hinglish.

- The call language and the coaching language are picked separately, so a Hinglish call can be coached in Bengali.
- Tanglish and Benglish calls are checked with Tamil or Bengali picked.
- Odia and Bhojpuri are not supported yet.

## What makes it different

SunoAI is built for support calls where an AI agent and a human share the work, in the languages customers really speak.

- **Finds where frustration starts.** It shows the exact moment the customer's mood turned, and whether the AI or the human was speaking.
- **Checks the AI and the human.** Fix notes for the AI team and coaching for the human agent, from the same call.
- **Catches bad handovers.** It flags when a customer asks for a person and doesn't get one, and when the person makes them repeat everything.
- **Indian languages and mixed speech.** Hinglish, Tanglish and Benglish calls on noisy phone lines.
- **Proof, not opinions.** Every result quotes the call, and the same call always gets the same score.
- **The team's own rules.** Team leaders write their own checks, red flags, and refund and compensation rules.

## Trust, accuracy and privacy

SunoAI shows its proof, says what it is unsure of, and leaves every decision to a person.

- **No quote, no pass.** A check or red flag without the call's own words does not count.
- **Guesses are labelled.** Who said what, and where the handover happened, are marked as a best guess.
- **People decide.** SunoAI never ranks, warns or punishes an agent by itself, and never changes the AI agent by itself.
- **The team's rules, not the AI's.** Promises are judged against the refund and compensation rules the team writes.
- **Allowed calls only.** SunoAI is used only on recordings the team is allowed to use. For the challenge demo, we will try to make every test call synthetic with Gnani Timbre, giving each speaker its own voice. If that isn't possible, we will record our own acted calls. Either way, names, order numbers and app names are made up.
- **No personal data in examples.** No real phone numbers, addresses, Aadhaar, PAN or payment details.
- **Nothing hidden on screen.** Error messages never show internal details.

## How we know it works

SunoAI works when a team leader trusts the report at a glance, and both the AI team and the agents can act on it.

| Measure | How we check it | Proposed target |
| --- | --- | --- |
| Time to understand a call | Time a team leader from opening the report to saying how the call went | Under 10 seconds |
| Results with proof | Share of passed checks and red flags that quote the call | 100% |
| Same call, same score | Check the same call 3 times | Same score every time |
| Red flags caught | Test calls with a planted red flag | Every planted flag found |
| Frustration moment found | Test calls where the customer turns angry at a known line | That line is quoted |
| Transcripts on noisy calls | Compare transcripts of noisy test calls with their scripts | Measure first, then set a target |
| Useful fix notes and coaching | Ask the AI team and agents whether the notes were clear and useful | Measure first, then set a target |

## Decisions

All open product questions were settled on 9 October 2026.

| Decision | Choice |
| --- | --- |
| Name | SunoAI |
| Industry | A made-up food delivery and quick-commerce app |
| Who handles the calls | An AI agent first, handing over to a human when needed; SunoAI checks both |
| Checklist | Team leaders can edit the checks, red flags, and refund and compensation rules |
| Red flags | A "Needs review" label at the top, whatever the score; the score stays the same |
| Coaching for human agents | Played by the team leader |
| Test calls | Synthetic calls made with Gnani Timbre if possible; otherwise our own acted recordings |

## Future ideas

These would make SunoAI a full team tool; none is in the first version.

- **Calls over 30 minutes**, split into parts before analysis.
- **Exact speaker roles**, from stereo recordings or the AI agent's own logs, instead of a best guess.
- **Live alerts** that tell the AI to hand over before the customer gets angry.
- **Before and after** for AI fixes: compare calls from before and after a change.
- **Trends** per agent, per AI flow and per team, such as the check most often missed.
- **Coaching sent** straight to the human agent's phone after each call.
- **Practice mode** where human agents rehearse difficult calls with a voice customer.
