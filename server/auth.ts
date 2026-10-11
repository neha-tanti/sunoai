import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '@/lib/database.types';
import { createUserClient } from './supabase';

export type SignedInEnv = {
  Variables: { supabase: SupabaseClient<Database> };
};

export const requireUser = createMiddleware<SignedInEnv>(async (c, next) => {
  const supabase = createUserClient(c);
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) throw new HTTPException(401);

  c.set('supabase', supabase);
  await next();
});
