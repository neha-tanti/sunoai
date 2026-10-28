alter table public.calls drop column gnani_attempts;
alter table public.calls add column polled_at timestamptz;

create function public.claim_gnani_poll(p_call_id uuid)
returns boolean
language sql
set search_path = ''
as $$
  with claimed as (
    update public.calls
    set polled_at = now()
    where id = p_call_id
      and status = 'transcribing'
      and (polled_at is null or polled_at <= now() - interval '10 seconds')
    returning id
  )
  select exists (select 1 from claimed);
$$;

grant execute on function public.claim_gnani_poll(uuid) to service_role;

select cron.alter_job(
  (select jobid from cron.job where jobname = 'poll-calls'),
  schedule := '10 seconds'
);
