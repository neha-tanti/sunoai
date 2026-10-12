drop policy "Team leaders manage calls" on public.calls;
drop policy "Team leaders manage transcript segments" on public.transcript_segments;
drop policy "Team leaders manage reports" on public.reports;
drop policy "Team leaders manage checks" on public.checklist_checks;
drop policy "Team leaders manage red flags" on public.checklist_red_flags;
drop policy "Team leaders manage company rules" on public.company_rules;
drop policy "Team leaders manage call files" on storage.objects;

revoke all on
  public.calls,
  public.transcript_segments,
  public.reports,
  public.checklist_checks,
  public.checklist_red_flags,
  public.company_rules
from authenticated;

revoke usage on sequence public.transcript_segments_id_seq from authenticated;

alter table public.calls
  alter column created_by drop default,
  add constraint calls_gnani_job_id_key unique (gnani_job_id),
  add constraint calls_error_code_only_when_failed
    check ((status = 'failed') = (error_code is not null));

update storage.buckets
set allowed_mime_types = array['audio/*', 'video/mp4', 'video/webm']
where id = 'calls';

update storage.buckets
set allowed_mime_types = array['audio/wav']
where id = 'coaching';
