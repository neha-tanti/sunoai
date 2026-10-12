create function public.save_transcript(
  p_call_id uuid,
  p_detected_lang text,
  p_duration_seconds numeric,
  p_segments jsonb
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  update public.calls
  set status = 'analyzing',
    detected_lang = p_detected_lang,
    duration_seconds = p_duration_seconds
  where id = p_call_id and status = 'transcribing';

  if not found then
    return false;
  end if;

  insert into public.transcript_segments
    (call_id, segment_id, start_time, end_time, speaker_id, text)
  select p_call_id, s.segment_id, s.start_time, s.end_time, s.speaker_id, s.text
  from jsonb_to_recordset(p_segments) as s (
    segment_id integer,
    start_time numeric,
    end_time numeric,
    speaker_id integer,
    text text
  );

  return true;
end;
$$;

grant execute on function public.save_transcript(uuid, text, numeric, jsonb) to service_role;
