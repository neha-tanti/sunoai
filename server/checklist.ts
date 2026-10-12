import 'server-only';
import { Hono } from 'hono';
import type { SignedInEnv } from './auth';
import { createAdminClient } from './supabase';

export type Checklist = Awaited<ReturnType<typeof loadChecklist>>;

export async function loadChecklist() {
  const supabase = createAdminClient();
  const [checks, redFlags, rules] = await Promise.all([
    supabase
      .from('checklist_checks')
      .select('id, name, rule')
      .eq('active', true)
      .order('position'),
    supabase
      .from('checklist_red_flags')
      .select('id, name, example')
      .eq('active', true)
      .order('position'),
    supabase.from('company_rules').select('text').maybeSingle(),
  ]);
  if (checks.error) throw checks.error;
  if (redFlags.error) throw redFlags.error;
  if (rules.error) throw rules.error;

  return {
    checks: checks.data,
    red_flags: redFlags.data,
    rules: rules.data?.text ?? '',
  };
}

export const checklist = new Hono<SignedInEnv>().get('/', async (c) =>
  c.json(await loadChecklist()),
);
