create function public.save_report(p_call_id uuid, p_report jsonb)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  update public.calls
  set status = 'ready'
  where id = p_call_id and status = 'analyzing';

  if not found then
    return false;
  end if;

  insert into public.reports (
    call_id, score_passed, score_total, needs_review, frustration_peak,
    frustration, speakers, handover_segment_id, checks, red_flags, fix_notes,
    summary, coaching, llm_model, prompt_version, checklist_snapshot
  )
  select p_call_id, r.score_passed, r.score_total, r.needs_review,
    r.frustration_peak, r.frustration, r.speakers, r.handover_segment_id,
    r.checks, r.red_flags, r.fix_notes, r.summary, r.coaching, r.llm_model,
    r.prompt_version, r.checklist_snapshot
  from jsonb_to_record(p_report) as r (
    score_passed integer,
    score_total integer,
    needs_review boolean,
    frustration_peak public.mood,
    frustration jsonb,
    speakers jsonb,
    handover_segment_id integer,
    checks jsonb,
    red_flags jsonb,
    fix_notes jsonb,
    summary text,
    coaching jsonb,
    llm_model text,
    prompt_version text,
    checklist_snapshot jsonb
  );

  return true;
end;
$$;

grant execute on function public.save_report(uuid, jsonb) to service_role;
