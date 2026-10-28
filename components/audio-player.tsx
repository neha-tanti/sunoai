'use client';

import { PauseIcon, PlayIcon } from 'lucide-react';
import { type Ref, useImperativeHandle, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/format-time';

export type AudioPlayerHandle = { playFrom: (time: number) => void };

type AudioPlayerProps = {
  src: string;
  label: string;
  autoPlay?: boolean;
  startAt?: number;
  onError?: (audio: HTMLAudioElement) => void;
  ref?: Ref<AudioPlayerHandle>;
};

let playingAudio: HTMLAudioElement | null = null;

export function AudioPlayer({
  src,
  label,
  autoPlay = false,
  startAt,
  onError,
  ref,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  function play(audio: HTMLAudioElement) {
    audio.play().catch((error: unknown) => {
      // AbortError only means a pause or a new src interrupted play()
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFailed(true);
    });
  }

  useImperativeHandle(ref, () => ({
    playFrom(time: number) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      play(audio);
    },
  }));

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play(audio);
    else audio.pause();
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Number(event.target.value);
  }

  function handlePlay(event: React.SyntheticEvent<HTMLAudioElement>) {
    if (playingAudio !== event.currentTarget) playingAudio?.pause();
    playingAudio = event.currentTarget;
    setPlaying(true);
  }

  function handleLoadedMetadata(event: React.SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    if (startAt) audio.currentTime = startAt;
  }

  function handleError(event: React.SyntheticEvent<HTMLAudioElement>) {
    setFailed(true);
    onError?.(event.currentTarget);
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        preload="metadata"
        aria-label={label}
        onPlay={handlePlay}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
      />
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {label} couldn&apos;t be played.
        </p>
      ) : (
        <>
          <Button
            className="size-12 shrink-0 rounded-full p-0 [&_svg]:fill-current"
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            onClick={handleToggle}
          >
            {playing ? <PauseIcon /> : <PlayIcon className="ml-0.5" />}
          </Button>
          <input
            type="range"
            min={0}
            max={duration}
            step={1}
            value={Math.min(time, duration)}
            disabled={duration === 0}
            aria-label={`${label} position`}
            aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
            onChange={handleSeek}
            className="audio-range min-w-16 flex-1"
          />
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </>
      )}
    </div>
  );
}
