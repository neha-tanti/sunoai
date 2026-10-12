import 'server-only';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createUserClient } from './supabase';

export const requireUser = createMiddleware(async (c, next) => {
  const { data, error } = await createUserClient(c).auth.getClaims();
  if (error || !data) throw new HTTPException(401);

  await next();
});
