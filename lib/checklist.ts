import { z } from 'zod';

export const MAX_CHECKS = 20;
export const MAX_RED_FLAGS = 20;
export const NAME_MAX = 80;
export const DETAIL_MAX = 300;
export const RULES_MAX = 2000;
export const ID_MAX = 64;
export const HANDOVER_CHECK_ID = 'smooth_handover';

const itemId = z
  .string()
  .max(ID_MAX)
  .regex(/^[a-z0-9_]+$/)
  .optional();
const name = z.string().trim().min(1).max(NAME_MAX);
const detail = z.string().trim().min(1).max(DETAIL_MAX);

const uniqueIds = (items: { id?: string }[]) => {
  const ids = items.flatMap((item) => (item.id ? [item.id] : []));
  return new Set(ids).size === ids.length;
};

export const checklistVersion = z.iso.datetime({ offset: true });

export const saveChecklistSchema = z.object({
  checks: z
    .array(z.object({ id: itemId, name, rule: detail }))
    .max(MAX_CHECKS)
    .refine(uniqueIds)
    .refine((checks) => checks.some((check) => check.id === HANDOVER_CHECK_ID)),
  red_flags: z
    .array(z.object({ id: itemId, name, example: detail }))
    .max(MAX_RED_FLAGS)
    .refine(uniqueIds),
  rules: z.string().trim().max(RULES_MAX),
  version: checklistVersion,
});

export type SaveChecklist = z.input<typeof saveChecklistSchema>;
