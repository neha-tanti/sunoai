import { ImageResponse } from 'next/og';
import { LOGO_BARS, LOGO_TILE } from '@/components/logo';
import { LATE_ORDER_REPORT } from '@/lib/late-order-example';
import { formatTime } from '@/lib/report-labels';

export const alt =
  'SunoAI: hear where a support call went wrong. Powered by Gnani.ai.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MOOD_COLOR = {
  calm: LOGO_BARS[0].color,
  annoyed: LOGO_BARS[2].color,
  angry: LOGO_BARS[3].color,
};

export default function OpenGraphImage() {
  const { ranges } = LATE_ORDER_REPORT.frustration;
  const flag = LATE_ORDER_REPORT.red_flags[0];
  const length = ranges.at(-1)?.end ?? flag.time;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#ffffff',
        color: '#0a0a0a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: LOGO_TILE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          {LOGO_BARS.map((bar, index) => (
            <div
              key={index}
              style={{
                width: 6,
                height: bar.height * 2,
                borderRadius: 3,
                background: bar.color,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>SunoAI</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
          Hear where a support call went wrong.
        </div>
        <div style={{ fontSize: 32, color: '#525252' }}>
          Frustration timeline, red flags, checklist score and spoken coaching
          for food delivery support calls.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            display: 'flex',
            position: 'relative',
            paddingTop: 64,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 24,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {ranges.map((range) => (
              <div
                key={range.start}
                style={{
                  width: `${((range.end - range.start) / length) * 100}%`,
                  background: MOOD_COLOR[range.level],
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              left: `${(flag.time / length) * 100}%`,
              top: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#b91c1c',
                background: '#fee2e2',
                borderRadius: 8,
                padding: '4px 12px',
              }}
            >
              {`Red flag · ${formatTime(flag.time)} · asked for a person, AI carried on`}
            </div>
            <div style={{ width: 4, flexGrow: 1, background: '#b91c1c' }} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#525252',
          }}
        >
          <div>suno-ai.vercel.app</div>
          <div style={{ fontWeight: 600, color: '#0a0a0a' }}>
            Powered by Gnani.ai
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
