import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { api } from '@/lib/api-client';
import { mimeTypeFor, type CreateCall } from '@/lib/call-upload';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export type CheckCallInput = Omit<CreateCall, 'file_name' | 'file_size'> & {
  file: File;
};

type Stage = 'saving' | 'uploading' | 'starting';

type UnfinishedCall = {
  file: File;
  details: string;
  id: string;
  path: string;
  token: string;
  uploaded: boolean;
};

const UPLOAD_FAILED_MESSAGE =
  'Upload failed. Check your connection and try again.';

async function apiErrorMessage(res: { json(): Promise<unknown> }) {
  const body = (await res.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  return body?.error?.message ?? 'Something went wrong. Try again in a minute.';
}

async function createCall({
  file,
  ...details
}: CheckCallInput): Promise<UnfinishedCall> {
  const created = await api.api.calls.$post({
    json: { ...details, file_name: file.name, file_size: file.size },
  });
  if (!created.ok) throw new Error(await apiErrorMessage(created));
  const { id, path, token } = await created.json();
  return {
    file,
    details: JSON.stringify(details),
    id,
    path,
    token,
    uploaded: false,
  };
}

function isRetryOf(input: CheckCallInput, call: UnfinishedCall) {
  const { file, ...details } = input;
  return call.file === file && call.details === JSON.stringify(details);
}

async function callToCheck(
  input: CheckCallInput,
  previous: UnfinishedCall | null,
) {
  if (previous && isRetryOf(input, previous)) return previous;
  if (previous) {
    await api.api.calls[':id']
      .$delete({ param: { id: previous.id } })
      .catch(() => undefined);
  }
  return createCall(input);
}

export function useCheckCall() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage | null>(null);
  const unfinished = useRef<UnfinishedCall | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: CheckCallInput) => {
      setStage('saving');
      const call = await callToCheck(input, unfinished.current);
      unfinished.current = call;

      if (!call.uploaded) {
        setStage('uploading');
        const recording = new File([call.file], call.file.name, {
          type: mimeTypeFor(call.file.name),
        });
        const uploaded = await createSupabaseBrowserClient()
          .storage.from('calls')
          .uploadToSignedUrl(call.path, call.token, recording);
        if (uploaded.error) throw new Error(UPLOAD_FAILED_MESSAGE);
        call.uploaded = true;
      }

      setStage('starting');
      const checked = await api.api.calls[':id'].check.$post({
        param: { id: call.id },
      });
      if (!checked.ok) throw new Error(await apiErrorMessage(checked));
      unfinished.current = null;
      return call.id;
    },
    onSuccess: (id) => router.push(`/calls/${id}`),
    onSettled: () => setStage(null),
  });

  return { ...mutation, stage };
}
