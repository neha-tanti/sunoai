import 'server-only';
import type { ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

export function rejectInvalid(result: {
  success: boolean;
  target: keyof ValidationTargets;
}) {
  if (result.success) return;
  throw new HTTPException(result.target === 'param' ? 404 : 400);
}

export const callIdParam = z.object({ id: z.uuid() });
