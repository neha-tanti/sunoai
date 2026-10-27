'use client';

import { type Ref, useState } from 'react';
import { AudioPlayer, type AudioPlayerHandle } from '@/components/audio-player';
import { URL_FRESH_MS, useCallRecording } from '@/hooks/use-call-recording';

type Resume = { src: string; time: number; play: boolean };

type CallPlayerProps = { callId: string; ref: Ref<AudioPlayerHandle> };

export function CallPlayer({ callId, ref }: CallPlayerProps) {
  const recording = useCallRecording(callId);
  const [resume, setResume] = useState<Resume | null>(null);

  if (recording.isError) {
    return (
      <p className="text-sm text-muted-foreground">{recording.error.message}</p>
    );
  }
  if (recording.isPending || resume?.src === recording.data) {
    return (
      <p className="text-sm text-muted-foreground">Loading the recording…</p>
    );
  }

  const src = recording.data;

  function handleError(audio: HTMLAudioElement) {
    if (Date.now() - recording.dataUpdatedAt < URL_FRESH_MS) return;
    setResume({ src, time: audio.currentTime, play: !audio.paused });
    void recording.refetch();
  }

  return (
    <AudioPlayer
      ref={ref}
      src={src}
      label="Call recording"
      startAt={resume?.time}
      autoPlay={resume?.play}
      onError={handleError}
    />
  );
}
