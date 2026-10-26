# How SunoAI works

SunoAI checks recorded food delivery and quick-commerce support calls, where an AI voice agent answers first and may hand the call to a human agent. For each call it shows where the customer got frustrated, flags risky moments, scores the call against the team's checklist, writes fix notes for the AI team and gives the human agent spoken coaching.

Try it at https://suno-ai.vercel.app: click "Try an example call" (no sign-up), then check one of three made-up example calls.

## 1. Upload a call, or pick an example

Upload a recording (WAV, MP3, MP4, FLAC, OGG, OPUS, M4A, AAC, WEBM or AMR, up to 50 MB and 30 minutes) and pick up to three call languages, or pick one of the example calls. The examples are made-up calls voiced with Gnani Timbre. Every call a visitor checks is visible to other visitors, so only made-up calls should be uploaded.

## 2. Transcribe with Gnani

Gnani's Batch speech-to-text (Prisma v2.5) transcribes the call, separates the speakers and gives each line its start time. Calls can be in Hindi, English, Bengali, Marathi, Tamil, Telugu, Kannada or Malayalam, including Hindi and English mixed in one call.

## 3. Analyse the transcript

One LLM request reads the transcript with the team's checklist and refund rules and returns the whole report as JSON. Code then checks it before anything is saved:

- A check passes only with a quote found in the line it cites: no quote, no pass.
- A red flag without a quote from its line is dropped.
- The score is the passed checks divided by the checks that apply.
- The customer's mood is judged line by line as calm, annoyed or angry.

## 4. Read the report

- **Review:** any red flag marks the call Needs review, whatever its checklist score.
- **Checklist score:** passed checks out of the checks that apply, each with its quote.
- **Customer frustration:** a timeline of calm, annoyed and angry, with the line where it turned.
- **Handover:** when the AI passed the call to a human, and whether the human already knew the problem.
- **Red flags:** for example a customer asking for a person and the AI carrying on, a loop, a promise the rules don't allow, or a safety issue that isn't escalated.
- **AI fix notes:** what the AI agent said and what it should have said, for the AI team.
- **Coaching:** two or three sentences for the human agent, about one line they said.
- **Transcript and recording:** every time in the report jumps to its line and plays the call from there.

## 5. Hear the coaching

"Play coaching" speaks the coaching with Gnani Timbre (v2.5) in the language picked for the call: one of 11, including Hinglish.

## More

- [The checklist and red flags](https://suno-ai.vercel.app/checklist.md)
- [Example report: Late order](https://suno-ai.vercel.app/examples/late-order.md)
- [Source code](https://github.com/neha-tanti/sunoai)
