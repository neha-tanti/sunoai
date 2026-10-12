import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { saveChecklistSchema } from '@/lib/checklist';
import type { SignedInEnv } from './auth';
import { createAdminClient } from './supabase';
import { rejectInvalid } from './validate';

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

function slugify(name: string) {
  return name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 48)
    .replace(/^_+|_+$/g, '');
}

function withIds<T extends { id?: string; name: string }>(
  items: T[],
  fallback: string,
) {
  const taken = new Set(items.flatMap((item) => (item.id ? [item.id] : [])));
  return items.map((item) => {
    if (item.id) return { ...item, id: item.id };

    const base = slugify(item.name) || fallback;
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
    taken.add(id);
    return { ...item, id };
  });
}

export const checklist = new Hono<SignedInEnv>()
  .get('/', async (c) => c.json(await loadChecklist()))
  .put(
    '/',
    zValidator('json', saveChecklistSchema, rejectInvalid),
    async (c) => {
      const body = c.req.valid('json');
      const saved = await createAdminClient().rpc('save_checklist', {
        p_checks: withIds(body.checks, 'check'),
        p_red_flags: withIds(body.red_flags, 'red_flag'),
        p_rules: body.rules,
      });
      if (saved.error) throw saved.error;

      return c.body(null, 204);
    },
  );
