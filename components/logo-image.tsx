import {
  BAR_GAP,
  BAR_WIDTH,
  LOGO_BARS,
  LOGO_RADIUS,
  LOGO_SIZE,
} from '@/components/logo';
import { IMAGE_PALETTE } from '@/lib/image-palette';

export function LogoImage({
  size,
  rounded = true,
}: {
  size: number;
  rounded?: boolean;
}) {
  const scale = size / LOGO_SIZE;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: BAR_GAP * scale,
        borderRadius: rounded ? LOGO_RADIUS * scale : 0,
        background: IMAGE_PALETTE.foreground,
      }}
    >
      {LOGO_BARS.map((height, index) => (
        <div
          key={index}
          style={{
            width: BAR_WIDTH * scale,
            height: height * scale,
            borderRadius: (BAR_WIDTH / 2) * scale,
            background: IMAGE_PALETTE.background,
          }}
        />
      ))}
    </div>
  );
}
