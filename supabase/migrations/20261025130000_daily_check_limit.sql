-- The advisory lock makes parallel claims count one after another, so they can't all pass the limit.
create function public.claim_check_slot(p_call_id uuid, p_limit integer)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('claim_check_slot'));

  if (
    select count(*) from public.calls
    where checked_at >= now() - interval '24 hours'
  ) >= p_limit then
    return false;
  end if;

  update public.calls
  set checked_at = now()
  where id = p_call_id and status = 'uploaded';

  return true;
end;
$$;

grant execute on function public.claim_check_slot(uuid, integer) to service_role;

select cron.schedule(
  'delete-old-anonymous-users',
  '0 1 * * *',
  $$delete from auth.users where is_anonymous and created_at < now() - interval '30 days'$$
);
