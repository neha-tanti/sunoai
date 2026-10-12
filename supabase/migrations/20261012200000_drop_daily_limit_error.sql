alter type public.call_error_code rename to call_error_code_old;

create type public.call_error_code as enum (
  'file_rejected',
  'transcription_failed',
  'no_speech',
  'too_long',
  'analysis_failed'
);

alter table public.calls
  alter column error_code type public.call_error_code
  using error_code::text::public.call_error_code;

drop type public.call_error_code_old;
