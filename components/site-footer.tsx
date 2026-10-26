import { GNANI_URL, SOURCE_URL } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <a
            href={GNANI_URL}
            className="font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Powered by Gnani.ai
          </a>
          <span className="block sm:inline">
            <span className="hidden sm:inline"> · </span>
            Transcription by Gnani Prisma v2.5, coaching voice by Gnani Timbre
            v2.5
          </span>
        </p>
        <ul className="flex gap-4">
          <li>
            <a
              href="/llms.txt"
              className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline sm:min-h-0"
            >
              llms.txt
            </a>
          </li>
          <li>
            <a
              href={SOURCE_URL}
              className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline sm:min-h-0"
            >
              Source code
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
