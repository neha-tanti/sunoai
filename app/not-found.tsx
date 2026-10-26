import Link from 'next/link';
import { Logo } from '@/components/logo';
import { TryItButton } from '@/components/try-it-button';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <Link href="/" className="self-start">
        <Logo />
      </Link>
      <div className="flex max-w-xl flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-muted-foreground text-lg">
          The link may be old or mistyped. Listen to an example support call and
          see its report instead.
        </p>
      </div>
      <TryItButton />
    </main>
  );
}
