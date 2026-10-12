'use client';

import { useState } from 'react';
import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import {
  ACCEPTED_EXTENSIONS,
  MAX_CALL_SECONDS,
  MAX_FILE_BYTES,
  mimeTypeFor,
} from '@/lib/call-upload';

const FORMATS = ACCEPTED_EXTENSIONS.map((extension) =>
  extension.toUpperCase(),
).join(', ');
const ACCEPT = ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(
  ',',
);

function readDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (seconds: number | null) => {
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

async function recordingProblem(file: File): Promise<string | null> {
  if (!mimeTypeFor(file.name)) {
    return `SunoAI can't check this file type. Use ${FORMATS}.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'This file is over 50 MB. Use a smaller recording.';
  }
  const seconds = await readDurationSeconds(file);
  if (seconds !== null && seconds > MAX_CALL_SECONDS) {
    return CALL_ERROR_MESSAGES.too_long;
  }
  return null;
}

type UploadDropzoneProps = {
  file: File | null;
  disabled: boolean;
  onAccept: (file: File) => void;
  onReject: (message: string) => void;
};

export function UploadDropzone({
  file,
  disabled,
  onAccept,
  onReject,
}: UploadDropzoneProps) {
  const [checking, setChecking] = useState(false);

  async function pick(picked: File | undefined) {
    if (!picked) return;
    setChecking(true);
    const problem = await recordingProblem(picked);
    setChecking(false);
    if (problem) return onReject(problem);
    onAccept(picked);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (disabled) return;
    void pick(event.dataTransfer.files[0]);
  }

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-input bg-muted/40 px-6 py-8 text-center has-focus-visible:border-ring"
    >
      <input
        type="file"
        aria-label="Call recording"
        accept={ACCEPT}
        disabled={disabled}
        onChange={(event) => void pick(event.currentTarget.files?.[0])}
        className="sr-only"
      />
      <span className="font-medium">
        {file ? file.name : 'Drop a call recording here, or choose a file'}
      </span>
      <span className="text-muted-foreground text-xs">
        {FORMATS} · up to 50 MB and 30 minutes
      </span>
      {checking && (
        <span role="status" className="text-muted-foreground text-xs">
          Checking the file…
        </span>
      )}
    </label>
  );
}
