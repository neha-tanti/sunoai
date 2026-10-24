import { randomUUID } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '../supabase';

export function sessionCookieName(): string {
  return `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
}

export async function signInTeamLeader() {
  const admin = createAdminClient();
  const email = `team-leader-${randomUUID()}@example.test`;
  const password = randomUUID();

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;

  const jar = new Map<string, string>();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (cookies) => {
          for (const { name, value } of cookies) jar.set(name, value);
        },
      },
    },
  );
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;

  return {
    supabase: client,
    cookie: [...jar]
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('; '),
    deleteTeamLeader: async () => {
      const deleted = await admin.auth.admin.deleteUser(created.data.user.id);
      if (deleted.error) throw deleted.error;
    },
  };
}
