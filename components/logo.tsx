import { cn } from '@/lib/utils';

export const LOGO_TILE = '#171717';

export const MOOD_COLOR = {
  calm: '#2bb985',
  annoyed: '#f49f1e',
  angry: '#f14445',
};

export const LOGO_BARS = [
  { height: 10, color: MOOD_COLOR.calm },
  { height: 16, color: MOOD_COLOR.calm },
  { height: 12, color: MOOD_COLOR.annoyed },
  { height: 20, color: MOOD_COLOR.angry },
  { height: 14, color: MOOD_COLOR.angry },
];

export const LOGO_SIZE = 32;
export const LOGO_RADIUS = 8;
export const BAR_WIDTH = 3;
export const BAR_GAP = 2;
const FIRST_BAR_X = 4.5;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`}
      aria-hidden
      className={cn('size-6 shrink-0', className)}
    >
      <rect
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        rx={LOGO_RADIUS}
        fill={LOGO_TILE}
      />
      {LOGO_BARS.map((bar, index) => (
        <rect
          key={index}
          x={FIRST_BAR_X + index * (BAR_WIDTH + BAR_GAP)}
          y={(LOGO_SIZE - bar.height) / 2}
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
