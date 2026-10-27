'use client';

import { type Ref, useState } from 'react';
import { AudioPlayer, type AudioPlayerHandle } from '@/components/audio-player';
import { URL_FRESH_MS, useCallRecording } from '@/hooks/use-call-recording';

type Resume = { time: number; play: boolean };

type CallPlayerProps = { callId: string; ref: Ref<AudioPlayerHandle> };

export function CallPlayer({ callId, ref }: CallPlayerProps) {
  const recording = useCallRecording(callId);
  const [resume, setResume] = useState<Resume | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (recording.isError) {
    return (
      <p className="text-sm text-muted-foreground">{recording.error.message}</p>
    );
  }
  if (recording.isPending || refreshing) {
    return (
      <p className="text-sm text-muted-foreground">Loading the recording…</p>
    );
  }

  async function handleError(audio: HTMLAudioElement) {
    if (Date.now() - recording.dataUpdatedAt < URL_FRESH_MS) return;
    setResume({ time: audio.currentTime, play: !audio.paused });
    setRefreshing(true);
    await recording.refetch();
    setRefreshing(false);
  }

  return (
    <AudioPlayer
      ref={ref}
      src={recording.data}
      label="Call recording"
      startAt={resume?.time}
      autoPlay={resume?.play}
      onError={handleError}
    />
  );
}
