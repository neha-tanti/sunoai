'use client';

import { PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCheckExample } from '@/hooks/use-check-example';
import { useExampleAudio } from '@/hooks/use-example-audio';
import { useHydrated } from '@/hooks/use-hydrated';
import { EXAMPLE_CALLS, type ExampleCallId } from '@/lib/examples';

type ExampleCall = (typeof EXAMPLE_CALLS)[number];

type ExampleCardProps = {
  example: ExampleCall;
  disabled: boolean;
  onCheck: (id: ExampleCallId) => void;
};

function ExampleCard({ example, disabled, onCheck }: ExampleCardProps) {
  const [listening, setListening] = useState(false);
  const audio = useExampleAudio(example.id, listening);

  function handleListen() {
    if (listening) audio.refetch();
    else setListening(true);
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-medium">{example.title}</h3>
        <p className="text-muted-foreground text-sm">{example.about}</p>
      </div>
      {listening && audio.data ? (
        <audio
          controls
          autoPlay
          src={audio.data}
          aria-label={`${example.title} recording`}
          className="w-full"
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
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
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={() => onCheck(example.id)}
      >
        Check this example
      </Button>
    </li>
  );
}

export function ExampleCalls() {
  const hydrated = useHydrated();
  const checkExample = useCheckExample();
  const busy = checkExample.isPending || checkExample.isSuccess;

  return (
    <section aria-labelledby="examples-heading" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id="examples-heading" className="font-medium">
          No recording? Try an example
        </h2>
        <p className="text-muted-foreground text-sm">
          Made-up calls, voiced with Gnani Timbre. Listen first, then check one.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
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
