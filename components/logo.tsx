import { cn } from '@/lib/utils';

export const LOGO_TILE = '#171717';

export const LOGO_BARS = [
  { height: 10, color: '#2bb985' },
  { height: 16, color: '#2bb985' },
  { height: 12, color: '#f49f1e' },
  { height: 20, color: '#f14445' },
  { height: 14, color: '#f14445' },
];

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const FIRST_BAR_X = 4.5;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('size-6 shrink-0', className)}
    >
      <rect width="32" height="32" rx="8" fill={LOGO_TILE} />
      {LOGO_BARS.map((bar, index) => (
        <rect
          key={index}
          x={FIRST_BAR_X + index * (BAR_WIDTH + BAR_GAP)}
          y={16 - bar.height / 2}
          width={BAR_WIDTH}
          height={bar.height}
          rx={BAR_WIDTH / 2}
          fill={bar.color}
        />
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 font-semibold', className)}
    >
      <LogoMark />
      SunoAI
    </span>
  );
}
