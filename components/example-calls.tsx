'use client';

import {
  BugIcon,
  ClockIcon,
  type LucideIcon,
  PlayIcon,
  RepeatIcon,
} from 'lucide-react';
import { useState } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import { IconTile } from '@/components/icon-tile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCheckExample } from '@/hooks/use-check-example';
import { useExampleAudio } from '@/hooks/use-example-audio';
import { useHydrated } from '@/hooks/use-hydrated';
import { EXAMPLE_CALLS, type ExampleCallId } from '@/lib/examples';
import type { Tint } from '@/lib/tints';

type ExampleCall = (typeof EXAMPLE_CALLS)[number];

const EXAMPLE_ICON: Record<ExampleCallId, { Icon: LucideIcon; tint: Tint }> = {
  'late-order': { Icon: ClockIcon, tint: 'sand' },
  'insect-in-food': { Icon: BugIcon, tint: 'coral' },
  'order-id-loop': { Icon: RepeatIcon, tint: 'lavender' },
};

type ExampleCardProps = {
  example: ExampleCall;
  disabled: boolean;
  onCheck: (id: ExampleCallId) => void;
};

function ExampleCard({ example, disabled, onCheck }: ExampleCardProps) {
  const [listening, setListening] = useState(false);
  const audio = useExampleAudio(example.id, listening);
  const { Icon, tint } = EXAMPLE_ICON[example.id];

  function handleListen() {
    if (listening) audio.refetch();
    else setListening(true);
  }

  return (
    <li>
      <Card className="h-full gap-3 p-5 text-base">
        <IconTile tint={tint}>
          <Icon aria-hidden />
        </IconTile>
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="font-semibold">{example.title}</h3>
          <p className="text-muted-foreground text-sm">{example.about}</p>
        </div>
        {listening && audio.data ? (
          <AudioPlayer
            src={audio.data}
            label={`${example.title} recording`}
            autoPlay
          />
        ) : (
          <Button
            variant="ghost"
            className="self-start"
            disabled={audio.isFetching}
            onClick={handleListen}
          >
            <PlayIcon />
            {audio.isFetching ? 'Loading…' : 'Listen'}
          </Button>
        )}
        {audio.isError && !audio.isFetching && (
          <p role="alert" className="text-destructive text-sm">
            {audio.error.message}
          </p>
        )}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={disabled}
          onClick={() => onCheck(example.id)}
        >
          Check this example
        </Button>
      </Card>
    </li>
  );
}

export function ExampleCalls() {
  const hydrated = useHydrated();
  const checkExample = useCheckExample();
  const busy = checkExample.isPending || checkExample.isSuccess;

  return (
    <section aria-labelledby="examples-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="examples-heading" className="text-lg font-medium">
          No recording? Try an example
        </h2>
        <p className="text-muted-foreground text-sm">
          Made-up calls, voiced with Gnani Timbre. Listen first, then check one.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_CALLS.map((example) => (
          <ExampleCard
            key={example.id}
            example={example}
            disabled={!hydrated || busy}
            onCheck={checkExample.mutate}
          />
        ))}
      </ul>
      {checkExample.error && (
        <p role="alert" className="text-destructive text-sm">
          {checkExample.error.message}
        </p>
      )}
      {busy && (
        <p className="text-muted-foreground text-sm">Starting the check…</p>
      )}
    </section>
  );
}
