import { ImageResponse } from 'next/og';
import { LOGO_BARS, LOGO_TILE } from '@/components/logo';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const SCALE = 180 / 32;

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2 * SCALE,
        background: LOGO_TILE,
      }}
    >
      {LOGO_BARS.map((bar, index) => (
        <div
          key={index}
          style={{
            width: 3 * SCALE,
            height: bar.height * SCALE,
            borderRadius: 1.5 * SCALE,
            background: bar.color,
          }}
        />
      ))}
    </div>,
    size,
  );
}
