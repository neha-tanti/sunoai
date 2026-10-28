import {
  ActivityIcon,
  FlagIcon,
  ListChecksIcon,
  PlayIcon,
  Volume2Icon,
} from 'lucide-react';
import { Suspense } from 'react';
import { FrustrationTimeline } from '@/components/frustration-timeline';
import { ReportTiles } from '@/components/report-tiles';
import { ReviewBanner } from '@/components/review-banner';
import { ScoreBadge } from '@/components/score-badge';
import { SiteHeader } from '@/components/site-header';
import { ToneBadge } from '@/components/tone-badge';
import { TryItButtons, TryItFromLink } from '@/components/try-it-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CALL_LANGUAGES,
  callLanguage,
  coachingLanguage,
  MAX_CALL_LANGUAGES,
} from '@/lib/call-upload';
import { exampleCall } from '@/lib/examples';
import { formatTime } from '@/lib/format-time';
import {
  LATE_ORDER_REPORT,
  LATE_ORDER_SECONDS,
  LATE_ORDER_SEGMENTS,
} from '@/lib/late-order-example';
import { MOOD_CLASS, MOOD_LABEL } from '@/lib/report-labels';
import { scorePercent } from '@/lib/score-band';
import { SITE_DESCRIPTION, SITE_URL, SOURCE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';

const LATE_ORDER = exampleCall('late-order');

const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#example', label: 'Example report' },
  { href: '/checklist.md', label: 'Checklist' },
];

const STEPS = [
  {
    name: 'Pick an example or upload',
    text: `A recorded support call in up to ${MAX_CALL_LANGUAGES} of ${CALL_LANGUAGES.length} Indian languages, Hinglish included.`,
  },
  {
    name: 'Gnani Prisma transcribes it',
    text: 'Who said what: the AI agent, the customer and the human agent.',
  },
  {
    name: 'Read the report',
    text: 'Jump to the moment it turned, check every quote, and play the coaching.',
  },
];

const ICON_TILE =
  'mb-2 grid size-9.5 place-items-center rounded-[11px] border [&_svg]:size-4.5';
const SECTION_HEADING =
  'mb-10 max-w-[14em] font-serif text-4xl leading-[1.05] tracking-[-0.015em] text-balance sm:text-[52px]';

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
    <>
      <SiteHeader>
        <ul className="hidden gap-x-7 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </SiteHeader>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-18 px-4 pb-18 sm:gap-24 sm:pb-24 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c'),
          }}
        />
        <Hero />
        <ReportPreview />
        <Features />
        <HowItWorks />
      </main>
    </>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center gap-5.5 pt-11 text-center sm:pt-18">
      <ToneBadge
        tone="calm"
        className="h-auto bg-card px-3.5 py-1.5 text-[13px] font-normal whitespace-normal text-muted-foreground"
      >
        Built on Gnani Prisma v3.0 and Timbre v2.5
      </ToneBadge>
      <h1 className="font-serif text-[46px] leading-[0.98] tracking-[-0.02em] text-balance sm:text-7xl lg:text-[92px]">
        Hear where a support call{' '}
        <em className="text-headline-muted sm:block">went wrong.</em>
      </h1>
      <p className="max-w-[33em] text-[17px] text-pretty text-muted-foreground">
        SunoAI listens to food delivery support calls and shows the moment the
        customer got frustrated, what the agents missed, and how to coach them.
      </p>
      <Suspense fallback={<TryItButtons className="w-full items-center" />}>
        <TryItFromLink className="w-full items-center" />
      </Suspense>
    </section>
  );
}

