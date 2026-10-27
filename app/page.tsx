import { Suspense } from 'react';
import { FrustrationTimeline } from '@/components/frustration-timeline';
import { Logo } from '@/components/logo';
import { ReportTiles } from '@/components/report-tiles';
import { ReviewBanner } from '@/components/review-banner';
import { TryItButton, TryItFromLink } from '@/components/try-it-button';
import { CALL_LANGUAGES, COACHING_LANGUAGES } from '@/lib/call-upload';
import { exampleCall } from '@/lib/examples';
import { formatTime } from '@/lib/format-time';
import {
  LATE_ORDER_ASK,
  LATE_ORDER_REPORT,
  LATE_ORDER_SECONDS,
  LATE_ORDER_SEGMENTS,
} from '@/lib/late-order-example';
import { MOOD_CLASS, MOOD_LABEL } from '@/lib/report-labels';
import { SITE_DESCRIPTION, SITE_URL, SOURCE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    name: 'Frustration',
    text: 'A timeline of calm, annoyed and angry, with the line where the customer turned.',
  },
  {
    name: 'Red flags',
    text: 'Moments a person must review, like a request for a human that the AI ignored.',
  },
  {
    name: 'Checklist score',
    text: "Your team's checks, each passed only with a quote from the call.",
  },
  {
    name: 'Spoken coaching',
    text: 'Feedback for the human agent, read aloud in their language by Gnani Timbre.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SunoAI',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  creator: {
    '@type': 'Person',
    name: 'neha-tanti',
    url: 'https://github.com/neha-tanti',
  },
  sameAs: [SOURCE_URL],
};

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c'),
        }}
      />
      <section className="flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-5">
          <Logo />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Hear where a support call went wrong.
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">
            Upload a food delivery support call. See where the customer got
            frustrated, what the agents missed, and how to coach them.
          </p>
        </div>
        <MoodStory />
        <Suspense fallback={<TryItButton />}>
          <TryItFromLink />
        </Suspense>
      </section>

      <section
        aria-labelledby="preview-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex max-w-3xl flex-col gap-1">
          <h2 id="preview-heading" className="text-xl font-semibold">
            What a report looks like
          </h2>
          <p className="text-muted-foreground">
            The Late order example, checked by SunoAI. Try it to open the full
            report with the recording, transcript, checklist and coaching.
          </p>
        </div>
        <p className="sr-only">
          Red flags: {LATE_ORDER_REPORT.red_flags.length}. Checklist score {LATE_ORDER_REPORT.score_passed} of{' '}
          {LATE_ORDER_REPORT.score_total}. Peak frustration{' '}
          {MOOD_LABEL[LATE_ORDER_REPORT.frustration_peak]}.
        </p>
        <div
          inert
          className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-3 sm:p-6"
        >
          <ReviewBanner redFlags={LATE_ORDER_REPORT.red_flags.length} />
          <ReportTiles
            report={LATE_ORDER_REPORT}
            segments={LATE_ORDER_SEGMENTS}
            langs={[...exampleCall('late-order').call_langs]}
          />
          <FrustrationTimeline
            report={LATE_ORDER_REPORT}
            segments={LATE_ORDER_SEGMENTS}
          />
        </div>
      </section>

      <section
        aria-labelledby="features-heading"
        className="flex flex-col gap-6"
      >
        <h2 id="features-heading" className="text-xl font-semibold">
          What SunoAI checks
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.name}
              className="flex flex-col gap-1 border-t pt-4"
            >
              <h3 className="font-medium">{feature.name}</h3>
              <p className="text-muted-foreground text-sm">{feature.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm">
          Checks calls in {CALL_LANGUAGES.length} Indian languages and writes
          coaching in {COACHING_LANGUAGES.length}, including Hinglish.
        </p>
      </section>
    </main>
  );
}

function MoodStory() {
  const { ranges } = LATE_ORDER_REPORT.frustration;
  const flag = LATE_ORDER_REPORT.red_flags[0];
  const ask = LATE_ORDER_SEGMENTS[LATE_ORDER_ASK.segment_id];

  return (
    <figure className="flex flex-col gap-2">
      <div aria-hidden className="relative h-9">
        <div
          className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${(flag.time / LATE_ORDER_SECONDS) * 100}%` }}
        >
          <span className="rounded-md bg-angry/15 px-1.5 text-xs font-semibold whitespace-nowrap text-destructive">
            Red flag · {formatTime(flag.time)}
          </span>
          <span className="h-3 w-0.5 bg-angry" />
        </div>
      </div>
      <div aria-hidden className="flex h-2 gap-1">
        {ranges.map((range) => (
          <span
            key={range.start}
            className={cn('basis-0 rounded-full', MOOD_CLASS[range.level])}
            style={{ flexGrow: range.end - range.start }}
          />
        ))}
      </div>
      <div aria-hidden className="text-muted-foreground flex gap-1 text-xs">
        {ranges.map((range) => (
          <span
            key={range.start}
            className="basis-0 truncate"
            style={{ flexGrow: range.end - range.start }}
          >
            {MOOD_LABEL[range.level]}
          </span>
        ))}
      </div>
      <figcaption className="text-muted-foreground mt-2 text-sm text-pretty">
        <q lang="hi-IN" className="text-foreground">
          {LATE_ORDER_ASK.quote}
        </q>{' '}
        ({LATE_ORDER_ASK.translation}), at {formatTime(ask.start_time)}. At{' '}
        {formatTime(flag.time)} the AI repeated itself instead of transferring,
        and the customer got angry.
      </figcaption>
    </figure>
  );
}
