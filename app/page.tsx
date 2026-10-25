import { TryItButton } from '@/components/try-it-button';

const FEATURES = [
  'Frustration',
  'Red flags',
  'Checklist score',
  'Spoken coaching',
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-12 px-6 py-24">
      <div className="flex flex-col gap-5">
        <p className="font-semibold">SunoAI</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Hear where a support call went wrong.
        </h1>
        <p className="text-muted-foreground text-lg text-pretty">
          Upload a food delivery support call. See where the customer got
          frustrated, what the agents missed, and how to coach them.
        </p>
      </div>

      <div aria-hidden className="flex flex-col gap-2">
        <div className="flex h-2 gap-1">
          <span className="bg-calm w-1/2 rounded-full" />
          <span className="bg-annoyed w-1/4 rounded-full" />
          <span className="bg-angry flex-1 rounded-full" />
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>Calm</span>
          <span>Annoyed</span>
          <span>Angry</span>
        </div>
      </div>

      <TryItButton />

      <footer className="flex flex-col gap-2 border-t pt-6 text-sm">
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {FEATURES.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="text-muted-foreground">
          Built on Gnani AI speech models. Works in 11 languages.
        </p>
      </footer>
    </main>
  );
}
