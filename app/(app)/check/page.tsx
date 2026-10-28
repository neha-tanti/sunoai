import type { Metadata } from 'next';
import { CheckCallForm } from '@/components/check-call-form';
import { ExampleCalls } from '@/components/example-calls';
import { PAGE_TITLE } from '@/components/icon-tile';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Check a call' };

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h1 className={PAGE_TITLE}>Check a call</h1>
          <p className="max-w-[42em] text-lg text-pretty text-muted-foreground">
            Pick an example or upload a support call. SunoAI transcribes it,
            then shows where the customer got frustrated and how the agents did.
          </p>
        </div>
        <ExampleCalls />
        <section
          id="upload"
          aria-labelledby="upload-heading"
          className="flex flex-col gap-4"
        >
          <h2 id="upload-heading" className="text-lg font-medium">
            Or upload your own
          </h2>
          <Card className="p-6 text-base">
            <CheckCallForm />
          </Card>
        </section>
      </div>
    </main>
  );
}
