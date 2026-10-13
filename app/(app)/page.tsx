import { CheckCallForm } from '@/components/check-call-form';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Check a call</h1>
        <p className="text-muted-foreground">
          Upload a support call. SunoAI transcribes it, then shows where the
          customer got frustrated and how the agents did.
        </p>
      </div>
      <CheckCallForm />
    </main>
  );
}
