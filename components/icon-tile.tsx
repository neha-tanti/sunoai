import { cn } from '@/lib/utils';

export const TINT_CLASS = {
  sage: 'border-sage-border bg-sage text-sage-foreground',
  coral: 'border-coral-border bg-coral text-coral-foreground',
  sand: 'border-sand-border bg-sand text-sand-foreground',
  slate: 'border-slate-border bg-slate text-slate-foreground',
  lavender: 'border-lavender-border bg-lavender text-lavender-foreground',
};

export type Tint = keyof typeof TINT_CLASS;

export const PAGE_TITLE =
  'font-serif text-5xl leading-none tracking-[-0.015em] text-balance wrap-break-word sm:text-[64px]';

type IconTileProps = {
  tint: Tint;
  className?: string;
  children: React.ReactNode;
};

export function IconTile({ tint, className, children }: IconTileProps) {
  return (
    <span
      className={cn(
        'grid size-9.5 shrink-0 place-items-center rounded-[11px] border [&_svg]:size-4.5',
        TINT_CLASS[tint],
        className,
      )}
    >
      {children}
    </span>
  );
}
