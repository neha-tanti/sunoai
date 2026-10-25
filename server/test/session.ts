import { randomUUID } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '../supabase';

export function sessionCookieName(): string {
  return `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
}

async function signedInSession(
  signIn: (client: SupabaseClient) => Promise<{ error: Error | null }>,
) {
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
  const signedIn = await signIn(client);
  if (signedIn.error) throw signedIn.error;

  const claims = await client.auth.getClaims();
  if (claims.error || !claims.data) {
    throw claims.error ?? new Error('No session after sign-in');
  }

  return {
    supabase: client,
    userId: claims.data.claims.sub,
    cookie: [...jar]
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('; '),
  };
}

async function deleteUser(id: string) {
  const deleted = await createAdminClient().auth.admin.deleteUser(id);
  if (deleted.error) throw deleted.error;
}

export async function signInTeamLeader() {
  const email = `team-leader-${randomUUID()}@example.test`;
  const password = randomUUID();

  const created = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;

  const session = await signedInSession((client) =>
    client.auth.signInWithPassword({ email, password }),
  );
  return {
    ...session,
    deleteTeamLeader: () => deleteUser(created.data.user.id),
  };
}

export async function signInVisitor() {
  const session = await signedInSession((client) =>
    client.auth.signInAnonymously(),
  );
  return { ...session, deleteVisitor: () => deleteUser(session.userId) };
}
