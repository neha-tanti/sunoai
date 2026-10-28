import { type Tint, TINT_CLASS } from '@/lib/tints';
import { cn } from '@/lib/utils';

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
