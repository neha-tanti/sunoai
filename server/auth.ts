import 'server-only';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createUserClient } from './supabase';

export type SignedInEnv = { Variables: { userId: string } };

export const requireUser = createMiddleware<SignedInEnv>(async (c, next) => {
  const { data, error } = await createUserClient(c).auth.getClaims();
  if (error || !data) throw new HTTPException(401);

  c.set('userId', data.claims.sub);
  await next();
});
