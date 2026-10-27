'use client';

import { PauseIcon, PlayIcon } from 'lucide-react';
import { type RefObject, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/format-time';

type AudioPlayerProps = {
  src: string;
  label: string;
  autoPlay?: boolean;
  ref?: RefObject<HTMLAudioElement | null>;
};

export function AudioPlayer({
  src,
  label,
  autoPlay = false,
  ref,
}: AudioPlayerProps) {
  const ownRef = useRef<HTMLAudioElement>(null);
  const audioRef = ref ?? ownRef;
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function handleToggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Number(event.target.value);
  }

  function handleLoadedMetadata(event: React.SyntheticEvent<HTMLAudioElement>) {
    const { duration } = event.currentTarget;
    setDuration(Number.isFinite(duration) ? duration : 0);
  }

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        preload="metadata"
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <Button
        variant="outline"
        className="size-10 shrink-0 rounded-full p-0"
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        onClick={handleToggle}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.1}
        value={Math.min(time, duration)}
        disabled={duration === 0}
        aria-label={`${label} position`}
        aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
        onChange={handleSeek}
        className="h-1.5 min-w-16 flex-1 cursor-pointer accent-foreground disabled:cursor-default"
      />
      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
        {formatTime(time)} / {formatTime(duration)}
      </span>
    </div>
  );
}
