import type { Metadata } from 'next';
import { CheckCallForm } from '@/components/check-call-form';
import { ExampleCalls } from '@/components/example-calls';

export const metadata: Metadata = { title: 'Check a call' };

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Check a call
          </h1>
          <p className="text-muted-foreground">
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
          <h2 id="upload-heading" className="font-medium">
            Or upload your own
          </h2>
          <CheckCallForm />
        </section>
      </div>
    </main>
  );
}
