import { randomUUID } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { assertNotDevProject } from '../../scripts/test-project.mjs';
import { createAdminClient } from '../supabase';

function testProject() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      'API tests need the Supabase test project. Create .env.test.local (see README).',
    );
  }
  assertNotDevProject(url);
  return { url, publishableKey };
}

export function sessionCookieName(): string {
  return `sb-${new URL(testProject().url).hostname.split('.')[0]}-auth-token`;
}

export async function signInTeamLeader() {
  const { url, publishableKey } = testProject();
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
  const client = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value } of cookies) jar.set(name, value);
      },
    },
  });
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
