import {
  BAR_GAP,
  BAR_WIDTH,
  LOGO_BAR,
  LOGO_BARS,
  LOGO_RADIUS,
  LOGO_SIZE,
  LOGO_TILE,
} from '@/components/logo';

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
        background: LOGO_TILE,
      }}
    >
      {LOGO_BARS.map((height, index) => (
        <div
          key={index}
          style={{
            width: BAR_WIDTH * scale,
            height: height * scale,
            borderRadius: (BAR_WIDTH / 2) * scale,
            background: LOGO_BAR,
          }}
        />
      ))}
    </div>
  );
}
