import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { TryItButton, TryItFromLink } from '@/components/try-it-button';
import { SITE_DESCRIPTION, SITE_URL, SOURCE_URL } from '@/lib/site';

const FEATURES = [
  'Frustration',
  'Red flags',
  'Checklist score',
  'Spoken coaching',
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-12 px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c'),
        }}
      />
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

      <Suspense fallback={<TryItButton />}>
        <TryItFromLink />
      </Suspense>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-6 text-sm">
        {FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </main>
  );
}
