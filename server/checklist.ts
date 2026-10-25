import 'server-only';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { checklistVersion, ID_MAX, saveChecklistSchema } from '@/lib/checklist';
import type { SignedInEnv } from './auth';
import { ApiError } from './errors';
import { createAdminClient } from './supabase';
import { rejectInvalid } from './validate';

const checklistSchema = z.object({
  checks: z.array(
    z.object({ id: z.string(), name: z.string(), rule: z.string() }),
  ),
  red_flags: z.array(
    z.object({ id: z.string(), name: z.string(), example: z.string() }),
  ),
  rules: z.string(),
});

const loadedChecklistSchema = checklistSchema.extend({
  version: checklistVersion,
});

export type Checklist = z.infer<typeof checklistSchema>;

export async function loadChecklist() {
  const loaded = await createAdminClient().rpc('load_checklist');
  if (loaded.error) throw loaded.error;

  const { version, ...checklist } = loadedChecklistSchema.parse(loaded.data);
  return { version, checklist };
}

function slugify(name: string) {
  return name
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, ID_MAX - '_NN'.length)
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
  .get('/', async (c) => {
    const { version, checklist } = await loadChecklist();
    return c.json({ ...checklist, version, can_edit: !c.get('isAnonymous') });
  })
  .put(
    '/',
    zValidator('json', saveChecklistSchema, rejectInvalid),
    async (c) => {
      if (c.get('isAnonymous')) {
        throw new ApiError(
          403,
          'not_allowed',
          'Visitors can read the checklist but not change it.',
        );
      }
      const body = c.req.valid('json');
      const saved = await createAdminClient().rpc('save_checklist', {
        p_checks: withIds(body.checks, 'check'),
        p_red_flags: withIds(body.red_flags, 'red_flag'),
        p_rules: body.rules,
        p_version: body.version,
      });
      if (saved.error) throw saved.error;
      if (!saved.data) {
        throw new ApiError(
          409,
          'checklist_changed',
          'Someone else saved the checklist while you were editing. Reload the page to see their changes, then make yours again.',
        );
      }

      return c.body(null, 204);
    },
  );
