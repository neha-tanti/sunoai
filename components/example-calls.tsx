'use client';

import { useCheckExample } from '@/hooks/use-check-example';
import { useHydrated } from '@/hooks/use-hydrated';
import { EXAMPLE_CALLS } from '@/lib/examples';

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
          Made-up calls, voiced with Gnani Timbre.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {EXAMPLE_CALLS.map((example) => (
          <li key={example.id}>
            <button
              type="button"
              disabled={!hydrated || busy}
              onClick={() => checkExample.mutate(example.id)}
              className="flex h-full w-full flex-col items-start gap-1 rounded-xl border p-4 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="font-medium">{example.title}</span>
              <span className="text-muted-foreground text-sm">
                {example.about}
              </span>
            </button>
          </li>
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
