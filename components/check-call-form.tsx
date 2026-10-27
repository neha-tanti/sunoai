'use client';

import { EyeIcon } from 'lucide-react';
import { useState } from 'react';
import { UploadDropzone } from '@/components/upload-dropzone';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCheckCall, type CheckCallInput } from '@/hooks/use-check-call';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  CALL_LANGUAGES,
  COACHING_LANGUAGES,
  MAX_CALL_LANGUAGES,
} from '@/lib/call-upload';

type CallLang = CheckCallInput['call_langs'][number];
type CoachingLang = CheckCallInput['coaching_lang'];

const STAGE_TEXT = {
  saving: 'Saving the call…',
  uploading: 'Uploading the recording…',
  starting: 'Starting the check…',
};

const NO_TITLE = 'Give the call a title.';

const titleFromFileName = (name: string) =>
  name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

export function CheckCallForm() {
  const hydrated = useHydrated();
  const checkCall = useCheckCall();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [titleTyped, setTitleTyped] = useState(false);
  const [callLangs, setCallLangs] = useState<CallLang[]>(['hi-IN', 'en-IN']);
  const [coachingLang, setCoachingLang] = useState<CoachingLang>('hi-IN');
  const [denoise, setDenoise] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const busy = checkCall.isPending || checkCall.isSuccess;

  function acceptFile(picked: File) {
    setFile(picked);
    setFormError(null);
    if (!titleTyped) setTitle(titleFromFileName(picked.name));
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
    setTitleTyped(event.target.value !== '');
  }

  function rejectFile(message: string) {
    setFile(null);
    setFormError(message);
  }

  function toggleCallLang(code: CallLang, checked: boolean) {
    setCallLangs((langs) =>
      checked ? [...langs, code] : langs.filter((lang) => lang !== code),
    );
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setFormError('Choose a call recording first.');
    if (!title.trim()) return setFormError(NO_TITLE);
    if (callLangs.length === 0) {
      return setFormError('Pick at least one call language.');
    }
    setFormError(null);
    checkCall.mutate({
      file,
      title,
      call_langs: callLangs,
      coaching_lang: coachingLang,
      denoise,
    });
  }

  const error = formError ?? checkCall.error?.message;
  const titleInvalid = formError === NO_TITLE;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Alert
        role="note"
        className="border-annoyed/60 bg-annoyed/10 text-foreground"
      >
        <EyeIcon className="text-annoyed-foreground dark:text-annoyed" />
        <AlertTitle>Don&apos;t upload private calls</AlertTitle>
        <AlertDescription className="text-foreground/80">
          Other visitors can see every call you check, its recording and its
          transcript. Use made-up calls only.
        </AlertDescription>
      </Alert>
      <UploadDropzone
        file={file}
        disabled={busy}
        onAccept={acceptFile}
        onReject={rejectFile}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">
          Call title
          <span className="font-normal text-muted-foreground">
            (filled in from the file name)
          </span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={handleTitleChange}
          maxLength={120}
          aria-required
          aria-invalid={titleInvalid}
          aria-describedby={titleInvalid ? 'check-error' : undefined}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Call language (up to {MAX_CALL_LANGUAGES})
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CALL_LANGUAGES.map(({ code, label }) => {
            const checked = callLangs.includes(code);
            return (
              <Label key={code} className="font-normal">
                <Checkbox
                  checked={checked}
                  disabled={!checked && callLangs.length >= MAX_CALL_LANGUAGES}
                  onCheckedChange={(next) => toggleCallLang(code, next)}
                />
                {label}
              </Label>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          The first one you pick is used when the language is unclear.
        </p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="coaching-lang">Coaching language</Label>
        <Select
          items={COACHING_LANGUAGES.map(({ code, label }) => ({
            value: code,
            label,
          }))}
          value={coachingLang}
          onValueChange={(value) => value && setCoachingLang(value)}
        >
          <SelectTrigger id="coaching-lang" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COACHING_LANGUAGES.map(({ code, label }) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Label className="font-normal">
        <Switch checked={denoise} onCheckedChange={setDenoise} />
        Remove background noise
      </Label>

      {error && (
        <p id="check-error" role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <p role="status" className="text-muted-foreground text-sm">
        {checkCall.stage && STAGE_TEXT[checkCall.stage]}
      </p>

      <div>
        <Button type="submit" size="lg" disabled={!hydrated || busy}>
          Check this call
        </Button>
      </div>
    </form>
  );
}
