import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { deleteCall } from '@/hooks/use-delete-call';
import { api } from '@/lib/api-client';
import { apiError } from '@/lib/api-errors';
import {
  mimeTypeFor,
  UPLOAD_TOKEN_REUSE_MS,
  type CreateCall,
} from '@/lib/call-upload';
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
  createdAt: number;
  uploaded: boolean;
};

const UPLOAD_FAILED_MESSAGE =
  'Upload failed. Check your connection and try again.';

async function createCall({
  file,
  ...details
}: CheckCallInput): Promise<UnfinishedCall> {
  const created = await api.api.calls.$post({
    json: { ...details, file_name: file.name, file_size: file.size },
  });
  if (!created.ok) throw new Error((await apiError(created)).message);
  const { id, path, token } = await created.json();
  return {
    file,
    details: JSON.stringify(details),
    id,
    path,
    token,
    createdAt: Date.now(),
    uploaded: false,
  };
}

function canReuse(input: CheckCallInput, call: UnfinishedCall) {
  const { file, ...details } = input;
  if (call.file !== file || call.details !== JSON.stringify(details)) {
    return false;
  }
  return call.uploaded || Date.now() - call.createdAt < UPLOAD_TOKEN_REUSE_MS;
}

async function discardCall(id: string) {
  const read = await api.api.calls[':id'].$get({ param: { id } });
  if (read.status === 404) return;
  if (!read.ok) throw new Error((await apiError(read)).message);
  const { call } = await read.json();
  if (call.status !== 'uploaded') return;

  await deleteCall(id);
}

async function callToCheck(
  input: CheckCallInput,
  previous: UnfinishedCall | null,
) {
  if (previous && canReuse(input, previous)) return previous;
  if (previous) await discardCall(previous.id);
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
      if (!checked.ok) {
        const error = await apiError(checked);
        if (error.code !== 'already_checked') throw new Error(error.message);
      }
      unfinished.current = null;
      return call.id;
    },
    onSuccess: (id) => router.push(`/calls/${id}`),
    onSettled: () => setStage(null),
  });

  return { ...mutation, stage };
}
