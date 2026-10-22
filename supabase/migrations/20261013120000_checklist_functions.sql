create function public.save_checklist(
  p_checks jsonb,
  p_red_flags jsonb,
  p_rules text,
  p_version timestamptz
)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  lock table public.checklist_checks, public.checklist_red_flags, public.company_rules
  in share row exclusive mode;

  if p_version is distinct from (select updated_at from public.company_rules where id = 1) then
    return false;
  end if;

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

  return true;
end;
$$;

grant execute on function public.save_checklist(jsonb, jsonb, text, timestamptz) to service_role;

create function public.load_checklist()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'checks', coalesce(
      (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'rule', rule) order by position)
       from public.checklist_checks
       where active),
      '[]'::jsonb
    ),
    'red_flags', coalesce(
      (select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'example', example) order by position)
       from public.checklist_red_flags
       where active),
      '[]'::jsonb
    ),
    'rules', coalesce((select text from public.company_rules where id = 1), ''),
    'version', (select updated_at from public.company_rules where id = 1)
  );
$$;

grant execute on function public.load_checklist() to service_role;
