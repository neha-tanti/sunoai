import 'server-only';
import { Hono } from 'hono';
import type { SignedInEnv } from './auth';

export const checklist = new Hono<SignedInEnv>().get('/', async (c) => {
  const supabase = c.var.supabase;
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

  return c.json({
    checks: checks.data,
    red_flags: redFlags.data,
    rules: rules.data?.text ?? '',
  });
});
