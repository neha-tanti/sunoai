alter table public.calls
  add constraint calls_gnani_job_id_key unique (gnani_job_id),
  add constraint calls_error_code_only_when_failed
    check ((status = 'failed') = (error_code is not null));

update storage.buckets
set allowed_mime_types = array['audio/*', 'video/mp4', 'video/webm']
where id = 'calls';

update storage.buckets
set allowed_mime_types = array['audio/wav']
where id = 'coaching';
