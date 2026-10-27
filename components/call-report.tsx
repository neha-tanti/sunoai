'use client';

import { useRef } from 'react';
import type { AudioPlayerHandle } from '@/components/audio-player';
import { CallPlayer } from '@/components/call-player';
import { ChecklistResults } from '@/components/checklist-results';
import { CoachingPlayer } from '@/components/coaching-player';
import { FixNotesList } from '@/components/fix-notes-list';
import { FrustrationTimeline } from '@/components/frustration-timeline';
import { RedFlagsList } from '@/components/red-flags-list';
import { ReportTiles } from '@/components/report-tiles';
import { ReviewBanner } from '@/components/review-banner';
import { PlayFromContext, QuoteLink, TimeLink } from '@/components/time-link';
import { TranscriptView } from '@/components/transcript-view';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CallDetail, ReportDetail, Segment } from '@/hooks/use-call';
import { langOf } from '@/lib/report-labels';

type Call = CallDetail['call'];

type CallReportProps = {
  call: Call;
  report: ReportDetail;
  segments: Segment[];
};

export function CallReport({ call, report, segments }: CallReportProps) {
  const langs = call.call_langs;
  const playerRef = useRef<AudioPlayerHandle>(null);

  function playFrom(time: number) {
    playerRef.current?.playFrom(time);
  }

  return (
    <PlayFromContext value={playFrom}>
      <article className="flex flex-col gap-4" aria-label="Call report">
        <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-x-6 border-b bg-background/95 px-6 py-1.5 backdrop-blur">
          <div className="flex min-w-64 flex-1 sm:max-w-md">
            <CallPlayer callId={call.id} ref={playerRef} />
          </div>
          <JumpLinks report={report} />
        </div>
        <ReviewBanner redFlags={report.red_flags.length} />
        <ReportTiles report={report} segments={segments} langs={langs} />
        <FrustrationTimeline report={report} segments={segments} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Summary</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{report.summary}</p>
              </CardContent>
            </Card>
            <RedFlagsList report={report} segments={segments} langs={langs} />
            <CoachingSection call={call} report={report} />
            <ChecklistResults checks={report.checks} langs={langs} />
            <FixNotesList notes={report.fix_notes} langs={langs} />
          </div>
          <TranscriptView report={report} segments={segments} langs={langs} />
        </div>
      </article>
    </PlayFromContext>
  );
}

const hasCoachingSection = (report: ReportDetail) =>
  report.coaching !== null || report.handover_segment_id !== null;

function JumpLinks({ report }: { report: ReportDetail }) {
  const sections = [
    { id: 'red-flags', label: 'Red flags', shown: report.red_flags.length > 0 },
    { id: 'coaching', label: 'Coaching', shown: hasCoachingSection(report) },
    { id: 'checklist', label: 'Checklist', shown: true },
    { id: 'ai-fixes', label: 'AI fixes', shown: true },
    { id: 'transcript', label: 'Transcript', shown: true },
  ].filter((section) => section.shown);

  return (
    <nav
      aria-label="Report sections"
      className="-mx-1.5 max-w-[calc(100%+0.75rem)] overflow-x-auto sm:-mx-2 sm:max-w-[calc(100%+1rem)]"
    >
      <ul className="flex text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-11 items-center px-1.5 whitespace-nowrap text-muted-foreground hover:text-foreground sm:px-2"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type CoachingSectionProps = {
  call: Call;
  report: ReportDetail;
};

function CoachingSection({ call, report }: CoachingSectionProps) {
  const { coaching } = report;
  if (!hasCoachingSection(report)) return null;
  if (!coaching) {
    return (
      <CoachingFrame>
        <p className="text-muted-foreground">
          Coaching couldn&apos;t be written for this call.
        </p>
      </CoachingFrame>
    );
  }

  return (
    <CoachingFrame>
      <p className="flex flex-wrap items-baseline gap-2">
        <TimeLink segmentId={coaching.segment_id} time={coaching.time} />
        <QuoteLink
          segmentId={coaching.segment_id}
          time={coaching.time}
          quote={coaching.quote}
          langs={call.call_langs}
        />
      </p>
      <p lang={langOf(coaching.text, [call.coaching_lang])}>{coaching.text}</p>
      {coaching.english !== coaching.text && (
        <p className="text-sm text-muted-foreground">{coaching.english}</p>
      )}
      <CoachingPlayer callId={call.id} />
    </CoachingFrame>
  );
}

function CoachingFrame({ children }: { children: React.ReactNode }) {
  return (
    <Card
      id="coaching"
      role="region"
      aria-label="Coaching"
      className="scroll-below-jump-bar"
    >
      <CardHeader>
        <CardTitle>
          <h2>Coaching</h2>
        </CardTitle>
        <CardDescription>For the human agent</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}
