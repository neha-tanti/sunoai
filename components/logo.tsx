import { cn } from '@/lib/utils';

export const LOGO_BARS = [10, 16, 12, 20, 14];

export const LOGO_SIZE = 32;
export const LOGO_RADIUS = 8;
export const BAR_WIDTH = 3;
export const BAR_GAP = 1.5;
const FIRST_BAR_X =
  (LOGO_SIZE -
    LOGO_BARS.length * BAR_WIDTH -
    (LOGO_BARS.length - 1) * BAR_GAP) /
  2;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_SIZE} ${LOGO_SIZE}`}
      aria-hidden
      className={cn('size-7 shrink-0', className)}
    >
      <rect
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        rx={LOGO_RADIUS}
        className="fill-foreground"
      />
      {LOGO_BARS.map((height, index) => (
        <rect
          key={index}
          x={FIRST_BAR_X + index * (BAR_WIDTH + BAR_GAP)}
          y={(LOGO_SIZE - height) / 2}
          width={BAR_WIDTH}
          height={height}
          rx={BAR_WIDTH / 2}
          className="fill-background"
        />
      ))}
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 text-[17px] font-semibold',
        className,
      )}
    >
      <LogoMark />
      SunoAI
    </span>
  );
}
