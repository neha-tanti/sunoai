import 'server-only';
import {
  createServerClient,
  parseCookieHeader,
  type CookieOptions,
} from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Context } from 'hono';
import { setCookie } from 'hono/cookie';
import type { CookieOptions as HonoCookieOptions } from 'hono/utils/cookie';
import type { Database } from '@/lib/database.types';
import { requireEnv } from './env';

function toHonoCookieOptions(options: CookieOptions): HonoCookieOptions {
  const { domain, expires, httpOnly, maxAge, path, secure, sameSite } = options;
  return {
    domain,
    expires,
    httpOnly,
    maxAge,
    path,
    secure,
    sameSite: sameSite === true ? 'Strict' : sameSite || undefined,
  };
}

export function createUserClient(c: Context) {
  return createServerClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => parseCookieHeader(c.req.header('Cookie') ?? ''),
        setAll: (cookies, headers) => {
          for (const { name, value, options } of cookies) {
            setCookie(c, name, value, toHonoCookieOptions(options));
          }
          for (const [name, value] of Object.entries(headers)) {
            c.header(name, value);
          }
        },
      },
    },
  );
}

export function createAdminClient() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SECRET_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
