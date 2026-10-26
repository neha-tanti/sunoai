'use client';

import { useEffect, useRef } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import type { Segment } from '@/hooks/use-call';
import { useCallRecording } from '@/hooks/use-call-recording';

type CallPlayerProps = { callId: string; segments: Segment[] };

export function CallPlayer({ callId, segments }: CallPlayerProps) {
  const recording = useCallRecording(callId);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const startByHref = new Map(
      segments.map((segment) => [
        `#segment-${segment.segment_id}`,
        segment.start_time,
      ]),
    );
    function playFromSegmentLink(event: MouseEvent) {
      const href = (event.target as Element).closest('a')?.getAttribute('href');
      const start = href ? startByHref.get(href) : undefined;
      const audio = audioRef.current;
      if (start === undefined || !audio) return;
      audio.currentTime = start;
      void audio.play();
    }

    document.addEventListener('click', playFromSegmentLink);
    return () => document.removeEventListener('click', playFromSegmentLink);
  }, [segments]);

  if (recording.isPending) {
    return (
      <p className="text-sm text-muted-foreground">Loading the recording…</p>
    );
  }
  if (recording.isError) {
    return (
      <p className="text-sm text-muted-foreground">{recording.error.message}</p>
    );
  }
  return (
    <AudioPlayer ref={audioRef} src={recording.data} label="Call recording" />
  );
}
