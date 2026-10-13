import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { saveChecklistSchema } from '@/lib/checklist';
import type { Tables } from '@/lib/database.types';
import type { SignedInEnv } from './auth';
import { createAdminClient } from './supabase';
import { rejectInvalid } from './validate';

export type Checklist = {
  checks: Pick<Tables<'checklist_checks'>, 'id' | 'name' | 'rule'>[];
  red_flags: Pick<Tables<'checklist_red_flags'>, 'id' | 'name' | 'example'>[];
  rules: string;
};

export async function loadChecklist() {
  const loaded = await createAdminClient().rpc('load_checklist');
  if (loaded.error) throw loaded.error;

  return loaded.data as Checklist;
}

function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
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
