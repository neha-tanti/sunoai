create function public.save_checklist(
  p_checks jsonb,
  p_red_flags jsonb,
  p_rules text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.checklist_checks
  set active = false
  where id not in (select item ->> 'id' from jsonb_array_elements(p_checks) as item);

  insert into public.checklist_checks (id, name, rule, position, active)
  select item ->> 'id', item ->> 'name', item ->> 'rule', position, true
  from jsonb_array_elements(p_checks) with ordinality as e (item, position)
  on conflict (id) do update
  set name = excluded.name,
    rule = excluded.rule,
    position = excluded.position,
    active = true;

  update public.checklist_red_flags
  set active = false
  where id not in (select item ->> 'id' from jsonb_array_elements(p_red_flags) as item);

  insert into public.checklist_red_flags (id, name, example, position, active)
  select item ->> 'id', item ->> 'name', item ->> 'example', position, true
  from jsonb_array_elements(p_red_flags) with ordinality as e (item, position)
  on conflict (id) do update
  set name = excluded.name,
    example = excluded.example,
    position = excluded.position,
    active = true;

  insert into public.company_rules (id, text, updated_at)
  values (1, p_rules, now())
  on conflict (id) do update
  set text = excluded.text, updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.save_checklist(jsonb, jsonb, text) to service_role;
