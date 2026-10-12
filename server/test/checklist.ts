import { createAdminClient } from '../supabase';

export async function keepChecklist() {
  const supabase = createAdminClient();
  const [checks, redFlags, rules] = await Promise.all([
    supabase.from('checklist_checks').select(),
    supabase.from('checklist_red_flags').select(),
    supabase.from('company_rules').select(),
  ]);
  if (checks.error) throw checks.error;
  if (redFlags.error) throw redFlags.error;
  if (rules.error) throw rules.error;

  const quote = (ids: string[]) => `(${ids.map((id) => `"${id}"`).join(',')})`;

  return async function restoreChecklist() {
    const results = await Promise.all([
      supabase
        .from('checklist_checks')
        .delete()
        .not('id', 'in', quote(checks.data.map((row) => row.id))),
      supabase
        .from('checklist_red_flags')
        .delete()
        .not('id', 'in', quote(redFlags.data.map((row) => row.id))),
    ]);
    const restored = await Promise.all([
      supabase.from('checklist_checks').upsert(checks.data),
      supabase.from('checklist_red_flags').upsert(redFlags.data),
      supabase.from('company_rules').upsert(rules.data),
    ]);
    for (const result of [...results, ...restored]) {
      if (result.error) throw result.error;
    }
  };
}
