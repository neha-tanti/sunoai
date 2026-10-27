'use client';

import { PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { AudioPlayer } from '@/components/audio-player';
import { Button } from '@/components/ui/button';
import { useCoachingAudio } from '@/hooks/use-coaching-audio';

export function CoachingPlayer({ callId }: { callId: string }) {
  const [requested, setRequested] = useState(false);
  const audio = useCoachingAudio(callId, requested);

  function handlePlay() {
    if (requested) audio.refetch();
    else setRequested(true);
  }

  if (requested && audio.data) {
    return <AudioPlayer src={audio.data} label="Coaching audio" autoPlay />;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="lg" onClick={handlePlay} disabled={audio.isFetching}>
        <PlayIcon />
        {audio.isFetching ? 'Creating the coaching audio…' : 'Play coaching'}
      </Button>
      {audio.isError && !audio.isFetching && (
        <p role="alert" className="text-destructive text-sm">
          {audio.error.message}
        </p>
      )}
    </div>
  );
}
