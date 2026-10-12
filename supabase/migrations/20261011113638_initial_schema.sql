create type public.call_status as enum (
  'uploaded',
  'transcribing',
  'analyzing',
  'ready',
  'failed'
);

create type public.call_error_code as enum (
  'file_rejected',
  'transcription_failed',
  'no_speech',
  'too_long',
  'analysis_failed',
  'daily_limit'
);

create type public.mood as enum ('calm', 'annoyed', 'angry');

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  call_langs text[] not null,
  coaching_lang text not null,
  denoise boolean not null default true,
  status public.call_status not null default 'uploaded',
  error_code public.call_error_code,
  error text,
  gnani_job_id text,
  detected_lang text,
  duration_seconds numeric,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  checked_at timestamptz,
  status_at timestamptz not null default now(),
  gnani_attempts integer not null default 0
);

create table public.transcript_segments (
  id bigint generated always as identity primary key,
  call_id uuid not null references public.calls (id) on delete cascade,
  segment_id integer not null,
  start_time numeric not null,
  end_time numeric not null,
  speaker_id integer not null,
  text text not null,
  unique (call_id, segment_id)
);

create table public.reports (
  call_id uuid primary key references public.calls (id) on delete cascade,
  score_passed integer not null,
  score_total integer not null,
  needs_review boolean not null,
  frustration_peak public.mood not null,
  frustration jsonb not null,
  speakers jsonb not null,
  handover_segment_id integer,
  checks jsonb not null,
  red_flags jsonb not null,
  fix_notes jsonb not null,
  summary text not null,
  coaching jsonb,
  coaching_audio_path text,
  llm_model text not null,
  prompt_version text not null,
  checklist_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table public.checklist_checks (
  id text primary key,
  name text not null,
  rule text not null,
  position integer not null,
  active boolean not null default true
);

create table public.checklist_red_flags (
  id text primary key,
  name text not null,
  example text not null,
  position integer not null,
  active boolean not null default true
);

create table public.company_rules (
  id integer primary key default 1 check (id = 1),
  text text not null default '',
  updated_at timestamptz not null default now()
);

create index calls_created_at_idx on public.calls (created_at desc);
create index calls_status_status_at_idx on public.calls (status, status_at);
create index transcript_segments_call_id_start_time_idx
  on public.transcript_segments (call_id, start_time);

create function public.reset_status_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status_at := now();
  return new;
end;
$$;

create trigger calls_reset_status_at
  before update of status on public.calls
  for each row
  when (old.status is distinct from new.status)
  execute function public.reset_status_at();

alter table public.calls enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.reports enable row level security;
alter table public.checklist_checks enable row level security;
alter table public.checklist_red_flags enable row level security;
alter table public.company_rules enable row level security;

create policy "Team leaders manage calls" on public.calls
  for all to authenticated using (true) with check (true);
create policy "Team leaders manage transcript segments" on public.transcript_segments
  for all to authenticated using (true) with check (true);
create policy "Team leaders manage reports" on public.reports
  for all to authenticated using (true) with check (true);
create policy "Team leaders manage checks" on public.checklist_checks
  for all to authenticated using (true) with check (true);
create policy "Team leaders manage red flags" on public.checklist_red_flags
  for all to authenticated using (true) with check (true);
create policy "Team leaders manage company rules" on public.company_rules
  for all to authenticated using (true) with check (true);

revoke all on
  public.calls,
  public.transcript_segments,
  public.reports,
  public.checklist_checks,
  public.checklist_red_flags,
  public.company_rules
from anon;

grant select, insert, update, delete on
  public.calls,
  public.transcript_segments,
  public.reports,
  public.checklist_checks,
  public.checklist_red_flags,
  public.company_rules
to authenticated, service_role;

grant usage on sequence public.transcript_segments_id_seq to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('calls', 'calls', false, 52428800),
  ('coaching', 'coaching', false, null)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

create policy "Team leaders manage call files" on storage.objects
  for all to authenticated
  using (bucket_id in ('calls', 'coaching'))
  with check (bucket_id in ('calls', 'coaching'));
