'use client';

import { PlayIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCoachingAudio } from '@/hooks/use-coaching-audio';

export function CoachingPlayer({ callId }: { callId: string }) {
  const [requested, setRequested] = useState(false);
  const audio = useCoachingAudio(callId, requested);

  function handlePlay() {
    if (requested) audio.refetch();
    else setRequested(true);
  }

  if (audio.data) {
    return (
      <audio
        controls
        autoPlay
        src={audio.data}
        aria-label="Coaching audio"
        className="w-full"
      />
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handlePlay} disabled={audio.isFetching}>
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