function ReportPreview() {
  const languages = LATE_ORDER.call_langs
    .map((code) => callLanguage(code).label)
    .join(' + ');

  return (
    <section
      id="example"
      aria-labelledby="preview-heading"
      className="scroll-mt-4 rounded-[26px] border bg-card p-1.5 shadow-card sm:p-2.5"
    >
      <div className="flex flex-col gap-4 rounded-[18px] bg-background p-3 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 id="preview-heading" className="font-serif text-4xl leading-none">
            Late order
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-card">
              Example
            </Badge>
            <span className="font-mono tabular-nums">
              {formatTime(LATE_ORDER_SECONDS)}
            </span>
            <span>{languages}</span>
          </div>
        </div>
        <p className="sr-only">
          Red flags: {LATE_ORDER_REPORT.red_flags.length}. Checklist score{' '}
          {LATE_ORDER_REPORT.score_passed} of {LATE_ORDER_REPORT.score_total}.
          Peak frustration {MOOD_LABEL[LATE_ORDER_REPORT.frustration_peak]}.
        </p>
        <div inert className="flex flex-col gap-4">
          <ReviewBanner redFlags={LATE_ORDER_REPORT.red_flags.length} />
          <ReportTiles
            report={LATE_ORDER_REPORT}
            segments={LATE_ORDER_SEGMENTS}
            langs={LATE_ORDER.call_langs}
          />
          <FrustrationTimeline
            report={LATE_ORDER_REPORT}
            segments={LATE_ORDER_SEGMENTS}
          />
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { score_passed: passed, score_total: total } = LATE_ORDER_REPORT;
  const turn = LATE_ORDER_REPORT.frustration.turn;
  const flag = LATE_ORDER_REPORT.red_flags[0];

  return (
    <section id="checks" aria-labelledby="checks-heading">
      <p className="mb-2 text-sm text-muted-foreground">What SunoAI checks</p>
      <h2 id="checks-heading" className={SECTION_HEADING}>
        Every call, read the way a team leader would.
      </h2>
      <ul className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          name="Frustration"
          text="A timeline of calm, annoyed and angry, with the line where the customer turned."
          icon={
            <span
              className={cn(
                ICON_TILE,
                'border-sage-border bg-sage text-sage-foreground',
              )}
            >
              <ActivityIcon aria-hidden />
            </span>
          }
        >
          <MoodBar />
          {turn && `Turned at ${formatTime(turn.time)}`}
        </FeatureCard>
        <FeatureCard
          name="Red flags"
          text="Moments a person must review, like a request for a human that the AI ignored."
          icon={
            <span
              className={cn(
                ICON_TILE,
                'border-coral-border bg-coral text-coral-foreground',
              )}
            >
              <FlagIcon aria-hidden />
            </span>
          }
        >
          <ToneBadge
            tone="angry"
            className="h-auto min-w-0 py-1 whitespace-normal"
          >
            {flag.name} · {formatTime(flag.time)}
          </ToneBadge>
        </FeatureCard>
        <FeatureCard
          name="Checklist score"
          text="Your team's checks, each passed only with a quote from the call."
          icon={
            <span
              className={cn(
                ICON_TILE,
                'border-sand-border bg-sand text-sand-foreground',
              )}
            >
              <ListChecksIcon aria-hidden />
            </span>
          }
        >
          <span className="text-[17px] font-semibold text-foreground tabular-nums">
            {passed}
            <span className="text-xs text-muted-foreground">/{total}</span>
          </span>
          <ScoreBadge percent={scorePercent(passed, total)} />
        </FeatureCard>
        <FeatureCard
          name="Spoken coaching"
          text="Feedback for the human agent, read aloud in their language by Gnani Timbre."
          icon={
            <span
              className={cn(
                ICON_TILE,
                'border-slate-border bg-slate text-slate-foreground',
              )}
            >
              <Volume2Icon aria-hidden />
            </span>
          }
        >
          <span
            aria-hidden
            className="grid size-5.5 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <PlayIcon className="ml-px size-2.5 fill-current" />
          </span>
          Play coaching · {coachingLanguage(LATE_ORDER.coaching_lang).label}
        </FeatureCard>
      </ul>
    </section>
  );
}

type FeatureCardProps = {
  name: string;
  text: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function FeatureCard({ name, text, icon, children }: FeatureCardProps) {
  return (
    <li>
      <Card className="h-full gap-2.5 p-5.5">
        {icon}
        <h3 className="text-base font-semibold">{name}</h3>
        <p className="flex-1 text-muted-foreground">{text}</p>
        <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-2.5 border-t border-dashed pt-3.5 text-[13px] text-muted-foreground">
          {children}
        </div>
      </Card>
    </li>
  );
}

function MoodBar() {
  return (
    <span aria-hidden className="flex w-18 gap-0.75">
      {LATE_ORDER_REPORT.frustration.ranges.map((range) => (
        <span
          key={range.start}
          className={cn('h-1.25 basis-0 rounded-full', MOOD_CLASS[range.level])}
          style={{ flexGrow: range.end - range.start }}
        />
      ))}
    </span>
  );
}

function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-4">
      <p className="mb-2 text-sm text-muted-foreground">How it works</p>
      <h2 id="how-heading" className={SECTION_HEADING}>
        From recording to report.
      </h2>
      <ol className="grid gap-4.5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.name}>
            <Card className="h-full gap-2.5 p-6">
              <span
                aria-hidden
                className="mb-3 grid size-7.5 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground"
              >
                {index + 1}
              </span>
              <h3 className="text-base font-semibold">{step.name}</h3>
              <p className="text-muted-foreground">{step.text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
